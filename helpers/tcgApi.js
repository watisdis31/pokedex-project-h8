const axios = require("axios");

async function fetchPokemonCard(name) {
  try {
    const response = await axios.get(
      "https://api.pokemontcg.io/v2/cards",
      {
        headers: {
          "X-Api-Key": process.env.TCG_API_KEY,
        },
        params: {
          q: `name:${name}`,
          pageSize: 1,
        },
        timeout: 3000,
      }
    );

    return response.data.data[0] || null;
  } catch (error) {
    return null;
  }
}

module.exports = { fetchPokemonCard };
