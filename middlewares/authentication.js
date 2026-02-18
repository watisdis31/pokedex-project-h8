const { verifyToken } = require("../helpers/jwt");
const { User } = require("../models");

async function authentication(req, res, next) {
  try {
    const { authorization } = req.headers;

    if (!authorization) throw { name: "Unauthorized" };

    const token = authorization.split(" ")[1];
    const payload = verifyToken(token);

    const user = await User.findByPk(payload.id);
    if (!user) throw { name: "Unauthorized" };

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authentication;
