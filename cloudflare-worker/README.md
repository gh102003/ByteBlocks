# ByteBlocks API Worker

This Worker streams Gemini or OpenAI chat and creates ElevenLabs WebRTC conversation tokens. Both routes require an Auth0 access token for this API; keys never go to the browser. It does not provide speech synthesis or a general-purpose provider proxy.

## Setup

1. In Auth0 create an API with an identifier such as `https://byteblocks-api`, using RS256. Enable **Allow Offline Access** on this API. On the Single Page Application, enable **Refresh Token Rotation** and the **Refresh Token** grant type (Advanced Settings → Grant Types). The frontend requests the API audience at login and renews tokens with refresh tokens rather than a hidden cross-site iframe, which can fail in Firefox and other browsers that block third-party cookies. Tokens stay in memory; after a reload or an expired refresh token, sign in again. Enable the appropriate application access. Restrict signups or otherwise control who can obtain access; authentication alone does not prevent a user from creating accounts or spending credits.
2. Edit `wrangler.jsonc`: set `AUTH0_ISSUER` to your Auth0 issuer **including the trailing slash**, `AUTH0_AUDIENCE` to that API's identifier, `ALLOWED_ORIGINS` to the exact comma-separated frontend origins, and `ELEVENLABS_AGENT_ID` to your private ElevenLabs agent. The default `CHAT_PROVIDER` is `gemini` and `GEMINI_MODEL` is `gemini-2.5-flash-lite`; choose a model available to your Google project. Pick rate-limit namespace IDs unique to your Cloudflare account. Remove localhost from production origins if not needed.
3. From this directory run `npm install`, then `npx wrangler login`. Set the secrets using `npx wrangler secret put GEMINI_API_KEY` and `npx wrangler secret put ELEVENLABS_API_KEY`; never put values into the configuration or frontend build. Run `npm run deploy`.
4. In the `byteblocks` build environment set `VITE_WORKER_URL` to the deployed Worker origin and `VITE_AUTH0_AUDIENCE` to the API identifier. Set `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` for your Auth0 application. Add the frontend URL to the Auth0 application's allowed callback URLs, logout URLs and web origins. Build and deploy the frontend again: Vite values are embedded at build time. Do not set `VITE_OPENAI_API_KEY` in the production build.

For local Worker development, use `.dev.vars` for secrets and `npm run dev`; this file is ignored by Git. Include the local frontend origin in `ALLOWED_ORIGINS` and configure Auth0 for it. The frontend's Vite voice endpoint is used only when `VITE_WORKER_URL` is unset.

### CORS troubleshooting

`ALLOWED_ORIGINS` must contain the frontend's origin, without a path, trailing slash, or hash. For the current hosted frontend this is `https://byteblocks-static.george-account-3f1.workers.dev`, without `/#workspace`. Set this variable on the API Worker, not the static frontend Worker. Keep the deployed variable and `wrangler.jsonc` in sync: Wrangler deploys the variables in this file.

The API permits `Authorization`, `Content-Type`, and the AI SDK's `User-Agent` request header. Preflights do not require authentication. A `403` with `{"error":"Origin not allowed."}` means the frontend origin is missing from the deployed allowlist; update it and deploy the Worker again. Deploy code changes too when changing allowed headers.

To switch back to OpenAI, set `CHAT_PROVIDER` to `openai`, choose `OPENAI_MODEL`, add the `OPENAI_API_KEY` Worker secret, and redeploy. Switching provider does not require a frontend rebuild. The Worker uses each provider's chat completions endpoint and sends the complete conversation on every turn. OpenAI requests use `store: false`. Gemini's data usage and retention policies are separate; see the pricing and terms for your tier.

This changes text chat only. The ElevenLabs voice agent's language model is configured separately in ElevenLabs. If upgrading from the earlier Worker that used `/v1/responses`, deploy this Worker and rebuild the frontend together because the Worker chat endpoint is now `/v1/chat/completions`.

## Cost and security

Cloudflare's free Workers plan currently includes 100,000 requests per day and 10 ms CPU per request; check [current limits](https://developers.cloudflare.com/workers/platform/limits/). Gemini has a free tier for eligible models, with project-level rate limits; see [pricing](https://ai.google.dev/gemini-api/docs/pricing) and [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits). Google states free-tier content may be used to improve its products, so review the data policy before sending workspace contents. Gemini paid usage, OpenAI and ElevenLabs can incur separate charges. Set provider-side limits and monitor usage. ElevenLabs voice sessions can continue consuming credits after a token is issued: configure the agent's maximum session duration and usage limits in ElevenLabs.

The per-user rate limits are approximate and local to each Cloudflare location, not global daily quotas or hard spending caps. They also do not stop someone creating multiple accounts. Use a strict centralized quota service if hard per-user or global limits are required. Configure a private ElevenLabs agent, restrict provider keys to the required permissions, and limit who can sign up. Do not rely on CORS to protect the API. The browser sends workspace context and instructions to the Worker; clients can alter both, so these are not a security boundary.

Chat is limited to 64 KiB of JSON input and 1,024 output tokens. The server fixes the model, rejects non-text input, and does not accept client-specified tools. `/v1/chat/completions` accepts text-only chat messages and returns a streamed chat-completions response; `/api/voice/session` returns `{ "conversationToken": "..." }`. Neither route returns provider error details to the client.

Run `npm test` for the Worker tests. They use generated signing keys and mocked provider calls; deployment and live provider access require your own accounts and configuration.
