// Generator login (access-control Module 4c): sessions, login, the guard, and which routes need it.
const test = require("node:test");
const assert = require("node:assert");
const Module = require("module");

// Route files load controllers that load Mongoose models; stub models so nothing touches a database.
const fakeModel = { find: () => Object.assign(Promise.resolve([]), { sort: async () => [] }) };
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (/models\/(Form|ImageQuiz|ImageMusicQuiz|AudioQuiz|CrosswordShow)$/.test(request)) return fakeModel;
  return origLoad.call(this, request, ...rest);
};

const { hashPassword, passwordMatches, createSession, verifySession } = require("../utils/adminSession");
const { createPlayKey, verifyPlayKey } = require("../utils/playKey");
const requireAdmin = require("../middleware/requireAdmin");
const admin = require("../controllers/adminController");

const SECRET = "test-secret";
const withEnv = (env, fn) => {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  try { return fn(); } finally { process.env = saved; }
};
const call = (handler, req) => {
  const out = { next: false };
  const res = { status(c) { out.code = c; return this; }, json(b) { out.body = b; out.code ||= 200; } };
  handler({ headers: {}, body: {}, params: {}, query: {}, ip: "1.1.1.1", ...req }, res, () => { out.next = true; });
  return out;
};
const bearer = (token) => ({ headers: { authorization: `Bearer ${token}` } });

// ── sessions and passwords ───────────────────────────────────────────────────
test("password hash: right password matches, wrong or empty does not", () => {
  const h = hashPassword("riktig-passord");
  assert.match(h, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.ok(passwordMatches("riktig-passord", h));
  assert.ok(!passwordMatches("feil-passord", h));
  assert.ok(!passwordMatches("", h));
  assert.ok(!passwordMatches("riktig-passord", "plain-text"));
});

test("session: valid until it expires, rejected if tampered or signed with another secret", () => {
  const now = 1_800_000_000;
  const t = createSession("per", SECRET, now);
  assert.ok(verifySession(t, SECRET, now + 60));
  assert.ok(!verifySession(t, SECRET, now + 8 * 86400), "expired after 7 days");
  assert.ok(!verifySession(t, "other", now));
  assert.ok(!verifySession(t.slice(0, -2) + "xx", SECRET, now));
  assert.ok(!verifySession("", SECRET, now));
});

test("a play key is not a login, and a login is not a play key", () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const key = createPlayKey({ u: 1, t: "audio", q: "x", exp }, SECRET);
  assert.ok(!verifySession(key, SECRET));
  assert.ok(!verifyPlayKey(createSession("per", SECRET), { type: "audio", id: "x", secret: SECRET }).ok);
});

// ── login ────────────────────────────────────────────────────────────────────
const LOGIN_ENV = { ADMIN_USERNAME: "per", ADMIN_PASSWORD_HASH: hashPassword("riktig-passord"), ACCESS_TOKEN_SECRET: SECRET };

test("login: right details give a working token; wrong ones are 401", () => withEnv(LOGIN_ENV, () => {
  admin._failedLogins.clear();
  const ok = call(admin.login, { body: { username: "per", password: "riktig-passord" } });
  assert.strictEqual(ok.code, 200);
  assert.ok(verifySession(ok.body.token, SECRET));
  assert.strictEqual(call(admin.login, { body: { username: "per", password: "feil" } }).code, 401);
  assert.strictEqual(call(admin.login, { body: { username: "ola", password: "riktig-passord" } }).code, 401);
}));

test("login: 5 wrong tries lock that address for 15 minutes, other addresses unaffected", () => withEnv(LOGIN_ENV, () => {
  admin._failedLogins.clear();
  for (let i = 0; i < 5; i++) call(admin.login, { ip: "9.9.9.9", body: { username: "per", password: "feil" } });
  assert.strictEqual(call(admin.login, { ip: "9.9.9.9", body: { username: "per", password: "riktig-passord" } }).code, 429);
  assert.strictEqual(call(admin.login, { ip: "8.8.8.8", body: { username: "per", password: "riktig-passord" } }).code, 200);
}));

test("login: not configured on the server is 503, never a free pass", () => withEnv({ ADMIN_USERNAME: "", ADMIN_PASSWORD_HASH: "", ACCESS_TOKEN_SECRET: SECRET }, () => {
  assert.strictEqual(call(admin.login, { body: { username: "", password: "" } }).code, 503);
}));

test("preview key from a logged-in generator opens that show in the player", () => withEnv({ ACCESS_TOKEN_SECRET: SECRET }, () => {
  const out = call(admin.previewKey, { params: { type: "image", id: "abc" } });
  assert.ok(verifyPlayKey(out.body.key, { type: "image", id: "abc", secret: SECRET }).ok);
  assert.strictEqual(call(admin.previewKey, { params: { type: "crossword", id: "abc" } }).code, 400);
}));

// ── the guard ────────────────────────────────────────────────────────────────
test("REGRESSION guard: switch off, everything passes without a login", () => withEnv({ ACCESS_ENFORCE: "false" }, () => {
  assert.ok(call(requireAdmin, {}).next);
}));

