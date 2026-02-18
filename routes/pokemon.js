const router = require("express").Router();
const PokemonController = require("../controllers/pokemonController");

router.get("/", PokemonController.getPokemons);
router.get("/:id", PokemonController.getPokemonDetail);

module.exports = router;
