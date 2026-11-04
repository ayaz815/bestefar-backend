// Play keys (access-control Module 4a): key check, switch, and which routes are guarded.
const test = require("node:test");
const assert = require("node:assert");
const { createPlayKey, verifyPlayKey } = require("../utils/playKey");
const requirePlayKey = require("../middleware/requirePlayKey");

const SECRET = "test-secret";
const NOW = 1_800_000_000;
const ID = "68c93334e1e8359caede34c3";
const key = (o = {}) => createPlayKey({ u: 7, t: "audio", q: ID, exp: NOW + 3600, ...o }, SECRET);
const check = (k, o = {}) => verifyPlayKey(k, { type: "audio", id: ID, secret: SECRET, now: NOW, ...o });

// ── the key itself ───────────────────────────────────────────────────────────
test("a valid key for this show passes", () => {
  const r = check(key());
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.payload.u, 7);
});

test("refused: missing, garbage, tampered, wrong secret", () => {
  assert.strictEqual(check(undefined).reason, "missing");
  assert.strictEqual(check("abc").reason, "missing");
  const [part, sig] = key().split(".");
  const forged = Buffer.from(JSON.stringify({ u: 7, t: "audio", q: ID, exp: NOW + 999999 })).toString("base64url");
  assert.strictEqual(check(`${forged}.${sig}`).reason, "bad_signature");
  assert.strictEqual(check(`${part}.${sig.slice(0, -2)}xx`).reason, "bad_signature");
  assert.strictEqual(check(key(), { secret: "other" }).reason, "bad_signature");
});

test("refused: key for another show or another quiz type", () => {
  assert.strictEqual(check(key({ q: "other" })).reason, "wrong_show");
  assert.strictEqual(check(key({ t: "image" })).reason, "wrong_show");
});

test("refused: expired (exactly at exp too)", () => {
  assert.strictEqual(check(key({ exp: NOW - 1 })).reason, "expired");
  assert.strictEqual(check(key({ exp: NOW })).reason, "expired");
});

test("refused when the server has no secret", () => {
  assert.strictEqual(check(key(), { secret: "" }).reason, "not_configured");
});

test("format matches the website's PHP keys (base64url, no padding)", () => {
  assert.match(key(), /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/);
});

// ── the switch (middleware) ──────────────────────────────────────────────────
const runGuard = (env, query, type = "audio") => {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  if (!("ACCESS_ENFORCE" in env)) delete process.env.ACCESS_ENFORCE;
  let out = { next: false };
  const res = { status(c) { out.code = c; return this; }, json(b) { out.body = b; } };
  requirePlayKey(type)({ query, params: { id: ID } }, res, () => { out.next = true; });
  process.env = saved;
  return out;
};
const validNow = () => createPlayKey({ u: 7, t: "audio", q: ID, exp: Math.floor(Date.now() / 1000) + 3600 }, SECRET);

test("REGRESSION: switch off (no ACCESS_ENFORCE) lets everything through, no key needed", () => {
  assert.strictEqual(runGuard({}, {}).next, true);
  assert.strictEqual(runGuard({ ACCESS_ENFORCE: "false" }, {}).next, true);
});

test("switch on: valid key passes, no key is 403, bad key is 403", () => {
  const env = { ACCESS_ENFORCE: "true", ACCESS_TOKEN_SECRET: SECRET };
  assert.strictEqual(runGuard(env, { key: validNow() }).next, true);
  assert.deepStrictEqual([runGuard(env, {}).code, runGuard(env, {}).body.reason], [403, "missing"]);
  assert.strictEqual(runGuard(env, { key: validNow() }, "image").code, 403);
});

test("switch on but no secret: 503, never open", () => {
  const out = runGuard({ ACCESS_ENFORCE: "true", ACCESS_TOKEN_SECRET: "" }, { key: validNow() });
  assert.deepStrictEqual([out.next, out.code], [false, 503]);
});

// ── which routes are guarded ─────────────────────────────────────────────────
// Calls the first handler on a route with the switch on and no key: 403 = guarded.
const guarded = (router, method, path) => {
  const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
  assert.ok(layer, `route ${path} exists`);
  const env = { ACCESS_ENFORCE: "true", ACCESS_TOKEN_SECRET: SECRET };
  const saved = { ...process.env };
  Object.assign(process.env, env);
  let code = 200;
  const res = { status(c) { code = c; return this; }, json() {} };
  layer.route.stack[0].handle({ query: {}, params: { id: ID } }, res, () => {});
  process.env = saved;
  return code === 403; // the key check runs first
};

test("player and PDF routes need a key: /api/play/*, audio-quiz player read, the three PDFs", () => {
  const play = require("../routes/playRoutes");
  for (const type of ["audio", "image", "imagemusic"]) {
    assert.ok(guarded(play, "get", `/${type}/:id`), `play ${type}`);
    assert.ok(guarded(play, "get", `/${type}/:id/pdf`), `play ${type} pdf`);
  }
  assert.ok(guarded(require("../routes/audioQuizRoutes"), "get", "/get-audio-quiz/:id"));
  assert.ok(guarded(require("../routes/formRoutes"), "get", "/pdf/:id"));
  assert.ok(guarded(require("../routes/imageQuizRoutes"), "get", "/pdf/:id"));
  assert.ok(guarded(require("../routes/imageMusicQuizRoutes"), "get", "/pdf/:id"));
});

test("generator routes use the login (4c), not play keys", () => {
  const requireAdmin = require("../middleware/requireAdmin");
  const handlers = (router, path) => router.stack.find((l) => l.route && l.route.path === path).route.stack.map((s) => s.handle);
  for (const [router, path] of [[require("../routes/formRoutes"), "/get-show/:id"], [require("../routes/imageQuizRoutes"), "/get-image-quiz/:id"], [require("../routes/imageMusicQuizRoutes"), "/get-image-music-show/:id"]]) {
    const h = handlers(router, path);
    assert.strictEqual(h[0], requireAdmin, `${path}: login checked first`);
    assert.ok(!h.some((fn) => fn.name === "" && fn.length === 3 && String(fn).includes("verifyPlayKey")), `${path}: no play key`);
  }
});
