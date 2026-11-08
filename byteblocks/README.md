# ByteBlocks

A single-file Python practice workspace: Monaco on the left, tabbed helpers and an AI coach on the right. Built with React, TypeScript, and Vite.

## Product demo

[Watch the 50-second ByteBlocks product demo](./ByteBlocks-ad-v6-elevator-team.mp4)

The video introduces the visual-first workspace, then follows Nibble, Bite, and Chomp through a single Goal → Run → Complexity learning flow.

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

The resulting `dist/` is a static website. Serve it over HTTP(S), rather than opening `index.html` as a local file. Python execution needs no server, external CDN, API key, or cross-origin-isolation headers. The AI coach needs the configuration below.

## Running locally — evaluator handoff

ByteBlocks is a **browser application**, not an IDE plugin or extension. There
is no `.vsix`, JetBrains plugin `.zip`, editor-specific configuration, or
required editor extension. The full source is in this repository; the built
application is the `byteblocks/dist/` directory created by `npm run build`.

### Versions and prerequisites

- App: ByteBlocks `0.0.0`
- Runtime: Node.js **24** (the version used by CI); npm is bundled with Node.
- Browser: current Chromium-family browser. The test suite uses Playwright
  Chromium `1.65.0`.
- Core runtime packages: React `19.3.1`, Vite `8.3.6`, Monaco Editor `0.57.0`,
  Pyodide `314.0.7`, Vercel AI SDK `7.0.164`, Auth0 React SDK `2.30.0`, and
  ElevenLabs React SDK `1.21.1`. Exact transitive versions are pinned by
  `package-lock.json`.

No third-party editor plugins or extensions are needed. The committed
configuration is `vite.config.ts`, `vitest.config.ts`, TypeScript configs,
`.env.example`, and, when using the secured hosted AI path,
`../cloudflare-worker/wrangler.jsonc`.

### Fresh-clone setup

```sh
git clone <repository-url>
cd ByteBlocks/byteblocks
npm ci
cp .env.example .env
npm run dev
```

Open the Vite URL printed in the terminal. Python editing, blocks, execution,
visualisation, and challenges work with no credentials. For text coaching,
set `VITE_OPENAI_API_KEY` in `.env`, or configure the authenticated Worker as
described in the next section. Never commit `.env`, `.env.local`, or provider
keys.

### Starting a coaching session

1. Open the application and sign in with Auth0. If Auth0 is not configured,
   the rest of the workspace still opens but account-linked profiles are
   unavailable.
2. Complete onboarding. Select a mentor or choose **“Choose for me”** for the
   short skills check and automatic mentor calibration.
3. Open the workspace, choose a challenge, then ask the text coach a question.
   The coach receives the current code, blocks, challenge, execution output,
   recent failed checks, and learner preferences.
4. For voice coaching, configure ElevenLabs as below, then choose **Start
   voice** and grant microphone permission.

### Optional secured Worker and voice setup

The production architecture is a separate Cloudflare Worker in
`../cloudflare-worker`. It keeps Gemini/OpenAI and ElevenLabs secrets off the
browser and requires Auth0 API tokens. Its complete fresh-clone, configuration,
and deployment instructions are in [the Worker README](../cloudflare-worker/README.md).

For local development without that Worker, the Vite server can issue voice
tokens from server-only `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` values
in `.env.local`. Run the provisioning command shown in `.env.example` after
creating an ElevenLabs agent. These secrets, Auth0 Management API credentials,
and Cloudflare Worker `.dev.vars` cannot be committed and must be supplied by
the evaluator's own accounts.

### Build package and checks

```sh
npm run build          # creates byteblocks/dist/
npm run preview        # serves that build locally
npm run lint
npm run typecheck
npm run format:check
npx playwright install chromium
npm test
```

The resulting `dist/` directory contains the complete static application.
Deploy it over HTTP(S), not by opening `index.html` directly.

## AI coach

Copy `.env.example` to `.env` and set `VITE_OPENAI_API_KEY`, then start (or restart) Vite. The defaults are `VITE_AI_PROVIDER=openai` and `VITE_AI_MODEL=gpt-4.1-mini`. `VITE_AI_BASE_URL` optionally overrides the OpenAI Responses API base URL. These values are read at build time; rebuild static deployments after changing them.

Chat uses the Vercel AI SDK's `useChat` with a small browser transport calling `streamText` directly. There is no backend, agent harness, tool loop, or automatic code execution. Each turn includes the conversation history, current `main.py`, and latest Python execution status and output. Output may come from an earlier edit. Replies stream as Markdown, can be stopped, and failed turns can be retried. Messages last for the current page session.

This prototype intentionally ships the API key in the browser bundle and sends code, output, and chat to the selected provider. Keep `.env` out of source control. The rest of the workspace still works without a key; the coach shows setup instructions.

## Auth0 learning profiles

Signing in protects the workspace. The onboarding choices are also saved as
`user_metadata.byteblocks` on the signed-in Auth0 account, so a learner can
resume their mentor settings on another device. The browser sends its Auth0
access token only to the local `/api/auth/preferences` endpoint. That endpoint
uses `/userinfo` to identify the caller, then uses a server-only
Machine-to-Machine Management API credential to read or update that caller's
metadata. Never expose `AUTH0_MANAGEMENT_CLIENT_SECRET` to the browser.

