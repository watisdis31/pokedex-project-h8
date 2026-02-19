const { OAuth2Client } = require("google-auth-library");
const { comparePassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { User } = require("../models");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, username } = req.body;

      const user = await User.create({
        email,
        password,
        username,
      });

      res.status(201).json({ message: "Register success" });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) throw { name: "UnauthorizedLogin" };

      const valid = comparePassword(password, user.password);
      if (!valid) throw { name: "UnauthorizedLogin" };

      const access_token = signToken({ id: user.id });

      res.status(200).json({ access_token });
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const { googleToken } = req.body || {};

      if (!googleToken) {
      throw { name: "GoogleBadRequest" };
    }

      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email, sub } = payload;

      let user = await User.findOne({ where: { email } });

      if (!user) {
        user = await User.create({
          email,
          username: email.split("@")[0],
          googleId: sub,
        });
      }

      const access_token = signToken({ id: user.id });

      res.status(200).json({ access_token });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
