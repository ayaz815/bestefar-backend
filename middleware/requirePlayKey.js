const { verifyPlayKey } = require("../utils/playKey");

// Guards a player/PDF route. Does nothing until ACCESS_ENFORCE=true is set in the
// server's .env, so shows keep opening exactly as before until the switch is on.
// `type` is the quiz type the route serves (audio | image | imagemusic).
const requirePlayKey = (type) => (req, res, next) => {
  if (process.env.ACCESS_ENFORCE !== "true") return next();

  const result = verifyPlayKey(req.query.key, {
    type,
    id: req.params.id,
    secret: process.env.ACCESS_TOKEN_SECRET,
  });
  if (result.ok) return next();

  // Misconfigured server: refuse rather than open everything.
  if (result.reason === "not_configured") {
    return res.status(503).json({ error: "Access check is not configured" });
  }
  return res.status(403).json({ error: "No access to this show", reason: result.reason });
};

module.exports = requirePlayKey;
