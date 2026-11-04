// Prints the ADMIN_PASSWORD_HASH line for the server's .env.
//   node scripts/hash-admin-password.js 'the password'
const { hashPassword } = require("../utils/adminSession");

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error("Usage: node scripts/hash-admin-password.js '<password, at least 10 characters>'");
  process.exit(1);
}
console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`);
