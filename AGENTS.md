# ByteBlocks notes

- The app lives in `byteblocks/`; run npm commands there. It uses React, TypeScript, Vite, Monaco, and browser-based Pyodide.
- AI chat uses Vercel AI SDK `useChat` and a thin browser transport calling `streamText`. Direct API calls and browser-visible keys are intentional for this prototype; keep the implementation free of an agent harness.
- Register providers in `src/ai/connector.ts`; provider implementations belong in `src/ai/connectors/`. Keep the chat UI and transport provider-independent.
- OpenAI uses the Responses API with `store: false`, so full conversation history, including partial replies, travels with each turn. Context includes current code and latest execution output, which may predate edits.
- Configuration is documented in `.env.example`. Vite reads `VITE_*` values at startup/build time. Never commit actual keys or `.env` files.
- Tests use Vitest Browser Mode and Playwright Chromium. Install it with `npx playwright install chromium`; use the same `PLAYWRIGHT_BROWSERS_PATH` for installation and tests if overriding its location.
- Chat tests intercept provider requests. Scope fetch mocks to provider URLs so Vitest's own requests still work. Vitest 5 uses `toMatchTextContent` for substring/regex checks; `toHaveTextContent` requires an exact match.
- Preserve Python's opaque-origin iframe/worker isolation and blocked network access when changing chat or execution code.
- Checks: `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build`.
