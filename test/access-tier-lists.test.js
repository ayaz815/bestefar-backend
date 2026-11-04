// The three show lists the website catalog reads must say each show's accessTier.
const test = require("node:test");
const assert = require("node:assert");
const Module = require("module");

const docs = [
  { _id: "a1", quizName: "Tagged demo", accessTier: "demo", screens: [] },
  { _id: "a2", quizName: "Old show, no tier", screens: [] },
];
// Works for both Model.find() and Model.find().sort().
const fakeModel = { find: () => Object.assign(Promise.resolve(docs), { sort: async () => docs }) };
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (/models\/(Form|ImageQuiz|ImageMusicQuiz)$/.test(request)) return fakeModel;
  return origLoad.call(this, request, ...rest);
};

const lists = {
  audio: require("../controllers/formController").getAllShows,
  image: require("../controllers/imageQuizController").getAllImageQuizzes,
  imagemusic: require("../controllers/imageMusicController").getAllImageMusicShows,
};

for (const [type, handler] of Object.entries(lists)) {
  test(`${type} list includes accessTier, missing = restricted`, async () => {
    let body;
    await handler({}, { status() { return this; }, json(b) { body = b; } });
    assert.deepStrictEqual(body.shows.map((s) => s.accessTier), ["demo", "restricted"]);
    assert.ok(body.shows.every((s) => "isPublic" in s), "existing isPublic field still there");
  });
}
