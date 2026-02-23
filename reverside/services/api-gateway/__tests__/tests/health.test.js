const request = require("supertest");

let server;

beforeAll(() => {
  server = require("../../index"); // this starts your server
});

afterAll((done) => {
  server.close(done); // close server after test
});

describe("Auth Service Health Check", () => {
  it("should return 200", async () => {
    const res = await request("http://localhost:4000").get("/health");
    expect(res.statusCode).toBe(200);
  });
});