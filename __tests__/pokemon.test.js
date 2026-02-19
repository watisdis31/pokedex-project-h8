const request = require("supertest");
const app = require("../app");

jest.mock("axios");
jest.mock("../helpers/tcgApi");
jest.mock("../helpers/gemini");

const axios = require("axios");
const { fetchPokemonCard } = require("../helpers/tcgApi");
const { getGeminiRecommendation } = require("../helpers/gemini");

describe("Pokemon Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("GET /pokemon", () => {
    test("success get pokemon list", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          results: [
            { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
            { name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon/2/" },
          ],
        },
      });

      const response = await request(app).get("/pokemon");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("currentPage", 1);
      expect(response.body).toHaveProperty("totalData", 2);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty("sprite");
    });

    test("search filter works", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          results: [
            { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" },
          ],
        },
      });

      const response = await request(app).get("/pokemon?search=pika");

      expect(response.status).toBe(200);
      expect(response.body.data[0].name).toBe("pikachu");
    });

    test("pagination works", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          results: [
            { name: "a", url: "https://pokeapi.co/api/v2/pokemon/1/" },
            { name: "b", url: "https://pokeapi.co/api/v2/pokemon/2/" },
          ],
        },
      });

      const response = await request(app).get("/pokemon?page=1&limit=1");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe("GET /pokemon/:id", () => {
    test("success get pokemon detail", async () => {
      // pokemon
      axios.get
        .mockResolvedValueOnce({
          data: {
            id: 25,
            name: "pikachu",
            sprites: { front_default: "img" },
            stats: [{ stat: { name: "speed" }, base_stat: 90 }],
            types: [{ type: { name: "electric" } }],
            forms: [],
            species: { url: "species-url" },
          },
        })
        .mockResolvedValueOnce({
          data: {
            evolution_chain: { url: "evo-url" },
            varieties: [],
          },
        })
        // evolution
        .mockResolvedValueOnce({
          data: {
            chain: {
              species: {
                name: "pikachu",
                url: "https://pokeapi.co/api/v2/pokemon-species/25/",
              },
              evolves_to: [],
            },
          },
        });

      fetchPokemonCard.mockResolvedValue({
        name: "Pikachu Card",
        images: { large: "card-img" },
        rarity: "Rare",
        hp: "60",
        supertype: "Pokemon",
      });

      getGeminiRecommendation.mockResolvedValue({
        role: "Attacker",
        suggestedMoves: ["Thunderbolt"],
        nature: "Brave",
      });

      const response = await request(app).get("/pokemon/25");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", 25);
      expect(response.body).toHaveProperty("card");
      expect(response.body).toHaveProperty("recommendation");
      expect(response.body.evolutionLine[0]).toHaveProperty("name", "pikachu");
    });

    test("tcg fail should not break response", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: {
            id: 25,
            name: "pikachu",
            sprites: { front_default: "img" },
            stats: [],
            types: [],
            forms: [],
            species: { url: "species-url" },
          },
        })
        .mockResolvedValueOnce({
          data: {
            evolution_chain: { url: "evo-url" },
            varieties: [],
          },
        })
        .mockResolvedValueOnce({
          data: {
            chain: {
              species: {
                name: "pikachu",
                url: "https://pokeapi.co/api/v2/pokemon-species/25/",
              },
              evolves_to: [],
            },
          },
        });

      fetchPokemonCard.mockRejectedValue(new Error("TCG down"));
      getGeminiRecommendation.mockResolvedValue({
        role: "Balanced",
        suggestedMoves: [],
        nature: "Neutral",
      });

      const response = await request(app).get("/pokemon/25");

      expect(response.status).toBe(200);
      expect(response.body.card).toBeNull();
    });

    test("pokemon not found should return error", async () => {
      axios.get.mockRejectedValue(new Error("Not found"));

      const response = await request(app).get("/pokemon/9999");

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
