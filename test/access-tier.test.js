const test = require("node:test");
const assert = require("node:assert");
const Module = require("module");

// Fake Mongoose models so no database is touched.
const calls = [];
const docs = {};
const fakeModel = (name) => ({
  findById: (id) => ({ select: async () => docs[name + id] || null }),
  findByIdAndUpdate: (id, update, opts) => {
    calls.push({ name, id, update, opts });
    return { select: async () => (docs[name + id] ? { ...docs[name + id], ...update.$set } : null) };
  },
});
const stubs = {
  "../models/Form": fakeModel("audio"),
  "../models/ImageQuiz": fakeModel("image"),
  "../models/ImageMusicQuiz": fakeModel("imagemusic"),
  "../models/CrosswordShow": fakeModel("crossword"),
};
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  return stubs[request] || origLoad.call(this, request, ...rest);
};
const { getAccessTier, setAccessTier } = require("../controllers/accessTierController");
const visibility = require("../controllers/visibilityController");

const ID = "64b7f0f2f2f2f2f2f2f2f2f2";
const run = async (fn, params, body = {}) => {
  let out;
  const res = { status(c) { this.code = c; return this; }, json(b) { out = { code: this.code || 200, body: b }; } };
  await fn({ params, body }, res);
  return out;
};

test("show with no tier saved reads as restricted", async () => {
  docs["audio" + ID] = {};
  assert.deepStrictEqual((await run(getAccessTier, { type: "audio", id: ID })).body, { accessTier: "restricted" });
});

test("reads a saved tier", async () => {
  docs["image" + ID] = { accessTier: "demo" };
  assert.strictEqual((await run(getAccessTier, { type: "image", id: ID })).body.accessTier, "demo");
});

test("sets each valid tier on each of the three show types, touching only that field", async () => {
  for (const type of ["audio", "image", "imagemusic"]) {
    docs[type + ID] = {};
    for (const accessTier of ["restricted", "registered", "demo"]) {
      calls.length = 0;
      const r = await run(setAccessTier, { type, id: ID }, { accessTier });
      assert.deepStrictEqual(r.body, { success: true, accessTier });
      assert.deepStrictEqual(calls[0].update, { $set: { accessTier } });
      assert.strictEqual(calls[0].opts.runValidators, false);
      assert.strictEqual(calls[0].opts.timestamps, false);
    }
  }
});

test("rejects an unknown tier, a missing tier, and non-string values", async () => {
  docs["audio" + ID] = {};
  for (const accessTier of ["admin", "", undefined, true, null, ["demo"]]) {
    assert.strictEqual((await run(setAccessTier, { type: "audio", id: ID }, { accessTier })).code, 400);
  }
});

test("crossword is not supported yet, unknown type is 400", async () => {
  assert.strictEqual((await run(getAccessTier, { type: "crossword", id: ID })).code, 400);
  assert.strictEqual((await run(setAccessTier, { type: "nope", id: ID }, { accessTier: "demo" })).code, 400);
});

test("bad id is 404 and show not found is 404", async () => {
  assert.strictEqual((await run(getAccessTier, { type: "audio", id: "abc" })).code, 404);
  assert.strictEqual((await run(setAccessTier, { type: "audio", id: "64b7f0f2f2f2f2f2f2f2f2aa" }, { accessTier: "demo" })).code, 404);
});

test("REGRESSION: the isPublic visibility endpoint still works the same", async () => {
  docs["audio" + ID] = { isPublic: false };
  assert.deepStrictEqual((await run(visibility.getVisibility, { type: "audio", id: ID })).body, { isPublic: false });
  docs["audio" + ID] = {};
  assert.deepStrictEqual((await run(visibility.getVisibility, { type: "audio", id: ID })).body, { isPublic: true });
});

test("models declare accessTier with no default, and the route is mounted", () => {
  const fs = require("fs");
  for (const m of ["Form", "ImageQuiz", "ImageMusicQuiz"]) {
    const src = fs.readFileSync(__dirname + `/../models/${m}.js`, "utf8");
    assert.match(src, /accessTier: \{ type: String, enum: \['restricted', 'registered', 'demo'\] \}/);
  }
  assert.match(fs.readFileSync(__dirname + "/../server.js", "utf8"), /app\.use\("\/api\/access-tier", accessTierRoutes\)/);
});
