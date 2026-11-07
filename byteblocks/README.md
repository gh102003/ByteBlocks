# ByteBlocks

A single-file Python practice workspace: Monaco on the left, tabbed helpers and a coach preview on the right. Built with React, TypeScript, and Vite.

## Run locally

```sh
npm ci
npm run dev
```

Open the printed local URL. Use **Run code** or **Ctrl/⌘ + Enter** in the editor. Code autosaves to this browser’s local storage. Drag either divider, or focus it and use the arrow keys, to resize the panels. On screens below 761px, the panels stack vertically.

```sh
npm run build
npm run preview
```

The resulting `dist/` is a static website. Serve it over HTTP(S), rather than opening `index.html` as a local file. No Python execution server, external CDN, API key, or cross-origin-isolation headers are required.

## What works

- Editing, undo, Python highlighting, indentation, find, and local autosave.
- Real Python execution with Pyodide (CPython/WebAssembly), stdout/stderr, and source-line tracebacks.
- Stop, a five-second execution watchdog, and output limits (64K characters / 2,000 writes).
- Goal, Complexity, Dataflow, and Output tabs; a coach composer with explicitly labeled sample responses.

Complexity and dataflow illustrate the supplied Two Sum solution; they do not analyze edits. Live AI and interactive stdin are not connected. Most of the bundled standard library is available; optional Pyodide packages and network access are unavailable. Code is retained locally; coach messages last only for the current page session.

## Execution isolation

The app fetches its own bundled runtime assets on first Run, then passes copies into an iframe with `sandbox="allow-scripts"` (no `allow-same-origin`). That opaque-origin document creates a dedicated blob Worker; Python never executes in the app or the frame’s main thread. The bootstrap uses a classic Worker for WebKit compatibility and dynamically imports the Pyodide ESM runtime inside it.

The frame’s CSP is inherited by its blob Worker: no network connections, remote scripts, subframes, images, forms, or base URL changes. Only nonce-authorized bootstrap / blob scripts and Pyodide’s necessary evaluation capability are allowed in the isolated frame. A fetch adapter serves only the runtime’s in-memory WASM and standard-library bytes. The `js` import starts with empty globals; the CSP remains the boundary even if code reaches JavaScript through Pyodide’s FFI.

The app communicates through a private MessageChannel, accepts bounded text/status messages, and renders output as text. Each run gets an entirely new frame/worker/filesystem. Stop, timeout, errors, completion, and unmount remove the frame and its owning Worker. Startup has a separate 60-second deadline. Resource limits are best-effort browser protections, not hard memory quotas; deliberate memory exhaustion can still crash a browser tab.

Pyodide is pinned because its offline `createPyodideModule` hook is experimental. Monaco is pinned to the integration tested here. DOMPurify is overridden to a patched release because Monaco’s pinned transitive version has published advisories.

## Tests and CI

```sh
npx playwright install chromium
npm test
npm run lint
npm run typecheck
npm run format:check
```

Tests use **Vitest Browser Mode** with Playwright, running real Python in a real browser. They cover successful scripts, standard-library imports, Unicode, source-line errors, clean globals/files/modules, cancellation, timeouts, output flooding, opaque-origin DOM/storage isolation, blocked fetch/XHR/module imports, and the desktop editor, tabs, dividers, and coach composer. The isolation checks deliberately reach JavaScript through an indirect constructor to exercise CSP rather than merely relying on restricted imports.

`npm run test:watch` starts Vitest in watch mode. `VITEST_BROWSER=webkit npm test` selects WebKit after `npx playwright install webkit`. On Linux, Playwright may also need OS dependencies installed with `npx playwright install --with-deps chromium webkit`.

`npm run format` applies Prettier to the app and GitHub workflow. Oxlint fails on warnings; TypeScript checks app code, tests, and tooling configs.

The root `.github/workflows/ci.yml` runs on pushes and pull requests. It checks Oxlint, TypeScript, Prettier, and the production build, with separate Vitest jobs for Chromium and WebKit on Node 24. No credentials or external execution service are needed.
