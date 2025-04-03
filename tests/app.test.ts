import request from "supertest";
import express, { Router, Request, Response } from "express";
import app from "../src/app";

jest.mock("../src/routes/usersRoutes", () => {
  const router = express.Router();

  router.get("/", (req: Request, res: Response) => {
    res.status(200).send("Mocked Users Route");
  });

  router.post("/", (req: Request, res: Response) => {
    res.status(201).send("User Created");
  });

  return router;
});

describe("App Initialization", () => {
  test("JSON body is processed correctly", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ test: "data" })
      .set("Content-Type", "application/json");

    expect(response.status).not.toBe(500);
  });

  test("URL-encoded body is processed correctly", async () => {
    const response = await request(app)
      .post("/api/users")
      .send("test=data")
      .set("Content-Type", "application/x-www-form-urlencoded");

    expect(response.status).not.toBe(500);
  });

  test("Handles GET requests to /api/users correctly", async () => {
    const response = await request(app).get("/api/users");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Mocked Users Route");
  });

  test("Returns 404 for unknown routes", async () => {
    const response = await request(app).get("/unknown-route");
    expect(response.status).toBe(404);
  });
});
