const { passwordMatches, createSession, SESSION_DAYS } = require("../utils/adminSession");
const { createPlayKey } = require("../utils/playKey");

// Slows down password guessing: 5 failed logins from one address = 15 minutes locked.
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const failedLogins = new Map(); // ip -> { count, lockedUntil }

const isLocked = (ip) => (failedLogins.get(ip)?.lockedUntil || 0) > Date.now();
const recordFail = (ip) => {
  const entry = failedLogins.get(ip) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_FAILS) Object.assign(entry, { count: 0, lockedUntil: Date.now() + LOCK_MS });
  failedLogins.set(ip, entry);
};

// POST /api/admin/login  { username, password } -> { token, expiresInDays }
const login = (req, res) => {
  const { ADMIN_USERNAME, ADMIN_PASSWORD_HASH, ACCESS_TOKEN_SECRET } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH || !ACCESS_TOKEN_SECRET) {
    return res.status(503).json({ error: "Login is not configured on the server" });
  }
  if (isLocked(req.ip)) {
    return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
  }
  const { username, password } = req.body || {};
  if (username !== ADMIN_USERNAME || !passwordMatches(password, ADMIN_PASSWORD_HASH)) {
    recordFail(req.ip);
    return res.status(401).json({ error: "Wrong username or password" });
  }
  failedLogins.delete(req.ip);
  res.json({ token: createSession(username, ACCESS_TOKEN_SECRET), expiresInDays: SESSION_DAYS });
};

// GET /api/admin/preview-key/:type/:id -> { key }   (behind requireAdmin)
// Lets the generator's Preview open a show in the player once keys are required.
const PREVIEW_KEY_HOURS = 12;
const previewKey = (req, res) => {
  const { type, id } = req.params;
  if (!["audio", "image", "imagemusic"].includes(type)) {
    return res.status(400).json({ error: "Unknown quiz type" });
  }
  const exp = Math.floor(Date.now() / 1000) + PREVIEW_KEY_HOURS * 3600;
  res.json({ key: createPlayKey({ u: 0, t: type, q: id, exp }, process.env.ACCESS_TOKEN_SECRET || "") });
};

module.exports = { login, previewKey, _failedLogins: failedLogins };
