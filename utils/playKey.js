const crypto = require("crypto");

// Play keys are issued by the website (bestefar.no, Access_model) when an allowed
// customer presses Start, and checked here. Format: base64url(JSON payload) + "." +
// base64url(HMAC-SHA256 of that first part). Payload: { u: customer id, t: quiz type,
// q: quiz id, exp: unix seconds }. Both sides share ACCESS_TOKEN_SECRET.

const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const sign = (part, secret) => b64url(crypto.createHmac("sha256", secret).update(part).digest());

// Only used by tests; the website creates the real keys.
const createPlayKey = (payload, secret) => {
  const part = b64url(JSON.stringify(payload));
  return `${part}.${sign(part, secret)}`;
};

// Returns { ok: true, payload } or { ok: false, reason }.
const verifyPlayKey = (key, { type, id, secret, now = Math.floor(Date.now() / 1000) }) => {
  if (!secret) return { ok: false, reason: "not_configured" };
  if (typeof key !== "string" || !key.includes(".")) return { ok: false, reason: "missing" };

  const [part, signature] = key.split(".");
  const expected = sign(part, secret);
  const given = Buffer.from(signature || "");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, Buffer.from(expected))) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(part, "base64").toString("utf8"));
  } catch {
    return { ok: false, reason: "bad_payload" };
  }
  if (payload.t !== type || payload.q !== id) return { ok: false, reason: "wrong_show" };
  if (!(payload.exp > now)) return { ok: false, reason: "expired" };
  return { ok: true, payload };
};

module.exports = { createPlayKey, verifyPlayKey };
