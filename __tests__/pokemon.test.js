const request = require("supertest");
const app = require("../app");

jest.mock("axios");
jest.mock("../helpers/tcgApi");
jest.mock("../helpers/gemini");

const axios = require("axios");
const { fetchPokemonCard } = require("../helpers/tcgApi");
const { getGeminiRecommendation } = require("../helpers/gemini");

const { test, expect, describe } = require("@jest/globals");

describe("Pokemon Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("GET /pokemon", () => {
    test("success get pokemon list", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: {
            results: [
              { url: "https://pokeapi.co/api/v2/pokemon/1/" },
              { url: "https://pokeapi.co/api/v2/pokemon/2/" },
            ],
          },
        })
        .mockResolvedValueOnce({
          data: {
            id: 1,
            name: "bulbasaur",
            sprites: { front_default: "img1" },
          },
        })
        .mockResolvedValueOnce({
          data: {
            id: 2,
            name: "ivysaur",
            sprites: { front_default: "img2" },
          },
        });

      const response = await request(app).get("/pokemon");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("currentPage", 1);
      expect(response.body).toHaveProperty("totalData", 2);
      expect(response.body.data.length).toBe(2);
    });

    test("search filter works", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: {
            results: [{ url: "https://pokeapi.co/api/v2/pokemon/25/" }],
          },
        })
        .mockResolvedValueOnce({
          data: {
            id: 25,
            name: "pikachu",
            sprites: { front_default: "img" },
          },
        });

      const response = await request(app).get("/pokemon?search=pika");

      expect(response.status).toBe(200);
      expect(response.body.data[0].name).toBe("pikachu");
    });

    test("pagination works", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: {
            results: [
              { url: "https://pokeapi.co/api/v2/pokemon/1/" },
              { url: "https://pokeapi.co/api/v2/pokemon/2/" },
            ],
          },
        })
        .mockResolvedValueOnce({
          data: {
            id: 1,
            name: "a",
            sprites: { front_default: "" },
          },
        })
        .mockResolvedValueOnce({
          data: {
            id: 2,
            name: "b",
            sprites: { front_default: "" },
          },
        });

      const response = await request(app).get("/pokemon?page=1&limit=1");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe("GET /pokemon/:id", () => {
    test("success get pokemon detail", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: {
            id: 25,
            name: "pikachu",
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
        // evolution chain
        .mockResolvedValueOnce({
          data: {
            chain: {
              species: { name: "pichu" },
              evolves_to: [
                {
                  species: { name: "pikachu" },
                  evolves_to: [],
                },
              ],
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
      expect(response.body.evolutionLine).toContain("pikachu");
    });

    test("tcg fail should not break response", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: {
            id: 25,
            name: "pikachu",
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
              species: { name: "pikachu" },
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
