import request from "supertest";
import { resetDatabase } from "./helpers/seed.helper";
import { BASE_URL } from "./helpers/env.helper";
import { getStudentToken, getPOToken } from "./helpers/auth.helper";

jest.setTimeout(30000);

describe("Program Office (PO) Booking Management Feature", () => {
    let studentToken: string;
    let poToken: string;

    // Variables to hold created booking IDs for the tests
    let pendingBookingId1: string;
    let pendingBookingId2: string;

    // Hardcoded Room A ID from your seedTestData.sql
    const roomAId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    const getFutureDate = (daysAhead: number): string => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        return d.toISOString().split("T")[0];
    };

    beforeAll(async () => {
        await resetDatabase();
        studentToken = await getStudentToken();
        poToken = await getPOToken();

        // Setup 1: Create a pending booking for standard approval testing
        const setupRes1 = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: getFutureDate(10),
                slot_id: 3,
                purpose: "PO Evaluation Group 1",
            });
        pendingBookingId1 = setupRes1.body.id;

        // Setup 2: Create a separate pending booking for rejection testing
        const setupRes2 = await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: getFutureDate(11),
                slot_id: 4,
                purpose: "PO Evaluation Group 2",
            });
        pendingBookingId2 = setupRes2.body.id;
    });

    it("TC-PO-001: PO successfully views the pending bookings list", async () => {
        const res = await request(BASE_URL)
            .get("/api/bookings?status=pending")
            .set("Authorization", `Bearer ${poToken}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);

        // Confirm the list contains the pending bookings created during setup
        const ids = res.body.map((b: any) => b.id);
        expect(ids).toContain(pendingBookingId1);
        expect(ids).toContain(pendingBookingId2);
    });

    it("should prevent students from approving booking requests", async () => {
        await request(BASE_URL)
            .patch(`/api/bookings/${pendingBookingId1}/approve`)
            .set("Authorization", `Bearer ${studentToken}`)
            .expect(403);
    });

    it("TC-PO-002: PO successfully approves a pending request", async () => {
        const res = await request(BASE_URL)
            .patch(`/api/bookings/${pendingBookingId1}/approve`)
            .set("Authorization", `Bearer ${poToken}`)
            .expect(200);

        expect(res.body.status).toBe("approved");
    });

    it("TC-PO-003: PO successfully rejects a pending request", async () => {
        const res = await request(BASE_URL)
            .patch(`/api/bookings/${pendingBookingId2}/reject`)
            .set("Authorization", `Bearer ${poToken}`)
            .expect(200);

        expect(res.body.status).toBe("rejected");
    });

    it("TC-PO-004: Conflict Resolution architectural constraints evaluation", async () => {
        const duplicateDate = getFutureDate(12);

        // 1. Submit first booking for Room A, Slot 5 (Expected to succeed)
        await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: duplicateDate,
                slot_id: 5,
                purpose: "Concurrent Slot Booking A",
            })
            .expect(201);

        // 2. Submit second booking for the same slot (Expected to fail)
        // Design Observation Note: Since the DB schema enforces a UNIQUE(room_id, date, slot_id)
        // constraint on active and pending slots combined, the database structurally blocks any
        // concurrent pending requests before they can reach the Program Office approval review stage.
        await request(BASE_URL)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                room_id: roomAId,
                date: duplicateDate,
                slot_id: 5,
                purpose: "Concurrent Slot Booking B",
            })
            .expect(409);
    });
});
