const request = require("supertest");
const mongoose = require("mongoose");

let server;

beforeAll(() => {
  server = require("../../src/index");
});

afterAll(async () => {
  await mongoose.connection.close();
  server.close();
});

describe("Auth Service Health Check", () => {
  it("should return 200", async () => {
    const res = await request("http://localhost:4001").get("/health");
    expect(res.statusCode).toBe(200);
  });
});