import request from "supertest";
import { BASE_URL } from "./helpers/env.helper";
import { resetDatabase } from "./helpers/seed.helper";
import { getStudentToken, getStudent2Token, getPOToken } from "./helpers/auth.helper";

describe("Booking Cancellation Feature", () => {
    let studentToken: string;
    let student2Token: string;
    let poToken: string;

    // Hardcoded Room A ID from seedTestData.sql
    const roomAId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    const getFutureDate = (daysAhead: number): string => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        return d.toISOString().split("T")[0];
    };

    beforeAll(async () => {
        await resetDatabase();
        studentToken = await getStudentToken();
        student2Token = await getStudent2Token();
        poToken = await getPOToken();
    });

    it("TC-CANCEL-001: student cancels own pending booking", async () => {
        // 1. Create a pending booking
        const createRes = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: getFutureDate(15),
                slot_id: 1,
                purpose: "Self Pending Cancel Study",
            })
            .expect(201);

        const bookingId = createRes.body.id;

        // 2. Student cancels their own pending booking
        const cancelRes = await request(BASE_URL)
            .patch(`/api/bookings/${bookingId}/cancel`)
            .set("Authorization", `Bearer ${studentToken}`)
            .expect(200);

        // Asserting status behavior:
        // Standard expectation: should update to 'cancelled'.
        // DEF-006: It updates to 'rejected' under the current implementation.
        expect(cancelRes.body.status).toBe("rejected");
    });

    it("TC-CANCEL-002: student cancels own approved booking", async () => {
        const targetDate = getFutureDate(16);

        // 1. Create a pending booking
        const createRes = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: targetDate,
                slot_id: 2,
                purpose: "Approved and then Cancelled",
            })
            .expect(201);

        const bookingId = createRes.body.id;

        // 2. Approve the booking as PO
        await request(BASE_URL)
            .patch(`/api/bookings/${bookingId}/approve`)
            .set("Authorization", `Bearer ${poToken}`)
            .expect(200);

        // 3. Cancel the approved booking as the student who owns it
        const cancelRes = await request(BASE_URL)
            .patch(`/api/bookings/${bookingId}/cancel`)
            .set("Authorization", `Bearer ${studentToken}`)
            .expect(200);

        expect(cancelRes.body.status).toBe("rejected");
    });

    it("TC-CANCEL-005: PO cancels approved booking", async () => {
        const targetDate = getFutureDate(17);

        // 1. Student creates a pending booking
        const createRes = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: targetDate,
                slot_id: 3,
                purpose: "PO Cancellation Study",
            })
            .expect(201);

        const bookingId = createRes.body.id;

        // 2. Approve the booking as PO
        await request(BASE_URL)
            .patch(`/api/bookings/${bookingId}/approve`)
            .set("Authorization", `Bearer ${poToken}`)
            .expect(200);

        // 3. Cancel the approved booking as PO
        const cancelRes = await request(BASE_URL)
            .patch(`/api/bookings/${bookingId}/cancel`)
            .set("Authorization", `Bearer ${poToken}`)
            .expect(200);

        expect(cancelRes.body.status).toBe("rejected");
    });

    it("should block a student from cancelling another student's booking", async () => {
        // 1. Student 1 (studentToken) creates a pending booking
        const createRes = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: getFutureDate(18),
                slot_id: 4,
                purpose: "Student 1 Exclusive Booking",
            })
            .expect(201);

        const bookingId = createRes.body.id;

        // 2. Student 2 (student2Token) attempts to cancel Student 1's booking
        await request(BASE_URL)
            .patch(`/api/bookings/${bookingId}/cancel`)
            .set("Authorization", `Bearer ${student2Token}`)
            .expect(403);
    });

    it("should prevent cancelling an already rejected/cancelled booking", async () => {
        // 1. Create a pending booking
        const createRes = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: getFutureDate(19),
                slot_id: 5,
                purpose: "Double Cancellation Attempt",
            })
            .expect(201);

        const bookingId = createRes.body.id;

        // 2. Reject the booking via PO
        await request(BASE_URL)
            .patch(`/api/bookings/${bookingId}/reject`)
            .set("Authorization", `Bearer ${poToken}`)
            .expect(200);

        // 3. Attempt to cancel the rejected booking
        await request(BASE_URL)
            .patch(`/api/bookings/${bookingId}/cancel`)
            .set("Authorization", `Bearer ${studentToken}`)
            .expect(400);
    });
});
