import { getStudentToken, getPOToken } from "./helpers/auth.helper";
import request from "supertest";
import { BASE_URL } from "./helpers/env.helper";
import { resetDatabase } from "./helpers/seed.helper";

describe("Role-Based Access Control (RBAC) Security", () => {
    let studentToken: string;
    let poToken: string;

    beforeAll(async () => {
        // Seed database and fetch valid authorization tokens
        await resetDatabase();
        studentToken = await getStudentToken();
        poToken = await getPOToken();
    });

    // ==========================================
    // TC-AUTH-004: Protected Routes (No Token)
    // ==========================================
    describe("TC-AUTH-004: No Token Blocked", () => {
        it("should block access to GET /api/bookings without a token", async () => {
            await request(BASE_URL).get("/api/bookings").expect(401);
        });

        it("should block access to GET /api/buildings without a token", async () => {
            await request(BASE_URL).get("/api/buildings").expect(401);
        });
    });

    // ==========================================
    // TC-AUTH-005: Student Restrictions
    // ==========================================
    describe("TC-AUTH-005: Student Role Restrictions", () => {
        it("should block a student from creating users (POST /api/users)", async () => {
            await request(BASE_URL)
                .post("/api/users")
                .set("Authorization", `Bearer ${studentToken}`)
                .send({
                    erp: "new-student-erp",
                    name: "New Student",
                    email: "newstudent@iba.edu.pk",
                    password: "password123",
                    role: "student",
                })
                .expect(403);
        });

        it("should block a student from deleting a building (DELETE /api/buildings/:id)", async () => {
            // Using an arbitrary UUID for the request
            const arbitraryId = "00000000-0000-0000-0000-000000000000";
            await request(BASE_URL)
                .delete(`/api/buildings/${arbitraryId}`)
                .set("Authorization", `Bearer ${studentToken}`)
                .expect(403);
        });
    });

    // ==========================================
    // TC-AUTH-006: Program Office Restrictions
    // ==========================================
    describe("TC-AUTH-006: PO Role Restrictions", () => {
        it("should block a PO member from creating users (POST /api/users)", async () => {
            await request(BASE_URL)
                .post("/api/users")
                .set("Authorization", `Bearer ${poToken}`)
                .send({
                    erp: "another-user",
                    name: "Another User",
                    email: "another@iba.edu.pk",
                    password: "password123",
                    role: "student",
                })
                .expect(403);
        });

        it("should block a PO member from adding a building (POST /api/buildings)", async () => {
            await request(BASE_URL)
                .post("/api/buildings")
                .set("Authorization", `Bearer ${poToken}`)
                .send({
                    name: "Unallowed PO Building",
                    location: "City Campus",
                })
                .expect(403);
        });
    });

    // ==========================================
    // Authorized Student Reads
    // ==========================================
    describe("Student Authorized Actions", () => {
        it("should allow a student to read buildings (GET /api/buildings)", async () => {
            const res = await request(BASE_URL)
                .get("/api/buildings")
                .set("Authorization", `Bearer ${studentToken}`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
        });

        it("should allow a student to read rooms (GET /api/rooms)", async () => {
            const res = await request(BASE_URL)
                .get("/api/rooms")
                .set("Authorization", `Bearer ${studentToken}`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
        });
    });
});
