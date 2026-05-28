import request from "supertest";
import { resetDatabase } from "./helpers/seed.helper";
import { BASE_URL } from "./helpers/env.helper";
import { getStudentToken, getAdminToken, getStudent2Token } from "./helpers/auth.helper";

jest.setTimeout(30000);

describe("Student Room Booking Creation Feature", () => {
    let studentToken: string;
    let student2Token: string;
    let adminToken: string;

    // Hardcoded Room IDs from your seedTestData.sql
    const roomAId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    // We use dynamically generated future dates to guarantee stability across test runs
    const getFutureDate = (daysAhead: number): string => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        return d.toISOString().split("T")[0];
    };

    beforeAll(async () => {
        await resetDatabase();
        studentToken = await getStudentToken();
        student2Token = await getStudent2Token();
        adminToken = await getAdminToken();
    });

    it("TC-BOOK-001: happy path (creates a pending booking when no conflicts exist)", async () => {
        const bookingDate = getFutureDate(5); // 5 days in the future (no seed conflict)

        const res = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: bookingDate,
                slot_id: 3,
                purpose: "Study Group Meeting",
            })
            .expect(201);

        expect(res.body).toHaveProperty("id");
        expect(res.body.status).toBe("pending");
        expect(res.body.rooms.id).toBe(roomAId);
        expect(res.body.slot_id).toBe(3);
    });

    it("TC-BOOK-002: duplicate slot rejected (cannot book an already booked slot)", async () => {
        const bookingDate = getFutureDate(12); // Use a distinct future date to keep test isolated

        // Step 1: Book slot 4 on date X (Expected to pass)
        await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: bookingDate,
                slot_id: 4,
                purpose: "First Booking",
            })
            .expect(201);

        // Step 2: Book the exact same slot 4 on date X again (Expected to be rejected)
        await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: bookingDate,
                slot_id: 4,
                purpose: "Duplicate Booking attempt",
            })
            .expect(409);
    });

    it("TC-BOOK-003: blocked slot rejected (cannot book a slot blocked by an administrator)", async () => {
        const bookingDate = getFutureDate(15);

        // 1. Admin blocks Slot 2 on date X
        await request(BASE_URL)
            .post("/api/blocked-slots")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                room_id: roomAId,
                date: bookingDate,
                slot_ids: [2],
                reason: "Maintenance Block",
            })
            .expect(201);

        // 2. Student attempts to book the blocked Slot 2 on date X
        await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: bookingDate,
                slot_id: 2,
                purpose: "Trying to book blocked slot",
            })
            .expect(409);
    });

    it("TC-BOOK-004 to 007: Boundary test — should reject out-of-bounds slot_ids with 400 Bad Request", async () => {
        const bookingDate = getFutureDate(14);

        // 1. Lower Boundary (slot_id: 0) - Maps to time before 8:30 AM
        const resLower = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: bookingDate,
                slot_id: 0,
                purpose: "Early Boundary Test (TC-BOOK-006)",
            });

        // 2. Upper Boundary (slot_id: 8) - Maps to time after 6:45 PM
        const resUpper = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: bookingDate,
                slot_id: 8,
                purpose: "Late Boundary Test (TC-BOOK-007)",
            });

        // ASSERTIONS:
        // Proper DTO validation should catch this and return a 400 Bad Request.
        // NOTE: If this fails with a 500 Internal Server Error, it proves DEF-010
        // (Missing @Min(1) and @Max(7) in CreateBookingDto).
        expect(resLower.status).toBe(400);
        expect(resUpper.status).toBe(400);
    });

    it("TC-BOOK-008: missing purpose field rejected with validation error", async () => {
        const bookingDate = getFutureDate(6);

        await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: bookingDate,
                slot_id: 5,
                // 'purpose' is intentionally omitted
            })
            .expect(400);
    });

    it("past date rejected (should block bookings on previous dates)", async () => {
        // Note: Past date requests should be handled with a HTTP 400 validation block.
        // If this test fails, it points to a business logic gap in the backend.
        await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: "2020-01-01", // Explicit historical past date
                slot_id: 1,
                purpose: "Booking in the past",
            })
            .expect(400);
    });

    it("BUG: Cancelled/Rejected slots should be re-bookable but are blocked by DB constraints", async () => {
        const targetDate = getFutureDate(20);
        const slot = 1;

        // 1. Student 1 books a slot
        const res1 = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({ room_id: roomAId, date: targetDate, slot_id: slot, purpose: "First Booking" })
            .expect(201);

        // 2. Student 1 cancels their booking
        await request(BASE_URL)
            .patch(`/api/bookings/${res1.body.id}/cancel`)
            .set("Authorization", `Bearer ${studentToken}`)
            .expect(200);

        // 3. Student 2 tries to book the SAME slot (This SHOULD work in a real system)
        // In your system, this will return 500 or 409 because of the DB Unique Constraint
        const res2 = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${student2Token}`)
            .send({ room_id: roomAId, date: targetDate, slot_id: slot, purpose: "Second Booking attempt" });

        // THE ASSERTION: This will likely fail with 409 or 500, proving the bug.
        expect(res2.status).toBe(201);
    });
});
