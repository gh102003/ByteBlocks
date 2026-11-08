# ByteBlocks

ByteBlocks is an adaptive Python learning workspace with visual blocks, a
Monaco editor, browser-isolated Python execution, execution visualisation, and
text and voice coaching.

## Product demo

<video controls width="960" src="https://github.com/gh102003/ByteBlocks/raw/refs/heads/main/byteblocks/ByteBlocks-ad-v6-elevator-team.mp4">
  <a href="./byteblocks/ByteBlocks-ad-v6-elevator-team.mp4">Watch the 50-second ByteBlocks product demo</a>
</video>

[Watch or download the ByteBlocks product demo](./byteblocks/ByteBlocks-ad-v6-elevator-team.mp4)

## Running locally

ByteBlocks is a **browser application**, not an IDE plugin or extension. There
is no `.vsix`, JetBrains plugin `.zip`, editor-specific setting, or required
editor extension. The app source and configuration are in [`byteblocks/`](./byteblocks/);
the optional secured AI Worker is in [`cloudflare-worker/`](./cloudflare-worker/).

### Versions

- ByteBlocks app: `0.0.0`
- Node.js: **24** (the CI version)
- Browser: current Chromium-family browser; Playwright Chromium `1.65.0` runs
  the browser tests.
- Key packages: React `19.3.1`, Vite `8.3.6`, Monaco `0.57.0`, Pyodide
  `314.0.7`, Vercel AI SDK `7.0.164`, Auth0 React SDK `2.30.0`, and ElevenLabs
  React SDK `1.21.1`. Exact dependencies are locked in `package-lock.json`.

### Fresh clone and build

```sh
git clone <repository-url>
cd ByteBlocks/byteblocks
npm ci
cp .env.example .env
npm run dev
```

Open the local Vite URL printed in the terminal. To build the complete static
application, run:

```sh
npm run build
npm run preview
```

This creates `byteblocks/dist/`; serve it over HTTP(S), rather than opening
`index.html` directly. Full setup, test, configuration, and deployment notes
are in the [app README](./byteblocks/README.md).

### Starting an adaptive coaching session

1. Sign in with Auth0, then complete onboarding.
2. Select a mentor manually or choose **“Choose for me”** for the skills check
   and automatic calibration.
3. Open the workspace, choose a challenge, and message the coach. It receives
   current code, blocks, execution output, recent failed checks, and learner
   preferences.
4. To use voice, configure ElevenLabs as described in the app README, select
   **Start voice**, and grant microphone permission.

### Configuration that cannot be committed

Copy `byteblocks/.env.example` to `.env` for local development. Provider API
keys, Auth0 Management API credentials, ElevenLabs credentials, and Cloudflare
Worker `.dev.vars` must come from the evaluator's own accounts and must not be
committed. The Worker setup and its `wrangler.jsonc` configuration are covered
in the [Worker README](./cloudflare-worker/README.md).
