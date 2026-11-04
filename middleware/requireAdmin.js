const { isAdminRequest } = require("../utils/adminSession");

// Guards the generator's routes (create, edit, delete, uploads, full show reads).
// Does nothing until ACCESS_ENFORCE=true, so the generator works as before
// until the switch is on.
const requireAdmin = (req, res, next) => {
  if (process.env.ACCESS_ENFORCE !== "true") return next();
  if (!process.env.ACCESS_TOKEN_SECRET) {
    return res.status(503).json({ error: "Access check is not configured" });
  }
  if (isAdminRequest(req)) return next();
  return res.status(401).json({ error: "Login required" });
};

module.exports = requireAdmin;
