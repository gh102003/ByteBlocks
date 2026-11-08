import { test } from "node:test";
import assert from "node:assert/strict";
import { handle } from "../src/index.js";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

const env = {
  ALLOWED_ORIGINS: "https://example.com",
  CHAT_PROVIDER: "openai",
  OPENAI_MODEL: "gpt-4.1-mini",
  OPENAI_API_KEY: "secret",
  ELEVENLABS_API_KEY: "voice-secret",
  ELEVENLABS_AGENT_ID: "agent_test",
  CHAT_LIMIT: { limit: async () => ({ success: true }) },
  VOICE_LIMIT: { limit: async () => ({ success: true }) },
};
const auth = async () => "user-1";
const request = (path, body) =>
  new Request(`https://worker.test${path}`, {
    method: "POST",
    headers: {
      Origin: "https://example.com",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

test("allows browser preflights for chat and voice without authentication", async () => {
  for (const path of ["/v1/chat/completions", "/api/voice/session"]) {
    const requestedHeaders = ["authorization", "content-type", "user-agent"];
    const response = await handle(
      new Request(`https://worker.test${path}`, {
        method: "OPTIONS",
        headers: {
          Origin: "https://example.com",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": requestedHeaders.join(", "),
        },
      }),
      env,
      async () => {
        assert.fail("Preflights must not require an access token");
      },
    );
    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("Access-Control-Allow-Origin"),
      "https://example.com",
    );
    assert.match(response.headers.get("Access-Control-Allow-Methods"), /POST/);
    const allowedHeaders = response.headers
      .get("Access-Control-Allow-Headers")
      .toLowerCase()
      .split(",")
      .map((header) => header.trim());
    for (const header of requestedHeaders)
      assert.ok(allowedHeaders.includes(header), `${header} must be allowed`);
    assert.equal(response.headers.get("Vary"), "Origin");
  }
});

test("rejects preflights from disallowed origins", async () => {
  const response = await handle(
    new Request("https://worker.test/v1/chat/completions", {
      method: "OPTIONS",
      headers: {
        Origin: "https://evil.example",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers":
          "authorization, content-type, user-agent",
      },
    }),
    env,
    auth,
  );
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
});

test("rejects unauthenticated and rate limited requests", async () => {
  assert.equal(
    (await handle(request("/v1/chat/completions", {}), env, async () => null))
      .status,
    401,
  );
  assert.equal(
    (
      await handle(
        request("/v1/chat/completions", {}),
        { ...env, CHAT_LIMIT: { limit: async () => ({ success: false }) } },
        auth,
      )
    ).status,
    429,
  );
});

test("chat fixes model, storage, output limit and streams upstream", async () => {
  const original = globalThis.fetch;
  let outgoing;
  globalThis.fetch = async (url, options) => {
    outgoing = { url, ...options };
    return new Response("data: test\n\n");
  };
  try {
    const response = await handle(
      request("/v1/chat/completions", {
        messages: [{ role: "user", content: "hello" }],
        model: "expensive",
        store: true,
        tools: [{ type: "web_search" }],
      }),
      env,
      auth,
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "data: test\n\n");
    const body = JSON.parse(outgoing.body);
    assert.equal(body.model, "gpt-4.1-mini");
    assert.equal(body.store, false);
    assert.equal(body.max_completion_tokens, 1024);
    assert.equal(body.tools, undefined);
    assert.equal(outgoing.headers.Authorization, "Bearer secret");
    assert.equal(
      (
        await handle(
          request("/v1/chat/completions", {
            messages: [
              {
                role: "user",
                content: [
                  { type: "image_url", image_url: "https://example.com" },
                ],
              },
            ],
          }),
          env,
          auth,
        )
      ).status,
      400,
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("Gemini uses its own key and model, preserves history and streams", async () => {
  const original = globalThis.fetch;
  let outgoing;
  globalThis.fetch = async (url, options) => {
    outgoing = { url, ...options };
    return new Response(
      'data: {"choices":[{"delta":{"content":"hello"}}]}\n\n',
    );
  };
  try {
    const response = await handle(
      request("/v1/chat/completions", {
        messages: [
          { role: "system", content: "Be helpful" },
          { role: "user", content: "Hi" },
          { role: "assistant", content: "Hello" },
          { role: "user", content: [{ type: "text", text: "Continue" }] },
        ],
        model: "not-allowed",
        max_tokens: 99999,
        tools: [{ type: "function" }],
      }),
      {
        ...env,
        CHAT_PROVIDER: "gemini",
        GEMINI_API_KEY: "gemini-secret",
        GEMINI_MODEL: "gemini-2.5-flash-lite",
      },
      auth,
    );
    assert.equal(response.status, 200);
    assert.match(await response.text(), /hello/);
    assert.equal(
      outgoing.url,
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    );
    assert.equal(outgoing.headers.Authorization, "Bearer gemini-secret");
    const body = JSON.parse(outgoing.body);
    assert.equal(body.model, "gemini-2.5-flash-lite");
    assert.equal(body.messages.length, 4);
    assert.equal(body.messages[3].content, "Continue");
    assert.equal(body.max_tokens, 1024);
    assert.equal(body.store, undefined);
    assert.equal(body.tools, undefined);
    assert.equal(
      (
        await handle(
          request("/v1/chat/completions", {
            messages: [{ role: "user", content: "hi" }],
          }),
          { ...env, CHAT_PROVIDER: "missing" },
          auth,
        )
      ).status,
      503,
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("voice returns only the session token", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ token: "temporary", conversation_id: "private" });
  try {
    const response = await handle(request("/api/voice/session", {}), env, auth);
    assert.deepEqual(await response.json(), { conversationToken: "temporary" });
  } finally {
    globalThis.fetch = original;
  }
});

test("rejects disallowed origins and oversize inputs", async () => {
  assert.equal(
    (
      await handle(
        new Request("https://worker.test/v1/chat/completions", {
          method: "POST",
          headers: { Origin: "https://evil.example" },
        }),
        env,
        auth,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handle(
        request("/v1/chat/completions", {
          messages: [{ role: "user", content: "x".repeat(70000) }],
        }),
        env,
        auth,
      )
    ).status,
    400,
  );
});

test("validates Auth0 signature, issuer and audience before contacting providers", async () => {
  const original = globalThis.fetch;
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "test", alg: "RS256" };
  let upstream = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes("/.well-known/jwks.json"))
      return Response.json({ keys: [jwk] });
    upstream++;
    return new Response("stream");
  };
  try {
    const issuer = "https://auth.example.com/";
    const configured = {
      ...env,
      AUTH0_ISSUER: issuer,
      AUTH0_AUDIENCE: "byteblocks",
    };
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256", kid: "test" })
      .setIssuer(issuer)
      .setAudience("byteblocks")
      .setSubject("user")
      .setExpirationTime("5m")
      .sign(privateKey);
    const call = (bearer) =>
      new Request("https://worker.test/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bearer}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
      });
    assert.equal((await handle(call(token), configured)).status, 200);
    assert.equal(
      (await handle(call(token), { ...configured, AUTH0_AUDIENCE: "other" }))
        .status,
      401,
    );
    assert.equal((await handle(call(`${token}x`), configured)).status, 401);
    assert.equal(upstream, 1);
  } finally {
    globalThis.fetch = original;
  }
});
