import request from "supertest";
import { BASE_URL } from "./helpers/env.helper";
import { resetDatabase } from "./helpers/seed.helper";

describe("Authentication Feature", () => {
    beforeAll(async () => {
        // Seed the database to ensure test-student and test-po exist with "testpass"
        await resetDatabase();
    });

    it("TC-AUTH-001: student login returns token and user info without password", async () => {
        const res = await request(BASE_URL).post("/api/auth/login").send({ erp: "test-student", password: "testpass" });

        // NestJS POST endpoints default to 201, but we allow 200 or 201 for robustness
        expect([200, 201]).toContain(res.status);

        // Key assertions on successful login token
        expect(res.body).toHaveProperty("access_token");
        expect(typeof res.body.access_token).toBe("string");
        expect(res.body.access_token.length).toBeGreaterThan(0);

        // Key assertions on user profile
        expect(res.body).toHaveProperty("user");
        const user = res.body.user;
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("erp", "test-student");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("role", "student");

        // Safety check: password hash must not be returned in the response payload
        expect(user).not.toHaveProperty("password");
    });

    it("TC-AUTH-002: PO login returns token and program office role", async () => {
        const res = await request(BASE_URL).post("/api/auth/login").send({ erp: "test-po", password: "testpass" });

        expect([200, 201]).toContain(res.status);
        expect(res.body).toHaveProperty("access_token");
        expect(res.body.user).toHaveProperty("role", "programoffice");
        expect(res.body.user).not.toHaveProperty("password");
    });

    it("TC-AUTH-003a: wrong password rejected", async () => {
        const res = await request(BASE_URL)
            .post("/api/auth/login")
            .send({ erp: "test-student", password: "wrongpassword" })
            .expect(401);

        expect(res.body).toHaveProperty("message");
    });

    it("TC-AUTH-003b: unknown user rejected", async () => {
        const res = await request(BASE_URL)
            .post("/api/auth/login")
            .send({ erp: "unknown-student", password: "testpass" })
            .expect(401);

        expect(res.body).toHaveProperty("message");
    });

    it("empty body rejected with validation error", async () => {
        const res = await request(BASE_URL).post("/api/auth/login").send({}).expect(400);

        expect(res.body).toHaveProperty("message");
    });
});