test("guard: switch on, no or bad login is 401, a valid login passes, no secret is 503", () => {
  withEnv({ ACCESS_ENFORCE: "true", ACCESS_TOKEN_SECRET: SECRET }, () => {
    assert.strictEqual(call(requireAdmin, {}).code, 401);
    assert.strictEqual(call(requireAdmin, bearer("junk.junk")).code, 401);
    assert.ok(call(requireAdmin, bearer(createSession("per", SECRET))).next);
  });
  withEnv({ ACCESS_ENFORCE: "true", ACCESS_TOKEN_SECRET: "" }, () => assert.strictEqual(call(requireAdmin, {}).code, 503));
});

// ── which routes need the login ──────────────────────────────────────────────
const guardedBy = (file, method, path) => {
  const router = require(`../routes/${file}`);
  const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
  assert.ok(layer, `${file} ${method} ${path} exists`);
  return layer.route.stack.map((s) => s.handle).includes(requireAdmin);
};

const ADMIN_ONLY = [
  ["formRoutes", "post", "/save-form"], ["formRoutes", "get", "/get-show/:id"], ["formRoutes", "put", "/update-show/:id"], ["formRoutes", "delete", "/delete-show/:id"],
  ["imageQuizRoutes", "post", "/save-image-quiz-form"], ["imageQuizRoutes", "get", "/get-image-quiz/:id"], ["imageQuizRoutes", "put", "/update-image-quiz/:id"], ["imageQuizRoutes", "delete", "/delete-image-quiz/:id"],
  ["imageMusicQuizRoutes", "post", "/save-image-music-form"], ["imageMusicQuizRoutes", "get", "/get-image-music-show/:id"], ["imageMusicQuizRoutes", "put", "/update-image-music-show/:id"], ["imageMusicQuizRoutes", "delete", "/delete-image-music-show/:id"],
  ["audioQuizRoutes", "post", "/save-audio-quiz-form"], ["audioQuizRoutes", "put", "/update-audio-quiz/:id"], ["audioQuizRoutes", "delete", "/delete-audio-quiz/:id"],
  ["crosswordRoutes", "post", "/create"], ["crosswordRoutes", "get", "/:id"], ["crosswordRoutes", "put", "/:id"], ["crosswordRoutes", "delete", "/:id"],
  ["visibilityRoutes", "put", "/:type/:id"], ["accessTierRoutes", "put", "/:type/:id"],
  ["audioRoutes", "post", "/upload-audio/:page"], ["musicRoutes", "post", "/upload-music/:page"], ["imageRoutes", "post", "/upload-media/:page"], ["imageRoutes", "post", "/upload-image/:page"],
  ["zipRoutes", "get", "/download-zip"], ["s3UploadRoute", "get", "/s3-presigned-url"], ["s3GetUrl", "get", "/signed-url"],
  ["adminRoutes", "get", "/preview-key/:type/:id"],
];
const PUBLIC = [
  ["formRoutes", "get", "/get-all"], ["imageQuizRoutes", "get", "/get-all-image-quizzes"], ["imageMusicQuizRoutes", "get", "/get-all-image-music-shows"],
  ["audioQuizRoutes", "get", "/get-all-audio-quizzes"], ["crosswordRoutes", "get", "/all"], ["crosswordRoutes", "get", "/pdf/:id"],
  ["visibilityRoutes", "get", "/:type/:id"], ["accessTierRoutes", "get", "/:type/:id"], ["adminRoutes", "post", "/login"],
];

test("every generator route (create/edit/delete/upload/full read) needs the login", () => {
  const missing = ADMIN_ONLY.filter((r) => !guardedBy(...r)).map((r) => r.join(" "));
  assert.deepStrictEqual(missing, []);
});

test("REGRESSION: routes the website catalog and players use stay without login", () => {
  const guarded = PUBLIC.filter((r) => guardedBy(...r)).map((r) => r.join(" "));
  assert.deepStrictEqual(guarded, []);
});

test("server: /download-zip needs the login, admin routes mounted, real visitor address used", () => {
  const src = require("fs").readFileSync(__dirname + "/../server.js", "utf8");
  assert.match(src, /app\.get\("\/download-zip", requireAdmin,/);
  assert.match(src, /app\.use\("\/api\/admin", adminRoutes\)/);
  assert.match(src, /app\.set\("trust proxy", 1\)/);
});

// ── lists ────────────────────────────────────────────────────────────────────
test("switch on: the public list is trimmed, but full for the logged-in generator", () => withEnv({ ACCESS_ENFORCE: "true", ACCESS_TOKEN_SECRET: SECRET }, () => {
  const { forPublicList } = require("../utils/publicLists");
  const shows = [{ id: "1", quizName: "A", quizForms: [{ answer: "x" }] }];
  assert.ok(!("quizForms" in forPublicList(shows, { headers: {} })[0]));
  assert.ok("quizForms" in forPublicList(shows, bearer(createSession("per", SECRET)))[0]);
}));
