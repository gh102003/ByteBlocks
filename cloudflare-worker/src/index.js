import { createRemoteJWKSet, jwtVerify } from "jose";

const keySets = new Map();
const MAX_BODY = 64 * 1024;

function json(status, message) {
  return Response.json({ error: message }, { status });
}

async function authenticate(request, env) {
  if (!env.AUTH0_ISSUER || !env.AUTH0_AUDIENCE)
    throw new Error("Missing auth configuration");
  const issuer = new URL(env.AUTH0_ISSUER);
  if (
    issuer.protocol !== "https:" ||
    issuer.pathname !== "/" ||
    issuer.search ||
    issuer.hash
  )
    throw new Error("Invalid issuer");
  const match = /^Bearer ([^\s]+)$/.exec(
    request.headers.get("Authorization") || "",
  );
  if (!match) return null;
  if (!keySets.has(issuer.href))
    keySets.set(
      issuer.href,
      createRemoteJWKSet(new URL(".well-known/jwks.json", issuer)),
    );
  try {
    const { payload } = await jwtVerify(match[1], keySets.get(issuer.href), {
      issuer: issuer.href,
      audience: env.AUTH0_AUDIENCE,
      algorithms: ["RS256"],
      requiredClaims: ["sub", "exp"],
    });
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

async function readBody(request) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return null;
  if (Number(request.headers.get("content-length")) > MAX_BODY || !request.body)
    return null;
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BODY) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function validInput(input) {
  return (
    Array.isArray(input) &&
    input.length > 0 &&
    input.length <= 100 &&
    input.every(
      (item) =>
        item &&
        typeof item === "object" &&
        ["user", "assistant", "system"].includes(item.role) &&
        (typeof item.content === "string" ||
          (Array.isArray(item.content) &&
            item.content.every(
              (part) =>
                part && part.type === "text" && typeof part.text === "string",
            ))),
    )
  );
}

async function chat(request, env) {
  const providers = {
    gemini: {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      key: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL,
    },
    openai: {
      url: "https://api.openai.com/v1/chat/completions",
      key: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
    },
  };
  const provider =
    Object.hasOwn(providers, env.CHAT_PROVIDER) && providers[env.CHAT_PROVIDER];
  if (!provider || !provider.key || !provider.model)
    return json(503, "Chat is not configured.");
  const body = await readBody(request);
  if (!body || !validInput(body.messages))
    return json(400, "Invalid chat request.");
  const messages = body.messages.map(({ role, content }) => ({
    role,
    content:
      typeof content === "string"
        ? content
        : content.map(({ text }) => text).join(""),
  }));
  const response = await fetch(provider.url, {
    method: "POST",
    signal: request.signal,
    headers: {
      Authorization: `Bearer ${provider.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      stream: true,
      ...(env.CHAT_PROVIDER === "openai"
        ? { store: false, max_completion_tokens: 1024 }
        : { max_tokens: 1024 }),
    }),
  });
  if (!response.ok)
    return json(
      response.status === 429 ? 429 : 502,
      "Chat provider request failed.",
    );
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
    },
  });
}

async function voice(env) {
  if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_AGENT_ID)
    return json(503, "Voice is not configured.");
  const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/token");
  url.searchParams.set("agent_id", env.ELEVENLABS_AGENT_ID);
  const response = await fetch(url, {
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
  });
  if (!response.ok)
    return json(
      response.status === 429 ? 429 : 502,
      "Voice provider request failed.",
    );
  const data = await response.json();
  if (typeof data.token !== "string")
    return json(502, "Voice provider returned an invalid response.");
  return Response.json(
    { conversationToken: data.token },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function handle(request, env, verify = authenticate) {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (origin && !allowed.includes(origin))
    return json(403, "Origin not allowed.");
  const cors = new Headers({ Vary: "Origin", "Cache-Control": "no-store" });
  if (origin) cors.set("Access-Control-Allow-Origin", origin);
  const respond = (response) => {
    for (const [key, value] of cors) response.headers.set(key, value);
    return response;
  };
  if (request.method === "OPTIONS") {
    cors.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    cors.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    return new Response(null, { status: 204, headers: cors });
  }
  const path = new URL(request.url).pathname;
  if (!["/v1/chat/completions", "/api/voice/session"].includes(path))
    return respond(json(404, "Not found."));
  if (request.method !== "POST") return respond(json(405, "Use POST."));
  try {
    const subject = await verify(request, env);
    if (!subject) return respond(json(401, "Sign in to use the coach."));
    const limiter =
      path === "/v1/chat/completions" ? env.CHAT_LIMIT : env.VOICE_LIMIT;
    if (!limiter) return respond(json(503, "Rate limiter is not configured."));
    if (!(await limiter.limit({ key: subject })).success)
      return respond(json(429, "Too many requests. Try again shortly."));
    return respond(
      await (path === "/v1/chat/completions" ? chat(request, env) : voice(env)),
    );
  } catch {
    return respond(json(502, "The service is temporarily unavailable."));
  }
}

export default {
  fetch(request, env) {
    return handle(request, env);
  },
};
