// This source is sent to a blob worker inside an opaque-origin sandbox.
// No code submitted by the user runs in the app or the iframe itself.
const send = globalThis.postMessage.bind(globalThis)
const MAX_OUTPUT = 64 * 1024
const MAX_CHUNKS = 2000
let initialized = false

self.onmessage = async ({ data }) => {
  if (initialized) return
  initialized = true
  const { code, assets } = data
  let outputSize = 0
  let outputChunks = 0
  let outputLimited = false
  let pending = []
  let flushTimer

  const flush = () => {
    clearTimeout(flushTimer)
    flushTimer = undefined
    if (pending.length) send({ type: 'output', entries: pending.splice(0) })
  }
  const output = (kind, text) => {
    if (outputLimited) return
    const remaining = MAX_OUTPUT - outputSize
    const value = String(text).slice(0, remaining)
    outputSize += value.length
    outputChunks += 1
    if (value) pending.push({ kind, text: value })
    if (outputSize >= MAX_OUTPUT || outputChunks >= MAX_CHUNKS) {
      outputLimited = true
      pending.push({
        kind: 'system',
        text: '\nOutput limit reached (64K characters or 2,000 writes). Execution stopped.\n',
      })
      flush()
      send({ type: 'limit' })
      // The app also terminates the worker, even if Python catches this error.
      throw new Error('Output limit reached')
    }
    flushTimer ??= setTimeout(flush, 25)
  }

  try {
    // All runtime bytes come from the parent as data. This fetch replacement
    // serves only those in-memory assets; CSP independently blocks real network
    // access (including XMLHttpRequest, sockets, and remote module imports).
    const runtimeRoot = 'https://python-runtime.invalid/'
    globalThis.fetch = async (resource) => {
      const url = resource instanceof Request ? resource.url : String(resource)
      if (url === `${runtimeRoot}pyodide.asm.wasm`)
        return new Response(assets.wasm, {
          headers: { 'Content-Type': 'application/wasm' },
        })
      if (url === `${runtimeRoot}python_stdlib.zip`)
        return new Response(assets.stdlib, {
          headers: { 'Content-Type': 'application/zip' },
        })
      throw new TypeError('Network access is disabled in this Python sandbox.')
    }

    const loaderUrl = URL.createObjectURL(
      new Blob([assets.loader], { type: 'text/javascript' }),
    )
    const coreUrl = URL.createObjectURL(
      new Blob([assets.core], { type: 'text/javascript' }),
    )
    let pyodide
    try {
      const [{ loadPyodide }, { default: createPyodideModule }] =
        await Promise.all([import(loaderUrl), import(coreUrl)])
      pyodide = await loadPyodide({
        indexURL: runtimeRoot,
        lockFileContents: assets.lockfile,
        createPyodideModule,
        jsglobals: Object.create(null),
        stdin: () => null,
        stdout: (text) => output('stdout', `${text}\n`),
        stderr: (text) => output('stderr', `${text}\n`),
      })
    } finally {
      URL.revokeObjectURL(loaderUrl)
      URL.revokeObjectURL(coreUrl)
    }

    // Raw stream callbacks also capture print(..., end='') and flush output on
    // errors. Bounds apply before anything is copied into the main UI.
    const stdoutDecoder = new TextDecoder()
    const stderrDecoder = new TextDecoder()
    pyodide.setStdout({
      write: (buffer) => {
        output('stdout', stdoutDecoder.decode(buffer, { stream: true }))
        return buffer.length
      },
    })
    pyodide.setStderr({
      write: (buffer) => {
        output('stderr', stderrDecoder.decode(buffer, { stream: true }))
        return buffer.length
      },
    })
    pyodide.setStdin({ error: true })
    pyodide.FS.writeFile('/home/pyodide/main.py', code)
    const globals = pyodide.toPy({
      __name__: '__main__',
      __file__: '/home/pyodide/main.py',
    })
    send({ type: 'running' })
    const started = performance.now()
    try {
      // The filename gives useful source lines in errors. Top-level await is
      // supported as well as ordinary Python scripts.
      const result = await pyodide.runPythonAsync(code, {
        globals,
        filename: 'main.py',
        dedent: false,
      })
      result?.destroy?.()
      pyodide.runPython('import sys; sys.stdout.flush(); sys.stderr.flush()')
      flush()
      if (!outputLimited)
        send({
          type: 'complete',
          duration: Math.round(performance.now() - started),
        })
    } catch (error) {
      try {
        pyodide.runPython('import sys; sys.stdout.flush(); sys.stderr.flush()')
      } catch {
        /* Preserve the original error. */
      }
      flush()
      if (!outputLimited)
        send({
          type: 'error',
          text: String(error.message ?? error).slice(0, MAX_OUTPUT),
          duration: Math.round(performance.now() - started),
        })
    } finally {
      globals.destroy()
    }
  } catch (error) {
    flush()
    if (!outputLimited)
      send({
        type: 'error',
        text: `Python could not start: ${String(error.message ?? error).slice(0, 4000)}`,
      })
  }
}
