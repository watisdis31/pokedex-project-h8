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
        search,
        sort = "id",
        order = "ASC",
      } = req.query;

      page = Number(page);
      limit = Number(limit);

      let baseList = [];

      if (generation) {
        const genRes = await axios.get(
          `https://pokeapi.co/api/v2/generation/${generation}`,
        );

        baseList = genRes.data.pokemon_species.map((species) => {
          const urlParts = species.url.split("/").filter(Boolean);
          const id = urlParts[urlParts.length - 1];

          return { id: Number(id) };
        });
      }

      if (type) {
        const typeRes = await axios.get(
          `https://pokeapi.co/api/v2/type/${type}`,
        );

        const typeList = typeRes.data.pokemon.map((p) => {
          const urlParts = p.pokemon.url.split("/").filter(Boolean);
          const id = urlParts[urlParts.length - 1];

          return { id: Number(id) };
        });

        if (generation) {
          const genIds = baseList.map((p) => p.id);
          baseList = typeList.filter((p) => genIds.includes(p.id));
        } else {
          baseList = typeList;
        }
      }

      if (!generation && !type) {
        const defaultRes = await axios.get(
          `https://pokeapi.co/api/v2/pokemon?limit=200`,
        );

        baseList = defaultRes.data.results.map((p) => {
          const urlParts = p.url.split("/").filter(Boolean);
          const id = urlParts[urlParts.length - 1];

          return { id: Number(id) };
        });
      }

      const detailedList = await Promise.all(
        baseList.map(async (p) => {
          const detail = await axios.get(
            `https://pokeapi.co/api/v2/pokemon/${p.id}`,
          );

          return {
            id: detail.data.id,
            name: detail.data.name,
            sprite: detail.data.sprites.front_default,
          };
        }),
      );

      let filteredList = detailedList;

      if (search) {
        filteredList = filteredList.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase()),
        );
      }

      filteredList.sort((a, b) => {
        if (sort === "name") {
          return order === "desc"
            ? b.name.localeCompare(a.name)
            : a.name.localeCompare(b.name);
        }

        return order === "desc" ? b.id - a.id : a.id - b.id;
      });

      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = filteredList.slice(start, end);

      res.status(200).json({
        currentPage: page,
        totalData: filteredList.length,
        data: paginated,
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
        result.push(chain.species.name);
        if (chain.evolves_to.length > 0) {
          extractEvolution(chain.evolves_to[0], result);
        }
        return result;
      };

      const evolutionLine = extractEvolution(evolution.chain);

      const megaForms = [
        ...(pokemon.forms
          ?.filter((f) => f.name.includes("mega"))
          ?.map((f) => f.name) || []),
        ...(species.varieties
          ?.filter((v) => v.pokemon.name.includes("mega"))
          ?.map((v) => v.pokemon.name) || []),
      ];

      const gigantamaxForms = [
        ...(species.varieties
          ?.filter((v) => v.pokemon.name.includes("gmax"))
          ?.map((v) => v.pokemon.name) || []),
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
