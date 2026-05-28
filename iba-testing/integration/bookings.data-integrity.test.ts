import request from "supertest";
import { BASE_URL } from "./helpers/env.helper";
import { resetDatabase } from "./helpers/seed.helper";
import { getStudentToken, getPOToken } from "./helpers/auth.helper";

describe("Data Integrity & Audit Trail (TC-DATA-001)", () => {
    let studentToken: string;
    let poToken: string;
    const roomAId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    beforeAll(async () => {
        await resetDatabase();
        studentToken = await getStudentToken();
        poToken = await getPOToken();
    });

    it("TC-DATA-001: should maintain accurate audit trail (updated_at) across booking lifecycle", async () => {
        // 1. Student Creates Booking
        const createRes = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: "2026-10-10",
                slot_id: 2,
                purpose: "Audit Trail Test",
            })
            .expect(201);

        const bookingId = createRes.body.id;
        const initialCreatedAt = new Date(createRes.body.created_at).getTime();
        const initialUpdatedAt = new Date(createRes.body.updated_at).getTime();

        // 2. Artificial delay (1 second) so 'updated_at' timestamp demonstrably changes
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 3. PO Approves Booking
        const approveRes = await request(BASE_URL)
            .patch(`/api/bookings/${bookingId}/approve`)
            .set("Authorization", `Bearer ${poToken}`)
            .expect(200);

        const newUpdatedAt = new Date(approveRes.body.updated_at).getTime();

        // 4. Assertions: Ensure updated_at correctly advanced
        expect(newUpdatedAt).toBeGreaterThan(initialUpdatedAt);
        expect(newUpdatedAt).toBeGreaterThan(initialCreatedAt);

        // 5. Fetch booking to verify audit fields are exposed
        const getRes = await request(BASE_URL)
            .get(`/api/bookings/${bookingId}`)
            .set("Authorization", `Bearer ${studentToken}`)
            .expect(200);

        // NOTE: This assertion will likely fail because 'reviewed_by' is omitted
        // from the SELECT query in `bookings.service.ts`.
        // This is a valid Data Integrity defect to report!
        expect(getRes.body).toHaveProperty("reviewed_by");
        expect(getRes.body.reviewed_by).not.toBeNull();
    });
});
