const request = require("supertest");
const mongoose = require("mongoose");

let server;

beforeAll(() => {
  server = require("../../src/index");
});

afterAll(async () => {
  await mongoose.connection.close();
  await new Promise((resolve)=>{
    server.close(resolve)
  })
});

describe("Auth Service Health Check", () => {
  it("should return 200", async () => {
    const res = await request("http://localhost:4003").get("/health");
    expect(res.statusCode).toBe(200);
  });
});