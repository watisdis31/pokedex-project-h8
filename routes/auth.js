const AuthController = require("../controllers/authController");

const router = require("express").Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/google-login", AuthController.googleLogin);
router.post("/github-login", AuthController.githubLogin);

router.get("/github/callback", (req, res) => {
  const { code } = req.query;

  if (!code) return res.status(400).send("No code received from GitHub");

  res.send(`
    <script>
      window.opener.postMessage({ githubCode: "${code}" }, "*");
      window.close();
    </script>
  `);
});

module.exports = router;
