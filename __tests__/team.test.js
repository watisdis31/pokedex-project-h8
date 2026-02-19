const {
  test,
  expect,
  describe,
  beforeAll,
  afterAll,
} = require("@jest/globals");

const request = require("supertest");
const app = require("../app");
const { sequelize, User, UserTeam, TeamPokemon } = require("../models");
const { signToken } = require("../helpers/jwt");
const axios = require("axios");

jest.mock("axios");

let access_token;
let user;
let team;

let secondUser;
let secondToken;

beforeAll(async () => {
  await sequelize.queryInterface.bulkDelete("TeamPokemons", null, {
    restartIdentity: true,
    cascade: true,
    truncate: true,
  });
  await sequelize.queryInterface.bulkDelete("UserTeams", null, {
    restartIdentity: true,
    cascade: true,
    truncate: true,
  });
  await sequelize.queryInterface.bulkDelete("Users", null, {
    restartIdentity: true,
    cascade: true,
    truncate: true,
  });

  user = await User.create({
    username: "vincent",
    email: "vincent@mail.com",
    password: "123456",
    role: "User",
  });

  access_token = signToken({
    id: user.id,
    email: user.email,
  });

  team = await UserTeam.create({
    name: "My First Team",
    UserId: user.id,
  });

  secondUser = await User.create({
    username: "other",
    email: "other@mail.com",
    password: "123456",
    role: "User",
  });

  secondToken = signToken({
    id: secondUser.id,
    email: secondUser.email,
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe("POST /teams", () => {
  test("should create new team", async () => {
    const res = await request(app)
      .post("/teams")
      .set("Authorization", `Bearer ${access_token}`)
      .send({
        name: "Pokemon Master",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Pokemon Master");
  });

  test("should return 401 if no token", async () => {
    const res = await request(app).post("/teams").send({
      name: "Fail Team",
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /teams", () => {
  test("should get my teams", async () => {
    const res = await request(app)
      .get("/teams")
      .set("Authorization", `Bearer ${access_token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalData");
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("should support pagination", async () => {
    const res = await request(app)
      .get("/teams?page=1&limit=2")
      .set("Authorization", `Bearer ${access_token}`);

    expect(res.status).toBe(200);
    expect(res.body.currentPage).toBe(1);
  });
});

describe("GET /teams/:id", () => {
  test("should get team detail with pokemons", async () => {
    await TeamPokemon.create({
      UserTeamId: team.id,
      pokemonId: 1,
    });

    axios.get.mockResolvedValue({
      data: {
        id: 1,
        name: "bulbasaur",
        types: [{ type: { name: "grass" } }],
      },
    });

    const res = await request(app)
      .get(`/teams/${team.id}`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("pokemons");
    expect(res.body.pokemons[0].name).toBe("bulbasaur");
  });
});

describe("POST /teams/:teamId/pokemon", () => {
  test("should add pokemon to team", async () => {
    const res = await request(app)
      .post(`/teams/${team.id}/pokemon`)
      .set("Authorization", `Bearer ${access_token}`)
      .send({
        pokemonId: 25,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("pokemonId");
  });

  test("should return error if duplicate", async () => {
    await TeamPokemon.create({
      UserTeamId: team.id,
      pokemonId: 99,
    });

    const res = await request(app)
      .post(`/teams/${team.id}/pokemon`)
      .set("Authorization", `Bearer ${access_token}`)
      .send({
        pokemonId: 99,
      });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /teams/:teamId/pokemon/:pokemonId", () => {
  test("should remove pokemon", async () => {
    await TeamPokemon.create({
      UserTeamId: team.id,
      pokemonId: 150,
    });

    const res = await request(app)
      .delete(`/teams/${team.id}/pokemon/150`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Pokemon removed from team");
  });
});

describe("DELETE /teams/:id", () => {
  test("should delete team", async () => {
    const newTeam = await UserTeam.create({
      name: "Delete Me",
      UserId: user.id,
    });

    const res = await request(app)
      .delete(`/teams/${newTeam.id}`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Team deleted successfully");
  });
});

describe("TeamNotFound", () => {
  test("should return 404 when team not found (GET detail)", async () => {
    const res = await request(app)
      .get("/teams/99999")
      .set("Authorization", `Bearer ${access_token}`);

    expect(res.status).toBe(404);
  });

  test("should return 404 when adding pokemon to non-existing team", async () => {
    const res = await request(app)
      .post("/teams/99999/pokemon")
      .set("Authorization", `Bearer ${access_token}`)
      .send({ pokemonId: 1 });

    expect(res.status).toBe(404);
  });

  test("should return 404 when deleting non-existing team", async () => {
    const res = await request(app)
      .delete("/teams/99999")
      .set("Authorization", `Bearer ${access_token}`);

    expect(res.status).toBe(404);
  });
});

describe("TeamFull", () => {
  test("should return 400 when team already has 6 pokemon", async () => {
    const fullTeam = await UserTeam.create({
      name: "Full Team",
      UserId: user.id,
    });

    for (let i = 1; i <= 6; i++) {
      await TeamPokemon.create({
        UserTeamId: fullTeam.id,
        pokemonId: i,
      });
    }

    const res = await request(app)
      .post(`/teams/${fullTeam.id}/pokemon`)
      .set("Authorization", `Bearer ${access_token}`)
      .send({ pokemonId: 99 });

    expect(res.status).toBe(400);
  });
});

describe("PokemonNotInTeam", () => {
  test("should return 404 when pokemon not in team", async () => {
    const newTeam = await UserTeam.create({
      name: "Test Remove",
      UserId: user.id,
    });

    const res = await request(app)
      .delete(`/teams/${newTeam.id}/pokemon/999`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(res.status).toBe(404);
  });
});

describe("Forbidden", () => {
  test("should return 403 when accessing other user's team", async () => {
    const res = await request(app)
      .get(`/teams/${team.id}`)
      .set("Authorization", `Bearer ${secondToken}`);

    expect(res.status).toBe(403);
  });

  test("should return 403 when deleting other user's team", async () => {
    const res = await request(app)
      .delete(`/teams/${team.id}`)
      .set("Authorization", `Bearer ${secondToken}`);

    expect(res.status).toBe(403);
  });
});
