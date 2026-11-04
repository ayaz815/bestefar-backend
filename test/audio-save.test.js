const test = require("node:test");
const assert = require("node:assert");
const Module = require("module");

// Stub modules that would hit S3 / Mongo so the handlers run in isolation.
const stubs = {
  "../utils/s3Upload": {
    generatePresignedUrl: async (key) => `https://signed.example/${key}`,
  },
};
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (stubs[request]) return stubs[request];
  return origLoad.call(this, request, ...rest);
};
process.env.AWS_BUCKET_NAME = "bkt";
process.env.AWS_REGION = "eu";

const router = require("../routes/s3UploadRoute.js");
const handler = router.stack.find((l) => l.route?.path === "/s3-presigned-url")
  .route.stack.at(-1).handle; // last = the handler itself (requireAdmin runs first)

const call = async (query) => {
  let out;
  const res = {
    status(c) { this.code = c; return this; },
    json(b) { out = { code: this.code || 200, body: b }; },
  };
  await handler({ query }, res);
  return out;
};

test("same filename on two uploads gets two different storage keys", async () => {
  const q = { fileName: "melody.mp3", contentType: "audio/mpeg", type: "music", page: "1" };
  const a = await call(q);
  const b = await call({ ...q, page: "2" });
  assert.notStrictEqual(a.body.key, b.body.key);
  assert.notStrictEqual(a.body.publicUrl, b.body.publicUrl);
  assert.ok(a.body.key.startsWith("musicFiles/") && a.body.key.endsWith("-melody.mp3"));
});

test("public URL encodes the unique filename and matches the signed key", async () => {
  const r = await call({ fileName: "Hva er navnet.mp3", contentType: "audio/mpeg", type: "audio", page: "3" });
  const keyName = r.body.key.split("/")[1];
  assert.ok(r.body.publicUrl.endsWith(`audioFiles/${encodeURIComponent(keyName)}`));
  assert.ok(r.body.url.endsWith(r.body.key));
});

test("missing params still rejected", async () => {
  const r = await call({ type: "music" });
  assert.strictEqual(r.code, 400);
});

test("saveForm accepts a quiz with only page and name", async () => {
  // Stub the Quiz model so no database is needed.
  const saved = [];
  class FakeQuiz {
    constructor(d) { Object.assign(this, d); }
    async save() { saved.push(this); }
    static async findOne() { return null; }
  }
  stubs["../models/Form"] = FakeQuiz;
  delete require.cache[require.resolve("../controllers/formController.js")];
  const { saveForm } = require("../controllers/formController.js");
  let out;
  const res = { status(c) { this.code = c; return this; }, json(b) { out = { code: this.code, body: b }; } };
  await saveForm({ body: { page: "1", quizName: "Only a name" } }, res);
  assert.strictEqual(out.code, 200, JSON.stringify(out.body));
  assert.strictEqual(saved[0].quizName, "Only a name");

  await saveForm({ body: { page: "1" } }, res);
  assert.strictEqual(out.code, 400);
});
