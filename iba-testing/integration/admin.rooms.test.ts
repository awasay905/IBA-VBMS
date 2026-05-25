import request from "supertest";
import { resetDatabase } from "./helpers/seed.helper";
import { BASE_URL } from "./helpers/env.helper";
import { getAdminToken } from "./helpers/auth.helper";

describe("Admin Facility and Slot Management Feature", () => {
    let adminToken: string;
    let sharedBuildingId: string;
    let sharedRoomId: string;

    beforeAll(async () => {
        await resetDatabase();
        adminToken = await getAdminToken();
    });

    it("TC-ADMIN-004: admin successfully adds a new building", async () => {
        const buildingDto = {
            name: "New Testing Building",
            location: "Main Campus East",
        };

        const res = await request(BASE_URL)
            .post("/api/buildings")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(buildingDto)
            .expect(201);

        expect(res.body).toHaveProperty("id");
        expect(res.body.name).toBe(buildingDto.name);

        // Save the created building ID for use in the next tests
        sharedBuildingId = res.body.id;
    });

    it("TC-ADMIN-005: admin successfully adds a new room to the created building", async () => {
        const roomDto = {
            building_id: sharedBuildingId,
            name: "Seminar Hall 303",
            capacity: 30,
            type: "Classroom",
        };

        const res = await request(BASE_URL)
            .post("/api/rooms")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(roomDto)
            .expect(201);

        expect(res.body).toHaveProperty("id");
        expect(res.body.name).toBe(roomDto.name);
        expect(res.body.capacity).toBe(roomDto.capacity);
        expect(res.body.building_id).toBe(sharedBuildingId);

        // Save the created room ID for the slot blocking lifecycle tests
        sharedRoomId = res.body.id;
    });

    it("TC-ADMIN-006 & TC-ADMIN-007: admin slot blocking and unblocking lifecycle", async () => {
        const blockDto = {
            room_id: sharedRoomId,
            date: "2026-06-15",
            slot_ids: [1, 2],
            reason: "Urgent HVAC System Maintenance",
        };

        // 1. TC-ADMIN-006: Block the slots
        const blockRes = await request(BASE_URL)
            .post("/api/blocked-slots")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(blockDto)
            .expect(201);

        // Grab the first generated blocked slot instance ID from the array
        expect(Array.isArray(blockRes.body)).toBe(true);
        expect(blockRes.body.length).toBeGreaterThan(0);
        const blockedSlotId = blockRes.body[0].id;

        // 2. TC-ADMIN-007: Unblock the slot using the retrieved ID
        const deleteRes = await request(BASE_URL)
            .delete(`/api/blocked-slots/${blockedSlotId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .expect(200);

        expect(deleteRes.body).toHaveProperty("message", "Slot unblocked");
    });

    it("should reject room creation when capacity is not a positive integer", async () => {
        const invalidCapacityRoom = {
            building_id: sharedBuildingId,
            name: "Invalid Capacity Room",
            capacity: 0,
            type: "Classroom",
        };

        await request(BASE_URL)
            .post("/api/rooms")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(invalidCapacityRoom)
            .expect(400);
    });

    it("should reject room creation with an invalid room type", async () => {
        const invalidTypeRoom = {
            building_id: sharedBuildingId,
            name: "Invalid Type Room",
            capacity: 40,
            type: "InvalidType", // Permitted: 'Classroom', 'Seminar Hall', 'Computer Lab', 'Meeting Room'
        };

        await request(BASE_URL)
            .post("/api/rooms")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(invalidTypeRoom)
            .expect(400);
    });
});
