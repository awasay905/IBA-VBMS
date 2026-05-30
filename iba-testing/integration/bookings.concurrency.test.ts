import request from "supertest";
import { BASE_URL } from "./helpers/env.helper";
import { resetDatabase } from "./helpers/seed.helper";
import { getStudentToken, getStudent2Token, getPOToken } from "./helpers/auth.helper";

jest.setTimeout(30000);

describe("PO Approval Concurrency", () => {
    it("TC-BOOK-009: simultaneous approval of different requests for the same slot must result in one success and one conflict", async () => {
        await resetDatabase();

        const s1Token = await getStudentToken();
        const s2Token = await getStudent2Token();
        const poToken = await getPOToken();

        const roomAId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
        const date = "2026-12-01";
        const slot = 3;

        // 1. Both students successfully apply for the same slot
        const res1 = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${s1Token}`)
            .send({
                room_id: roomAId,
                date,
                slot_id: slot,
                purpose: "Student 1 Request",
            })
            .expect(201);

        const res2 = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${s2Token}`)
            .send({
                room_id: roomAId,
                date,
                slot_id: slot,
                purpose: "Student 2 Request",
            })
            .expect(201);

        const idA = res1.body.id;
        const idB = res2.body.id;

        // 2. PO tries to approve Student A and Student B SIMULTANEOUSLY
        const approveA = request(BASE_URL)
            .patch(`/api/bookings/${idA}/approve`)
            .set("Authorization", `Bearer ${poToken}`)
            .send();
        const approveB = request(BASE_URL)
            .patch(`/api/bookings/${idB}/approve`)
            .set("Authorization", `Bearer ${poToken}`)
            .send();

        const results = await Promise.allSettled([approveA, approveB]);
        const statuses = results.map((r) => (r.status === "fulfilled" ? r.value.status : 0));

        // 3. Assertions:
        // One PO action must succeed (200), the other must be blocked by the DB index (409)
        expect(statuses).toContain(200);
        expect(statuses).toContain(409);

        const successCount = statuses.filter((s) => s === 200).length;
        const conflictCount = statuses.filter((s) => s === 409).length;

        expect(successCount).toBe(1);
        expect(conflictCount).toBe(1);
    });
});
