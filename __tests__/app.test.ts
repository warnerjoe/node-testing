import request from 'supertest';
import app from '../src/app';

describe("App Routes", () => {
    test("GET / should return 'Hello world!'", async () => {
        const response = await request(app).get("/");
        expect(response.status).toBe(200);
        expect(response.text).toBe("Hello world!");
    });
});