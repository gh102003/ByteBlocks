import { createSandboxDocument } from './sandbox'
import type { RuntimeAssets } from './assets'

export type RunnerStatus =
  'idle' | 'loading' | 'running' | 'success' | 'error' | 'stopped'
export type OutputEntry = { kind: 'stdout' | 'stderr' | 'system'; text: string }
export type RunnerState = {
  status: RunnerStatus
  output: OutputEntry[]
  duration: number | null
}
export const INITIAL_RUNNER_STATE: RunnerState = {
  status: 'idle',
  output: [],
  duration: null,
}
const EXECUTION_TIMEOUT = 5000
const INITIALIZATION_TIMEOUT = 60000
const MAX_OUTPUT = 64 * 1024
const MAX_ENTRIES = 2000

export class PythonRunner {
  private readonly onChange: (state: RunnerState) => void
  private state: RunnerState = INITIAL_RUNNER_STATE
  private iframe?: HTMLIFrameElement
  private port?: MessagePort
  private timer?: ReturnType<typeof setTimeout>
  private runId = 0
  private started = 0
  private outputSize = 0

  constructor(onChange: (state: RunnerState) => void) {
    this.onChange = onChange
  }

  private update(change: Partial<RunnerState>) {
    this.state = { ...this.state, ...change }
    this.onChange(this.state)
  }

  private teardown() {
    clearTimeout(this.timer)
    this.port?.close()
    this.port = undefined
    // Removing the owning document destroys its dedicated worker, including
    // stuck Python/JS. No cooperative interrupt or SharedArrayBuffer is needed.
    this.iframe?.remove()
    this.iframe = undefined
  }

  private finish(status: RunnerStatus, message?: string, duration?: number) {
    this.runId++
    this.teardown()
    const output = message
      ? [...this.state.output, { kind: 'system' as const, text: message }]
      : this.state.output
    this.update({
      status,
      output,
      duration:
        duration ??
        (this.started ? Math.round(performance.now() - this.started) : null),
    })
  }

  private append(entries: unknown): boolean {
    if (!Array.isArray(entries)) return true
    const accepted: OutputEntry[] = []
    for (const entry of entries.slice(0, MAX_ENTRIES + 1)) {
      if (
        !entry ||
        typeof entry.text !== 'string' ||
        !['stdout', 'stderr', 'system'].includes(entry.kind)
      )
        continue
      const remaining = MAX_OUTPUT - this.outputSize
      if (
        remaining <= 0 ||
        this.state.output.length + accepted.length >= MAX_ENTRIES
      ) {
        if (accepted.length)
          this.update({ output: [...this.state.output, ...accepted] })
        this.finish('error', '\nOutput limit reached. Execution stopped.\n')
        return false
      }
      const text = entry.text.slice(0, remaining)
      this.outputSize += text.length
      accepted.push({ kind: entry.kind, text })
      if (entry.text.length > remaining) {
        this.update({ output: [...this.state.output, ...accepted] })
        this.finish('error', '\nOutput limit reached. Execution stopped.\n')
        return false
      }
    }
    if (accepted.length)
      this.update({ output: [...this.state.output, ...accepted] })
    return true
  }

  async run(code: string) {
    if (this.state.status === 'loading' || this.state.status === 'running')
      return
    this.teardown()
    const id = ++this.runId
    this.started = 0
    this.outputSize = 0
    this.update({ status: 'loading', output: [], duration: null })
    this.timer = setTimeout(() => {
      this.runId++
      this.finish(
        'error',
        'Python initialization timed out. Please try again.\n',
      )
    }, INITIALIZATION_TIMEOUT)

    try {
      const { loadRuntimeAssets } = await import('./assets')
      const cachedAssets = await loadRuntimeAssets()
      if (id !== this.runId) return
      // Keep cached originals in the app. Only copies go into untrusted code.
      const assets: RuntimeAssets = {
        ...cachedAssets,
        wasm: cachedAssets.wasm.slice(0),
        stdlib: cachedAssets.stdlib.slice(0),
      }
      const iframe = document.createElement('iframe')
      iframe.setAttribute('sandbox', 'allow-scripts')
      iframe.setAttribute('aria-hidden', 'true')
      iframe.setAttribute('title', 'Isolated Python runtime')
      iframe.hidden = true
      iframe.srcdoc = createSandboxDocument()
      this.iframe = iframe
      const channel = new MessageChannel()
      let sent = false
      this.port = channel.port1
      channel.port1.onmessage = ({ data }) => {
        if (id !== this.runId || !data || typeof data !== 'object') return
        switch (data.type) {
          case 'ready':
            if (sent) break
            sent = true
            channel.port1.postMessage({ type: 'run', code, assets }, [
              assets.wasm,
              assets.stdlib,
            ])
            break
          case 'running':
            if (this.state.status !== 'loading') break
            clearTimeout(this.timer)
            this.started = performance.now()
            this.update({ status: 'running' })
            this.timer = setTimeout(
              () =>
                this.finish(
                  'error',
                  'Time limit exceeded (5 seconds). Execution stopped.\n',
                ),
              EXECUTION_TIMEOUT,
            )
            break
          case 'output':
            this.append(data.entries)
            break
          case 'limit':
            this.finish('error', '\nOutput limit reached. Execution stopped.\n')
            break
          case 'complete':
            this.finish('success', undefined, this.readDuration(data.duration))
            break
          case 'error':
            if (
              typeof data.text === 'string' &&
              this.append([{ kind: 'stderr', text: `${data.text}\n` }])
            )
              this.finish('error', undefined, this.readDuration(data.duration))
            break
        }
      }
      channel.port1.start()
      iframe.onload = () => {
        if (id === this.runId)
          iframe.contentWindow?.postMessage({ type: 'connect' }, '*', [
            channel.port2,
          ])
      }
      document.body.append(iframe)
    } catch (error) {
      if (id === this.runId)
        this.finish(
          'error',
          `${error instanceof Error ? error.message : 'Python could not start.'}\n`,
        )
    }
  }

  private readDuration(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? Math.min(Math.round(value), EXECUTION_TIMEOUT)
      : undefined
  }

  stop() {
    if (this.state.status !== 'loading' && this.state.status !== 'running')
      return
    this.runId++
    this.finish(
      'stopped',
      'Stopped. Your code is ready to edit and run again.\n',
    )
  }

  clear() {
    if (this.state.status === 'loading' || this.state.status === 'running')
      return
    this.update(INITIAL_RUNNER_STATE)
  }

  dispose() {
    this.runId++
    this.teardown()
  }
}
