// Public show lists (access-control Module 4b): trimmed to catalog fields once ACCESS_ENFORCE is on.
const test = require("node:test");
const assert = require("node:assert");
const Module = require("module");

const SECRET_BITS = ["Svaret er Elvis", "https://bucket/song.mp3", "https://bucket/pic.jpg", "Hvem synger?"];
const screen = { page: 1, question: SECRET_BITS[3], answer: SECRET_BITS[0], firmNaming: "Music", musicFileUrl: SECRET_BITS[1], mediaFileUrl: SECRET_BITS[2] };
const docs = [{ _id: "s1", quizName: "Elvis", quizInfo: "Om Elvis", accessTier: "demo", screens: [screen, { ...screen, page: 2 }], createdAt: new Date("2026-10-01") }];
const fakeModel = { find: () => Object.assign(Promise.resolve(docs), { sort: async () => docs }) };
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (/models\/(Form|ImageQuiz|ImageMusicQuiz|AudioQuiz)$/.test(request)) return fakeModel;
  return origLoad.call(this, request, ...rest);
};

const LISTS = {
  "forms/get-all": require("../controllers/formController").getAllShows,
  "image-quiz/get-all-image-quizzes": require("../controllers/imageQuizController").getAllImageQuizzes,
  "image-music/get-all-image-music-shows": require("../controllers/imageMusicController").getAllImageMusicShows,
  "audio-quiz/get-all-audio-quizzes": require("../controllers/audioQuizController").getAllAudioQuizzes,
};
const { CATALOG_FIELDS } = require("../utils/publicLists");

const fetchList = async (handler, enforce) => {
  const saved = process.env.ACCESS_ENFORCE;
  if (enforce) process.env.ACCESS_ENFORCE = "true"; else delete process.env.ACCESS_ENFORCE;
  let body;
  await handler({}, { status() { return this; }, json(b) { body = b; } });
  if (saved === undefined) delete process.env.ACCESS_ENFORCE; else process.env.ACCESS_ENFORCE = saved;
  return body;
};

for (const [name, handler] of Object.entries(LISTS)) {
  test(`${name}: switch on, no questions, answers or file links leave the server`, async () => {
    const body = await fetchList(handler, true);
    const text = JSON.stringify(body);
    for (const bit of SECRET_BITS) assert.ok(!text.includes(bit), `${name} leaks "${bit}"`);
    for (const show of body.shows) {
      assert.deepStrictEqual(Object.keys(show).filter((k) => !CATALOG_FIELDS.includes(k)), [], "only catalog fields");
      assert.strictEqual(show.numberOfScreens, 2, "question count still there");
      assert.strictEqual(show.id, "s1");
    }
  });

  test(`${name}: REGRESSION switch off, full content as today (generator archive needs it)`, async () => {
    const [show] = (await fetchList(handler, false)).shows;
    assert.strictEqual((show.quizForms || show.screens).length, 2, "full screens still there");
    assert.ok(SECRET_BITS.some((bit) => JSON.stringify(show).includes(bit)), "screen content still there");
  });
}

test("AudioQuiz list keeps what the catalog shows: info, tag and Music Type", async () => {
  const [show] = (await fetchList(LISTS["forms/get-all"], true)).shows;
  assert.deepStrictEqual([show.quizInfo, show.accessTier, show.musicType, show.isPublic], ["Om Elvis", "demo", "Music", true]);
});
