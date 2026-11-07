# Python runner IPC

Execution has three participants:

```text
React app ← MessageChannel → sandboxed iframe ← Worker messages → Python worker
```

Each run creates a new iframe, channel, and worker. Code and output stay in the browser.

## Startup and execution

1. After the iframe loads, the app sends `{ type: 'connect' }` with one transferred `MessagePort`. This initial `window.postMessage` uses `'*'` because the sandbox has an opaque origin. The iframe accepts it only from its parent, once.
2. The iframe replies `{ type: 'ready' }` through that private port.
3. The app sends `{ type: 'run', code, assets }` through the port. The iframe creates a worker and forwards `{ code, assets }` to it.
4. Worker events are forwarded unchanged through the port to the app.

`code` is the contents of `main.py`. `assets` contains `loader`, `core`, and `lockfile` strings, plus `wasm` and `stdlib` ArrayBuffers. The buffers are transferred to the iframe and then the worker; the app retains its own cached originals. The worker serves these bytes in memory without fetching runtime files itself.

## Events received by the app

| Type       | Other fields                        | Meaning                                                    |
| ---------- | ----------------------------------- | ---------------------------------------------------------- |
| `ready`    | —                                   | The iframe can accept its single run request.              |
| `running`  | —                                   | Python is initialized; the execution watchdog starts.      |
| `output`   | `entries: { kind, text }[]`         | Batched output. `kind` is `stdout`, `stderr`, or `system`. |
| `complete` | `duration: number`                  | Execution finished; duration is in milliseconds.           |
| `error`    | `text: string`, optional `duration` | Python, startup, or worker failure.                        |
| `limit`    | —                                   | Output exceeded its limit; terminate execution.            |

## Limits and cancellation

There are no stop requests, retries, or request IDs on the wire. The app cancels by closing the port and removing the iframe, which destroys its worker. Completion and errors use the same cleanup. A local generation counter ignores events from old runs.

Startup has a 60-second deadline; execution has five seconds after `running`. Output is bounded to 64K characters and 2,000 entries/writes, with checks in both the worker and app. Treat received data as untrusted: output is rendered as text, and messages cannot request app actions or network access.

The implementation lives in [`runner.ts`](../src/python/runner.ts), [`sandbox.ts`](../src/python/sandbox.ts), and [`sandbox-worker.js`](../src/python/sandbox-worker.js).
