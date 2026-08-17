import { readFile } from "node:fs/promises";

import { build } from "esbuild";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const SITE_ORIGIN = "https://portfolio.sunnao.wtf";

const sampleValues = {
  name: "Test User",
  email: "test@example.com",
  message: "Hello there, this is a longer message.",
  social: "",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertRejects(fn, includes) {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (includes && !message.includes(includes)) {
      throw new Error(`expected ${JSON.stringify(includes)} in ${message}`);
    }
    return;
  }

  throw new Error("expected to throw");
}

function requestWithHeaders(headers) {
  return new Request("https://portfolio.sunnao.wtf/api/contact", { headers });
}

function clearDeliveryEnv() {
  delete process.env.FORMSUBMIT_ID;
  delete process.env.GOOGLE_FORM_LINK;
  delete process.env.GOOGLE_FORM_FIELD_ID_NAME;
  delete process.env.GOOGLE_FORM_FIELD_ID_EMAIL;
  delete process.env.GOOGLE_FORM_FIELD_ID_MESSAGE;
  delete process.env.GOOGLE_FORM_FIELD_ID_SOCIAL;
}

function setGoogleFormEnv() {
  process.env.GOOGLE_FORM_LINK =
    "https://docs.google.com/forms/d/e/abc/viewform?usp=sf_link";
  process.env.GOOGLE_FORM_FIELD_ID_NAME = "entry.1";
  process.env.GOOGLE_FORM_FIELD_ID_EMAIL = "entry.2";
  process.env.GOOGLE_FORM_FIELD_ID_MESSAGE = "entry.3";
  process.env.GOOGLE_FORM_FIELD_ID_SOCIAL = "entry.4";
}

