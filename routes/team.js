const TeamController = require("../controllers/teamController");
const authorization = require("../middlewares/authorization");

const router = require("express").Router();

router.get("/", TeamController.getMyTeams);
router.post("/", TeamController.createTeam);
router.get("/:id",authorization, TeamController.getTeamDetail);
router.post("/:teamId/pokemon",authorization, TeamController.addPokemon);
router.delete("/:teamId/pokemon/:pokemonId",authorization, TeamController.removePokemon);
router.delete("/:id",authorization, TeamController.deleteTeam);

module.exports = router;
