const bcrypt = require("bcryptjs");

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hashed) {
  return bcrypt.compareSync(password, hashed);
}

module.exports = { hashPassword, comparePassword };
