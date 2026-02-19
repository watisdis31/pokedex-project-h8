const {
  test,
  expect,
  describe,
  beforeAll,
  afterAll,
} = require("@jest/globals");
const request = require("supertest");
const app = require("../app");
const { sequelize } = require("../models");
const { signToken } = require("../helpers/jwt");

let access_token;
let user;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  user = await sequelize.models.User.create({
    username: "bookmarkuser",
    email: "bookmark@mail.com",
    password: "12345",
  });

  access_token = signToken({ id: user.id });
});

afterAll(async () => {
  await sequelize.queryInterface.bulkDelete("Bookmarks", null, {
    cascade: true,
    truncate: true,
    restartIdentity: true,
  });
});

describe("GET /bookmarks", () => {
  test("success get bookmarks", async () => {
    await sequelize.models.Bookmark.create({
      pokemonId: 25,
      UserId: user.id,
    });

    const response = await request(app)
      .get("/bookmarks")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("POST /bookmarks", () => {
  test("success add bookmark", async () => {
    const response = await request(app)
      .post("/bookmarks")
      .set("Authorization", `Bearer ${access_token}`)
      .send({ pokemonId: 1 });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("pokemonId", 1);
  });

  test("pokemonId required", async () => {
    const response = await request(app)
      .post("/bookmarks")
      .set("Authorization", `Bearer ${access_token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  test("duplicate bookmark", async () => {
    await sequelize.models.Bookmark.create({
      pokemonId: 99,
      UserId: user.id,
    });

    const response = await request(app)
      .post("/bookmarks")
      .set("Authorization", `Bearer ${access_token}`)
      .send({ pokemonId: 99 });

    expect(response.status).toBe(400);
  });
});

describe("DELETE /bookmarks/:pokemonId", () => {
  test("success delete", async () => {
    await sequelize.models.Bookmark.create({
      pokemonId: 150,
      UserId: user.id,
    });

    const response = await request(app)
      .delete("/bookmarks/150")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
  });

  test("bookmark not found", async () => {
    const response = await request(app)
      .delete("/bookmarks/999")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
  });
});

describe("Authorization errors", () => {
  test("invalid token", async () => {
    const response = await request(app)
      .get("/bookmarks")
      .set("Authorization", "Bearer asalrandomtoken");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Unauthorized");
  });
});
