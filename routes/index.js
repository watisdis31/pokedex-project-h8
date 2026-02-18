const router = require("express").Router();

const authRouter = require("./auth");
const bookmarkRouter = require("./bookmark");
const teamRouter = require("./team");
const pokemonRouter = require("./pokemon");

const authentication = require("../middlewares/authentication");

router.get("/", (req, res) => {
  res.json({ message: "Pokedex API running" });
});

router.use("/auth", authRouter);
router.use("/pokemon", pokemonRouter);

router.use(authentication);
router.use("/bookmarks", bookmarkRouter);
router.use("/teams", teamRouter);

module.exports = router;
