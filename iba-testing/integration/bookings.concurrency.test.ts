import request from "supertest";
import { BASE_URL } from "./helpers/env.helper";
import { resetDatabase } from "./helpers/seed.helper";
import { getStudentToken, getStudent2Token } from "./helpers/auth.helper";

describe("Booking Concurrency Feature", () => {
    it("TC-BOOK-009: simultaneous booking requests for the exact same slot must result in exactly one success and one conflict failure", async () => {
        // 1. Reset database to clear any active schedules
        await resetDatabase();

        // 2. Fetch tokens for both distinct test students
        const student1Token = await getStudentToken();
        const student2Token = await getStudent2Token();

        // Hardcoded Room A ID from seedTestData.sql
        const roomAId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        // Pick a future date and slot with no existing bookings
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 25);
        const bookingDate = targetDate.toISOString().split("T")[0];
        const targetSlotId = 3;

        // Define both concurrent booking request payloads
        const request1 = request(BASE_URL).post("/api/bookings").set("Authorization", `Bearer ${student1Token}`).send({
            room_id: roomAId,
            date: bookingDate,
            slot_id: targetSlotId,
            purpose: "Concurrency Test - Student 1",
        });

        const request2 = request(BASE_URL).post("/api/bookings").set("Authorization", `Bearer ${student2Token}`).send({
            room_id: roomAId,
            date: bookingDate,
            slot_id: targetSlotId,
            purpose: "Concurrency Test - Student 2",
        });

        // 3. Fire both requests simultaneously
        const results = await Promise.allSettled([request1, request2]);

        const statuses: number[] = [];

        results.forEach((result) => {
            if (result.status === "fulfilled") {
                statuses.push(result.value.status);
            } else {
                // If a request fails at the network layer, capture the error details
                console.error("Request rejected at network/supertest level:", result.reason);
            }
        });

        // 4. Assertions to confirm system data consistency:
        // Exactly one student must successfully claim the slot (201 Created).
        // Exactly one student must be rejected with a conflict error (409 Conflict).
        expect(statuses.length).toBe(2);
        expect(statuses).toContain(201);
        expect(statuses).toContain(409);

        // Verify the status counts to confirm there is no double booking scenario
        const successCount = statuses.filter((status) => status === 201).length;
        const conflictCount = statuses.filter((status) => status === 409).length;

        expect(successCount).toBe(1);
        expect(conflictCount).toBe(1);
    });
});
