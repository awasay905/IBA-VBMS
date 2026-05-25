import request from "supertest";
import { resetDatabase } from "./helpers/seed.helper";
import { BASE_URL } from "./helpers/env.helper";
import { getAdminToken } from "./helpers/auth.helper";

describe("Admin User Management Feature", () => {
    let adminToken: string;

    beforeAll(async () => {
        await resetDatabase();
        adminToken = await getAdminToken();
    });

    it("TC-ADMIN-001: admin creates student and verifies DB persistence", async () => {
        const studentDto = {
            erp: "new-student-999",
            name: "Created Student",
            email: "createdstudent@iba.edu.pk",
            password: "newpassword123",
            role: "student",
        };

        // 1. Create the student
        const res = await request(BASE_URL)
            .post("/api/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(studentDto)
            .expect(201);

        // Assert that the password field is not returned in the payload
        expect(res.body).toHaveProperty("id");
        expect(res.body).toHaveProperty("erp", studentDto.erp);
        expect(res.body).not.toHaveProperty("password");

        // 2. Perform a follow-up check to confirm real DB persistence
        const listRes = await request(BASE_URL)
            .get("/api/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .expect(200);

        const createdUserInList = listRes.body.find((u: any) => u.erp === studentDto.erp);
        expect(createdUserInList).toBeDefined();
        expect(createdUserInList.name).toBe(studentDto.name);
    });

    it("TC-ADMIN-003: admin creates PO member", async () => {
        const poDto = {
            erp: "new-po-888",
            name: "Created PO Staff",
            email: "createdpo@iba.edu.pk",
            password: "newpassword123",
            role: "programoffice",
        };

        const res = await request(BASE_URL)
            .post("/api/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(poDto)
            .expect(201);

        expect(res.body).toHaveProperty("id");
        expect(res.body).toHaveProperty("role", "programoffice");
        expect(res.body).not.toHaveProperty("password");
    });

    it("TC-ADMIN-002: duplicate ERP rejected", async () => {
        // Attempting to create a user with an ERP ("12345") that is already seeded in the database
        const duplicateDto = {
            erp: "test-student", // This ERP is already present in the seeded data
            name: "Duplicate Student",
            email: "duplicate@iba.edu.pk",
            password: "password123",
            role: "student",
        };

        await request(BASE_URL)
            .post("/api/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(duplicateDto)
            .expect(409);
    });

    it("missing required field rejected with validation error", async () => {
        const missingFieldDto = {
            erp: "incomplete-student",
            name: "No Email Student",
            password: "password123",
            role: "student",
            // 'email' is intentionally missing
        };

        await request(BASE_URL)
            .post("/api/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(missingFieldDto)
            .expect(400);
    });

    it("invalid email format rejected with validation error", async () => {
        const invalidEmailDto = {
            erp: "bad-email-student",
            name: "Bad Email Student",
            email: "not-an-email",
            password: "password123",
            role: "student",
        };

        await request(BASE_URL)
            .post("/api/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(invalidEmailDto)
            .expect(400);
    });
});
