const axios = require("axios");
const { getGeminiRecommendation } = require("../helpers/gemini");
const { fetchPokemonCard } = require("../helpers/tcgApi");

class PokemonController {
  static async getPokemons(req, res, next) {
    try {
      let {
        page = 1,
        limit = 20,
        generation,
        type,
        search = "",
        sort = "id",
        order = "ASC",
      } = req.query;

      page = Number(page);
      limit = Number(limit);

      let baseList = [];

      if (generation) {
        const { data } = await axios.get(
          `https://pokeapi.co/api/v2/generation/${generation}`,
        );

        baseList = data.pokemon_species.map((species) => {
          const urlParts = species.url.split("/").filter(Boolean);
          const id = Number(urlParts[urlParts.length - 1]);

          return {
            id,
            name: species.name,
          };
        });
      }

      if (type) {
        const types = type.split(",");

        let typeResults = [];

        for (let t of types) {
          const { data } = await axios.get(
            `https://pokeapi.co/api/v2/type/${t}`,
          );

          const ids = data.pokemon.map((p) => {
            const urlParts = p.pokemon.url.split("/").filter(Boolean);
            return Number(urlParts[urlParts.length - 1]);
          });

          typeResults.push(ids);
        }

        let finalTypeIds = typeResults[0];

        if (typeResults.length > 1) {
          finalTypeIds = typeResults.reduce((a, b) =>
            a.filter((id) => b.includes(id)),
          );
        }

        baseList = finalTypeIds.map((id) => ({
          id,
          name: "",
        }));
      }

      if (!generation && !type) {
        const { data } = await axios.get(
          `https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0`,
        );

        baseList = data.results.map((p) => {
          const urlParts = p.url.split("/").filter(Boolean);
          const id = Number(urlParts[urlParts.length - 1]);

          return {
            id,
            name: p.name,
          };
        });
      }

      let filteredList = baseList;

      if (search) {
        filteredList = filteredList.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase()),
        );
      }

      filteredList.sort((a, b) => {
        if (sort === "name") {
          return order.toUpperCase() === "DESC"
            ? b.name.localeCompare(a.name)
            : a.name.localeCompare(b.name);
        }

        return order.toUpperCase() === "DESC" ? b.id - a.id : a.id - b.id;
      });

      const totalData = filteredList.length;
      const start = (page - 1) * limit;
      const end = start + limit;

      const paginated = filteredList.slice(start, end);

      const finalData = paginated.map((p) => ({
        id: p.id,
        name: p.name,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`,
      }));

      res.status(200).json({
        currentPage: page,
        totalData,
        data: finalData,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPokemonDetail(req, res, next) {
    try {
      const { id } = req.params;

      const { data: pokemon } = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${id}`,
      );

      const stats = pokemon.stats.map((s) => ({
        name: s.stat.name,
        baseStat: s.base_stat,
      }));

      const { data: species } = await axios.get(pokemon.species.url);
      const { data: evolution } = await axios.get(species.evolution_chain.url);

      const extractEvolution = (chain, result = []) => {
        result.push({
          name: chain.species.name,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${chain.species.url.split("/")[6]}.png`,
        });
        if (chain.evolves_to.length > 0)
          extractEvolution(chain.evolves_to[0], result);
        return result;
      };
      const evolutionLine = extractEvolution(evolution.chain);

      const megaForms = [
        ...(pokemon.forms
          ?.filter((f) => f.name.includes("mega"))
          ?.map((f) => ({
            name: f.name,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${f.url.split("/")[6]}.png`,
          })) || []),
        ...(species.varieties
          ?.filter((v) => v.pokemon.name.includes("mega"))
          ?.map((v) => ({
            name: v.pokemon.name,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${v.pokemon.url.split("/")[6]}.png`,
          })) || []),
      ];

      const gigantamaxForms = [
        ...(species.varieties
          ?.filter((v) => v.pokemon.name.includes("gmax"))
          ?.map((v) => ({
            name: v.pokemon.name,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${v.pokemon.url.split("/")[6]}.png`,
          })) || []),
      ];

      const [tcgResult, geminiResult] = await Promise.allSettled([
        fetchPokemonCard(pokemon.name),
        getGeminiRecommendation(
          pokemon.name,
          pokemon.types.map((t) => t.type.name),
        ),
      ]);

      const card =
        tcgResult.status === "fulfilled" && tcgResult.value
          ? {
              name: tcgResult.value.name,
              image: tcgResult.value.images?.large,
              rarity: tcgResult.value.rarity,
              hp: tcgResult.value.hp,
              supertype: tcgResult.value.supertype,
            }
          : null;

      const recommendation =
        geminiResult.status === "fulfilled"
          ? geminiResult.value
          : {
              role: "Balanced",
              suggestedMoves: [],
              nature: "Neutral",
            };

      res.status(200).json({
        id: pokemon.id,
        name: pokemon.name,
        sprites: {
          front_default: pokemon.sprites.front_default,
        },
        types: pokemon.types.map((t) => t.type.name),
        stats,
        evolutionLine,
        megaForms,
        gigantamaxForms,
        recommendation,
        card,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PokemonController;