const result = await build({
  entryPoints: ["lib/contact-delivery.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  conditions: ["react-server", "node", "import"],
  alias: { "@": process.cwd() },
});

const source = result.outputFiles[0].text;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString(
  "base64"
)}`;
const {
  deliverContactMessage,
  getClientIp,
  getContactRateLimitSize,
  isAllowedContactOrigin,
  isContactRateLimited,
  isSuccessfulGoogleFormResponse,
  readHoneypot,
  resetContactRateLimits,
  stripHoneypot,
  toGoogleFormResponseUrl,
} = await import(moduleUrl);

clearDeliveryEnv();

{
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response(JSON.stringify({ success: "true" }), { status: 200 });
  };

  try {
    await assertRejects(
      () => deliverContactMessage(sampleValues),
      "not configured"
    );
    assert(fetchCalls === 0, "must not deliver without explicit config");
    console.log("pass  unconfigured delivery fails without sending");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

{
  const cfRequest = requestWithHeaders({
    "cf-connecting-ip": "1.2.3.4",
    "x-forwarded-for": "9.9.9.9",
    "x-real-ip": "8.8.8.8",
  });
  assert(getClientIp(cfRequest) === "1.2.3.4", "must trust cf-connecting-ip");

  const spoofed = requestWithHeaders({
    "x-forwarded-for": "9.9.9.9",
    "x-real-ip": "8.8.8.8",
  });
  assert(
    getClientIp(spoofed) === "unknown",
    "must ignore spoofable IP headers"
  );

  const empty = requestWithHeaders({});
  assert(getClientIp(empty) === "unknown", "missing CF header is unknown");
  console.log("pass  IP trusts only cf-connecting-ip");
}

{
  resetContactRateLimits();
  const oldIp = "203.0.113.10";
  const newIp = "203.0.113.20";

  for (let i = 0; i < RATE_LIMIT_MAX; i += 1) {
    assert(
      isContactRateLimited(oldIp, 0) === false,
      `seed request ${i} should be allowed`
    );
  }
  assert(
    isContactRateLimited(oldIp, 0) === true,
    "same-window burst is limited"
  );
  assert(
    getContactRateLimitSize() === 1,
    "only the active IP should be stored"
  );

  assert(
    isContactRateLimited(newIp, RATE_LIMIT_WINDOW_MS + 1) === false,
    "a later request should prune expired IPs"
  );
  assert(
    getContactRateLimitSize() === 1,
    "expired IPs must be removed from the map"
  );
  assert(
    isContactRateLimited(oldIp, RATE_LIMIT_WINDOW_MS + 1) === false,
    "expired timestamps must not keep an IP limited"
  );
  console.log("pass  expired rate-limit entries are pruned");
}

{
  assert(readHoneypot(null) === "", "null payload has empty honeypot");
  assert(readHoneypot({}) === "", "missing honeypot is empty");
  assert(readHoneypot({ website: 12 }) === "", "non-string honeypot is empty");
  assert(readHoneypot({ website: "bot" }) === "bot", "string honeypot is read");

  const stripped = stripHoneypot({
    website: "bot",
    name: "Ada",
  });
  assert(
    JSON.stringify(stripped) === JSON.stringify({ name: "Ada" }),
    "stripHoneypot removes website"
  );
  assert(stripHoneypot("x") === "x", "non-objects pass through");
  console.log("pass  honeypot read and strip");
}

{
  assert(
    toGoogleFormResponseUrl(
      "https://docs.google.com/forms/d/e/abc/viewform?usp=sf_link#start"
    ) === "https://docs.google.com/forms/d/e/abc/formResponse",
    "viewform converts to formResponse and drops query/hash"
  );
  assert(
    toGoogleFormResponseUrl(
      "https://docs.google.com/forms/d/e/abc/formResponse"
    ) === "https://docs.google.com/forms/d/e/abc/formResponse",
    "formResponse path is kept"
  );
  console.log("pass  Google form URL conversion");
}

{
  assert(
    isSuccessfulGoogleFormResponse({ ok: false, status: 401 }) === false,
    "401 is not success"
  );
  assert(
    isSuccessfulGoogleFormResponse({ ok: false, status: 302 }) === true,
    "302 is success"
  );
  assert(
    isSuccessfulGoogleFormResponse({ ok: false, status: 303 }) === true,
    "303 is success"
  );
  assert(
    isSuccessfulGoogleFormResponse({ ok: true, status: 200 }) === true,
    "ok is success"
  );

  setGoogleFormEnv();
  const originalFetch = globalThis.fetch;
  let fetchStatus = 401;
  globalThis.fetch = async () => new Response("", { status: fetchStatus });

  try {
    await assertRejects(() => deliverContactMessage(sampleValues), "401");

    fetchStatus = 302;
    await deliverContactMessage(sampleValues);

    fetchStatus = 200;
    await deliverContactMessage(sampleValues);
    console.log("pass  Google Form 401 is not success");
  } finally {
    globalThis.fetch = originalFetch;
    clearDeliveryEnv();
  }
}

{
  assert(
    isAllowedContactOrigin(requestWithHeaders({ origin: SITE_ORIGIN })) ===
      true,
    "site origin is allowed"
  );
  assert(
    isAllowedContactOrigin(
      requestWithHeaders({ referer: `${SITE_ORIGIN}/contact` })
    ) === true,
    "site referer is allowed"
  );
  assert(
    isAllowedContactOrigin(
      requestWithHeaders({ origin: "http://localhost:3000" })
    ) === true,
    "localhost origin is allowed"
  );
  assert(
    isAllowedContactOrigin(
      requestWithHeaders({ origin: "https://evil.example" })
    ) === false,
    "foreign origin is rejected"
  );
  assert(
    isAllowedContactOrigin(requestWithHeaders({})) === false,
    "missing origin/referer is rejected"
  );
  console.log("pass  contact origin allowlist");
}

const sourceText = await readFile("lib/contact-delivery.ts", "utf8");
if (sourceText.includes("DEFAULT_FORMSUBMIT_ID")) {
  throw new Error("must not hardcode a default FormSubmit hash");
}
if (
  sourceText.includes("x-forwarded-for") ||
  sourceText.includes("x-real-ip")
) {
  throw new Error("must not trust spoofable forwarded IP headers");
}
console.log("pass  source has no default hash or spoofable IP trust");
