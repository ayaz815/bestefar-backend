const crypto = require("crypto");

// Generator login (access-control Module 4c). One admin account, set in the
// server's .env: ADMIN_USERNAME and ADMIN_PASSWORD_HASH (make the hash with
// `node scripts/hash-admin-password.js`). A successful login returns a signed
// session token the generator sends as "Authorization: Bearer <token>".

const SESSION_DAYS = 7;
const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
// "admin:" keeps session tokens and play keys apart even though both use ACCESS_TOKEN_SECRET.
const sign = (part, secret) => b64url(crypto.createHmac("sha256", `admin:${secret}`).update(part).digest());

// Password hash format: scrypt$<salt hex>$<hash hex>
const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) =>
  `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString("hex")}`;

const passwordMatches = (password, stored) => {
  const [scheme, salt, hash] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !salt || !hash || typeof password !== "string") return false;
  const given = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

const createSession = (username, secret, now = Math.floor(Date.now() / 1000)) => {
  const part = b64url(JSON.stringify({ role: "admin", u: username, exp: now + SESSION_DAYS * 86400 }));
  return `${part}.${sign(part, secret)}`;
};

const verifySession = (token, secret, now = Math.floor(Date.now() / 1000)) => {
  if (!secret || typeof token !== "string" || !token.includes(".")) return false;
  const [part, signature] = token.split(".");
  const expected = sign(part, secret);
  const given = Buffer.from(signature || "");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, Buffer.from(expected))) return false;
  try {
    const payload = JSON.parse(Buffer.from(part, "base64").toString("utf8"));
    return payload.role === "admin" && payload.exp > now;
  } catch {
    return false;
  }
};

const bearerToken = (req) => {
  const header = (req.headers && req.headers.authorization) || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
};

const isAdminRequest = (req) => verifySession(bearerToken(req), process.env.ACCESS_TOKEN_SECRET);

module.exports = { hashPassword, passwordMatches, createSession, verifySession, isAdminRequest, SESSION_DAYS };
