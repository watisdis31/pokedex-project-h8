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

let userToken;
let testUserId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const user = await sequelize.models.User.create({
    username: "testuser",
    email: "test@mail.com",
    password: "12345",
  });

  testUserId = user.id;

  userToken = signToken({
    id: user.id,
  });
});

afterAll(async () => {
  await sequelize.queryInterface.bulkDelete("Users", null, {
    cascade: true,
    truncate: true,
    restartIdentity: true,
  });
});

describe("POST /auth/login", () => {
  test("success login", async () => {
    const data = {
      email: "test@mail.com",
      password: "12345",
    };

    const response = await request(app).post("/auth/login").send(data);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("access_token", expect.any(String));
  });

  test("email not registered", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "notfound@mail.com",
      password: "12345",
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });

  test("invalid password", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "test@mail.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });
});

describe("POST /auth/register", () => {
  test("success register", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "newuser",
      email: "new@mail.com",
      password: "12345",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });

  test("email already registered", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "testuser",
      email: "test@mail.com",
      password: "12345",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });
});

describe("POST /auth/google-login", () => {
  test("google token not provided", async () => {
    const response = await request(app).post("/auth/google-login").send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });
});