Set the `VITE_AUTH0_*` and `AUTH0_*` values in `.env.local`; grant the
Machine-to-Machine application `read:users` and `update:users` in the Auth0
Management API. For a production/static deployment, provide an equivalent
authenticated server endpoint—the Vite middleware exists only during `npm run dev`.
Configure the exact application URL in Auth0's Allowed Callback URLs, Allowed
Logout URLs, and Allowed Web Origins.

Provider code lives in `src/ai/connectors/openai.ts`. To add another provider, implement `ChatConnector` using its AI SDK model factory and register it in `src/ai/connector.ts`, including any provider-specific credentials or defaults. Select it with `VITE_AI_PROVIDER`. The transport and UI depend only on the shared AI SDK model interface. A custom base URL must support the Responses API; a different API needs its own connector.

## What works

- Editing, undo, Python highlighting, indentation, find, and local autosave.
- Real Python execution with Pyodide (CPython/WebAssembly), stdout/stderr, and source-line tracebacks.
- Stop, a five-second execution watchdog, and output limits (64K characters / 2,000 writes).
- Goal, Complexity, Visualizer, and Output tabs; a live AI coach with code/output context, streaming, Markdown, stop, and retry.
- Recorded Python execution with forward/backward steps, a timeline, playback speed, source highlighting, and function scopes. Lists, stacks, queues, tuples, sets, dictionaries, and scalar variables display their recorded values and changes.

Open **Visualizer → Visualize code** to record the current blocks or Python source. Normal runs also record steps. A step shows state before its highlighted line, or at a return/exception; stepping backward replays snapshots without executing code again. Deques default to queue views. List views use stack names and `pop`/`popleft` usage as hints; use **View as** to choose the interpretation. Edits mark previous recordings as stale. Recordings are capped at 600 steps / 2 MB; Python continues after this cap. Snapshots show up to 40 variables per scope, 40 items per collection, 12 scopes, and 3 nested collection levels, with an additional snapshot size bound. Custom objects are shown by type. Replay is deterministic for a recording; programs using randomness or clocks can produce different recordings.

Complexity illustrates the supplied Two Sum solution; it does not analyze edits. Interactive stdin is not connected. Most of the bundled standard library is available; optional Pyodide packages and network access from Python are unavailable. Code is retained locally; coach messages last only for the current page session.

## Realtime voice coach

Each new voice call uses the selected mentor's voice: Nibble uses Minty — The Holiday Elf (goofy, mischievous American, high-pitched and slightly raspy), Bite uses George (warm British, middle pitch), and Chomp uses Brian (deep American). Auto level uses the same resolver as the avatar. A running call keeps its voice until the next call. The shared mapping lives in `src/ai/mentorVoices.ts`; agent setup enables only the voice-ID override needed for this selection. Minty is a shared library voice: add it to the ElevenLabs account's My Voices before provisioning an agent in another account (voice ID `1lXLcaBSLzgfQ2dCVmRt`).

Click **Start voice** in the coach composer, then grant microphone access. The private ElevenLabs agent uses `eleven_realtime_v1_mini` speech-to-speech over the ElevenLabs WebRTC client, with interruption handling and a mute/end control. Vercel AI SDK continues to handle text chat. Both coaches receive the current code, blocks, stage, execution output, preferences, and conversation history. Voice transcripts also appear in text chat; live workspace updates are debounced while connected.

Voice tools can read the workspace, current stage and test cases, execution/trace, and test results; run the current editor contents; stop execution; and check the current stage. They accept no source code and have no editor setters or stage advancement. Runs use the existing isolated Python sandbox and its limits. Run/check tools start work; the coach reads results separately and checks whether their source matches current edits.

The local voice endpoint loads `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` from `.env.local` at Vite startup and returns only a temporary conversation token. Restart Vite after changing configuration. To provision another private agent after onboarding, run `node --env-file=.env.local scripts/setup-voice-agent.mjs`; it appends the new agent ID locally and verifies realtime mode. The account must have realtime model access. No live audio test is run automatically.

The token endpoint runs only with the Vite development server. Static builds and `vite preview` need a separately deployed, authenticated and rate-limited `/api/voice/session` POST endpoint returning `{ "conversationToken": "..." }` using the server-side SDK; never expose the ElevenLabs key as a `VITE_` variable. The local endpoint rejects cross-origin requests. Voice audio, transcripts, and workspace context are sent to ElevenLabs while connected; server-side voice recording is disabled on the provisioned agent.

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

Tests use **Vitest Browser Mode** with Playwright, running real Python in a real browser. They cover successful scripts, standard-library imports, Unicode, source-line errors, clean globals/files/modules, cancellation, timeouts, output flooding, opaque-origin DOM/storage isolation, blocked fetch/XHR/module imports, and the desktop editor, tabs, dividers, and AI chat. Chat tests intercept provider requests and stream local fixtures; no real API credentials or paid requests are needed. The isolation checks deliberately reach JavaScript through an indirect constructor to exercise CSP rather than merely relying on restricted imports.

`npm run test:watch` starts Vitest in watch mode. `VITEST_BROWSER=webkit npm test` selects WebKit after `npx playwright install webkit`. On Linux, Playwright may also need OS dependencies installed with `npx playwright install --with-deps chromium webkit`.

`npm run format` applies Prettier to the app and GitHub workflow. Oxlint fails on warnings; TypeScript checks app code, tests, and tooling configs.

The root `.github/workflows/ci.yml` runs on pushes and pull requests. It checks Oxlint, TypeScript, Prettier, and the production build, with separate Vitest jobs for Chromium and WebKit on Node 24. No credentials or external execution service are needed.
