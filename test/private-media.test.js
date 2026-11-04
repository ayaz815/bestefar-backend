// Private media (access-control Module 4d): signed 12-hour links out, plain links stored.
const test = require("node:test");
const assert = require("node:assert");
const Module = require("module");

process.env.AWS_BUCKET_NAME = "bkt";
process.env.AWS_REGION = "eu-north-1";
const fakeModel = { find: () => Object.assign(Promise.resolve([]), { sort: async () => [] }) };
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (/models\/(Form|ImageQuiz|ImageMusicQuiz|AudioQuiz|CrosswordShow)$/.test(request)) return fakeModel;
  return origLoad.call(this, request, ...rest);
};
const media = require("../utils/privateMedia");

const HOST = "https://bkt.s3.eu-north-1.amazonaws.com";
const SONG = `${HOST}/musicFiles/1762-abc-Love%20Me%20Tender.mp3`;
const fakeSigner = (key) => `SIGNED(${key})`;
const withEnv = (env, fn) => { const saved = { ...process.env }; Object.assign(process.env, env); try { return fn(); } finally { process.env = saved; } };

test("recognises only our three media folders on our bucket", () => {
  assert.strictEqual(media.mediaKey(SONG), "musicFiles/1762-abc-Love Me Tender.mp3");
  assert.strictEqual(media.mediaKey(`${HOST}/imageFiles/a.jpg`), "imageFiles/a.jpg");
  assert.strictEqual(media.mediaKey(`${HOST}/audioFiles/b.mp3`), "audioFiles/b.mp3");
  assert.strictEqual(media.mediaKey(`${HOST}/logos/x.png`), null, "other folder");
  assert.strictEqual(media.mediaKey("https://other.s3.eu-north-1.amazonaws.com/musicFiles/a.mp3"), null, "other bucket");
  assert.strictEqual(media.mediaKey("local://music1.mp3"), null);
  assert.strictEqual(media.mediaKey(""), null);
  assert.strictEqual(media.mediaKey(42), null);
});

test("signs every media link anywhere in the show, leaves everything else alone", () => {
  const show = { id: "s1", quizName: "Elvis", n: 3, ok: true, none: null,
    quizForms: [{ page: 1, musicFileUrl: SONG, answer: "Elvis", link: "https://bestefar.no/x?y=1" }],
    screens: [{ mediaFileUrl: `${HOST}/imageFiles/a.jpg` }], sharedMp3Url: `${HOST}/musicFiles/s.mp3` };
  const out = media.signMediaUrls(show, fakeSigner);
  assert.strictEqual(out.quizForms[0].musicFileUrl, "SIGNED(musicFiles/1762-abc-Love Me Tender.mp3)");
  assert.strictEqual(out.screens[0].mediaFileUrl, "SIGNED(imageFiles/a.jpg)");
  assert.strictEqual(out.sharedMp3Url, "SIGNED(musicFiles/s.mp3)");
  assert.deepStrictEqual([out.quizForms[0].answer, out.quizForms[0].link, out.n, out.ok, out.none], ["Elvis", "https://bestefar.no/x?y=1", 3, true, null]);
  assert.strictEqual(show.quizForms[0].musicFileUrl, SONG, "input not changed");
});

test("a link that is already signed is re-signed from the plain file, not double-signed", () => {
  assert.strictEqual(media.signMediaUrls({ u: `${SONG}?X-Amz-Signature=old` }, fakeSigner).u, "SIGNED(musicFiles/1762-abc-Love Me Tender.mp3)");
});

test("saving: signatures are stripped from media links only", () => {
  const body = { quizForms: [{ musicFileUrl: `${SONG}?X-Amz-Expires=43200&X-Amz-Signature=abc` }], web: "https://bestefar.no/?a=1" };
  assert.deepStrictEqual(media.stripMediaSignatures(body), { quizForms: [{ musicFileUrl: SONG }], web: "https://bestefar.no/?a=1" });
});

test("real AWS signing (dummy credentials, no network): 12-hour signed link to the right file", () => withEnv({ AWS_ACCESS_KEY_ID: "AKIATEST", AWS_SECRET_ACCESS_KEY: "secret" }, () => {
  const url = new URL(media.signMediaUrls({ u: SONG }).u);
  assert.strictEqual(url.host, "bkt.s3.eu-north-1.amazonaws.com");
  assert.strictEqual(decodeURIComponent(url.pathname), "/musicFiles/1762-abc-Love Me Tender.mp3");
  assert.strictEqual(url.searchParams.get("X-Amz-Expires"), String(12 * 3600));
  assert.ok(url.searchParams.get("X-Amz-Signature"));
}));

const runResponse = (enforce) => withEnv({ ACCESS_ENFORCE: enforce, AWS_ACCESS_KEY_ID: "AKIATEST", AWS_SECRET_ACCESS_KEY: "secret" }, () => {
  let sent;
  const res = { json: (b) => { sent = b; } };
  media.signMediaInResponse({}, res, () => {});
  res.json({ musicFileUrl: SONG, at: new Date("2026-11-05T00:00:00Z") });
  return sent;
});

test("REGRESSION: switch off, links go out exactly as stored", () => {
  assert.strictEqual(runResponse("false").musicFileUrl, SONG);
});

test("switch on: links go out signed", () => {
  assert.match(runResponse("true").musicFileUrl, /X-Amz-Signature=/);
});

// ── wiring ───────────────────────────────────────────────────────────────────
const handlersOf = (file, method, path) => {
  const router = require(`../routes/${file}`);
  const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
  assert.ok(layer, `${file} ${method} ${path}`);
  return layer.route.stack.map((s) => s.handle);
};

test("every route that sends shows to players or the generator signs media links", () => {
  const routes = [["playRoutes", "get", "/audio/:id"], ["playRoutes", "get", "/image/:id"], ["playRoutes", "get", "/imagemusic/:id"],
    ["audioQuizRoutes", "get", "/get-audio-quiz/:id"], ["formRoutes", "get", "/get-show/:id"], ["imageQuizRoutes", "get", "/get-image-quiz/:id"],
    ["imageMusicQuizRoutes", "get", "/get-image-music-show/:id"], ["formRoutes", "get", "/get-all"], ["imageQuizRoutes", "get", "/get-all-image-quizzes"],
    ["imageMusicQuizRoutes", "get", "/get-all-image-music-shows"], ["audioQuizRoutes", "get", "/get-all-audio-quizzes"]];
  const missing = routes.filter((r) => !handlersOf(...r).includes(media.signMediaInResponse)).map((r) => r.join(" "));
  assert.deepStrictEqual(missing, []);
});

test("every form-upload save strips signatures AFTER the form is parsed; JSON saves are covered in server.js", () => {
  const routes = [["formRoutes", "post", "/save-form"], ["imageQuizRoutes", "post", "/save-image-quiz-form"], ["imageMusicQuizRoutes", "post", "/save-image-music-form"],
    ["imageMusicQuizRoutes", "put", "/update-image-music-show/:id"], ["audioQuizRoutes", "post", "/save-audio-quiz-form"]];
  for (const r of routes) {
    const h = handlersOf(...r);
    const i = h.indexOf(media.stripMediaInBody);
    assert.ok(i > 1 && i === h.length - 2, `${r.join(" ")}: after multer, right before the handler`);
  }
  const src = require("fs").readFileSync(__dirname + "/../server.js", "utf8");
  assert.ok(src.indexOf("app.use(stripMediaInBody)") > src.indexOf("app.use(express.urlencoded"), "after both body parsers");
});
