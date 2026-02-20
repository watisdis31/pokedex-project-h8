const AuthController = require("../controllers/authController");

const router = require("express").Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/google-login", AuthController.googleLogin);
router.post("/github-login", AuthController.githubLogin);

module.exports = router;
