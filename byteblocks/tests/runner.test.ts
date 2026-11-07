import { describe, test } from 'vitest'
import { PythonRunner } from '../src/python/runner'
import type { RunnerState } from '../src/python/runner'
import { STARTER_CODE } from '../src/starter'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function text(state: RunnerState) {
  return state.output.map((entry) => entry.text).join('')
}

// Deliberately reach JS through an indirect constructor, rather than relying
// on the restricted `js` module. This tests the actual CSP/origin boundary.
const JS_ACCESS =
  "from pyodide.ffi import to_js\njs_eval = to_js([]).constructor.constructor('return eval')()\n"

function execute(
  code: string,
  options: { stop?: 'loading' | 'running'; inspect?: () => void } = {},
) {
  return new Promise<RunnerState>((resolve, reject) => {
    let stopped = false
    let inspected = false
    const guard = setTimeout(() => {
      runner.dispose()
      reject(new Error('Test timed out'))
    }, 65000)
    const runner = new PythonRunner((state) => {
      if (state.status === 'running' && !inspected) {
        inspected = true
        try {
          options.inspect?.()
        } catch (error) {
          clearTimeout(guard)
          runner.dispose()
          reject(error)
          return
        }
      }
      if (state.status === options.stop && !stopped) {
        stopped = true
        setTimeout(() => runner.stop(), 80)
      }
      if (['success', 'error', 'stopped'].includes(state.status)) {
        clearTimeout(guard)
        runner.dispose()
        resolve(state)
      }
    })
    void runner.run(code)
  })
}

const tests: { name: string; run: () => Promise<void> }[] = [
  {
    name: 'Starter solution prints [0, 1]',
    run: async () => {
      const result = await execute(STARTER_CODE)
      assert(
        result.status === 'success' && text(result) === '[0, 1]\n',
        text(result),
      )
    },
  },
  {
    name: 'Standard library, Unicode, stderr, and output without a newline',
    run: async () => {
      const result = await execute(
        'import math, sys, collections\nprint(math.isqrt(81))\nprint("héllo 🐍", end="", flush=True)\nprint("stderr message", file=sys.stderr)',
      )
      assert(
        result.status === 'success' &&
          text(result).includes('9\n') &&
          text(result).includes('héllo 🐍') &&
          result.output.some(
            (entry) =>
              entry.kind === 'stderr' && entry.text.includes('stderr message'),
          ),
        text(result),
      )
    },
  },
  {
    name: 'Syntax errors name main.py and the failing line',
    run: async () => {
      const result = await execute('def broken(:\n    pass')
      assert(
        result.status === 'error' &&
          text(result).includes('SyntaxError') &&
          text(result).includes('main.py'),
        text(result),
      )
    },
  },
  {
    name: 'Runtime errors preserve earlier output',
    run: async () => {
      const result = await execute('print("before error", end="")\n1 / 0')
      assert(
        result.status === 'error' &&
          text(result).includes('ZeroDivisionError') &&
          text(result).includes('before error'),
        text(result),
      )
    },
  },
  {
    name: 'Globals, files, and imported modules start fresh on every run',
    run: async () => {
      await execute(
        'sentinel = 42\nopen("sentinel.txt", "w").write("secret")\nimport math\nmath.sentinel = True',
      )
      const result = await execute(
        'import os, math\nprint("sentinel" in globals(), os.path.exists("sentinel.txt"), hasattr(math, "sentinel"))',
      )
      assert(
        result.status === 'success' &&
          text(result).trim() === 'False False False',
        text(result),
      )
    },
  },
  {
    name: 'Infinite loops stop after five seconds',
    run: async () => {
      const result = await execute('while True:\n    pass')
      assert(
        result.status === 'error' &&
          text(result).includes('Time limit exceeded') &&
          result.duration! >= 4900 &&
          result.duration! < 8000,
        text(result),
      )
    },
  },
  {
    name: 'Stop cancels runtime initialization',
    run: async () => {
      const result = await execute('print("should not run")', {
        stop: 'loading',
      })
      assert(
        result.status === 'stopped' && !text(result).includes('should not run'),
        text(result),
      )
    },
  },
  {
    name: 'Stop interrupts a running infinite loop',
    run: async () => {
      const result = await execute('while True:\n    pass', { stop: 'running' })
      assert(
        result.status === 'stopped' && result.duration! < 2000,
        text(result),
      )
    },
  },
  {
    name: 'Output flooding is bounded and execution stops',
    run: async () => {
      const result = await execute('while True:\n    print("x" * 1024)')
      assert(
        result.status === 'error' &&
          text(result).includes('Output limit reached') &&
          text(result).length < 67000,
        `status=${result.status}, output=${text(result).length}`,
      )
    },
  },
  {
    name: 'Sandbox has an opaque origin and cannot access the app document or storage',
    run: async () => {
      const result = await execute(
        JS_ACCESS +
          'print(js_eval("typeof document"))\nprint(js_eval("location.origin"))\ntry:\n    js_eval("indexedDB.open(\'byteblocks-probe\')")\nexcept Exception:\n    print("storage blocked")',
        {
          inspect: () => {
            const frame = document.querySelector(
              'iframe[title="Isolated Python runtime"]',
            ) as HTMLIFrameElement
            assert(
              frame?.getAttribute('sandbox') === 'allow-scripts',
              'Unexpected iframe permissions',
            )
            assert(
              frame.contentDocument === null,
              'Sandbox document should be inaccessible from the app',
            )
          },
        },
      )
      assert(
        result.status === 'success' &&
          text(result).includes('undefined') &&
          text(result).includes('null') &&
          text(result).includes('storage blocked'),
        text(result),
      )
    },
  },
  {
    name: 'Fetch, native XMLHttpRequest, and remote imports are blocked',
    run: async () => {
      const probe = `${location.origin}/__sandbox_probe__/attempt`
      const readAttempts = async () => {
        const response = await fetch(
          `${location.origin}/__sandbox_probe__/count`,
        )
        return ((await response.json()) as { attempts: number }).attempts
      }
      const before = await readAttempts()
      const result = await execute(
        JS_ACCESS +
          `print(js_eval("typeof XMLHttpRequest"))\ntry:\n    await js_eval("fetch('${probe}')")\nexcept Exception as error:\n    print('fetch blocked:', error)\ntry:\n    js_eval("(() => { const xhr = new XMLHttpRequest(); xhr.open('GET', '${probe}', false); xhr.send(); })()")\nexcept Exception:\n    print('xhr blocked')\ntry:\n    await js_eval("import('${probe}.js')")\nexcept Exception:\n    print('import blocked')`,
      )
      assert(
        result.status === 'success' &&
          text(result).includes('function') &&
          text(result).includes('Network access is disabled') &&
          text(result).includes('xhr blocked') &&
          text(result).includes('import blocked'),
        text(result),
      )
      assert(
        (await readAttempts()) === before,
        'The sandbox sent a network request',
      )
    },
  },
  {
    name: 'A successful run works after failures, timeout, and cancellation',
    run: async () => {
      const result = await execute('print("ready again")')
      assert(
        result.status === 'success' && text(result).trim() === 'ready again',
        text(result),
      )
      assert(
        document.querySelectorAll('iframe[title="Isolated Python runtime"]')
          .length === 0,
        'An execution frame was left behind',
      )
    },
  },
]

describe('Python runner in a real browser sandbox', () => {
  test.each(tests)('$name', async ({ run }) => {
    await run()
  })
})
