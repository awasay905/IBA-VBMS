import { Test, TestingModule } from "@nestjs/testing";
import { BlockedSlotsService, CreateBlockedSlotDto } from "@backend/blocked-slots/blocked-slots.service";
import { SupabaseService } from "@backend/supabase/supabase.service";
import { createMockQueryBuilder, createMockSupabaseService } from "./mocks/supabase.mock";

describe("BlockedSlotsService", () => {
    let service: BlockedSlotsService;
    let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
    let mockSupabaseService: any;

    beforeEach(async () => {
        mockQueryBuilder = createMockQueryBuilder();
        mockSupabaseService = createMockSupabaseService(mockQueryBuilder);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BlockedSlotsService,
                {
                    provide: SupabaseService,
                    useValue: mockSupabaseService,
                },
            ],
        }).compile();

        service = module.get<BlockedSlotsService>(BlockedSlotsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test Case 1: Bulk Slot Blocking with explicit reason (TC-ADMIN-006)
    it("should bulk-block slots with an explicit reason (TC-ADMIN-006)", async () => {
        const adminId = "admin-uuid-123";
        const dto: CreateBlockedSlotDto = {
            room_id: "room-uuid-abc",
            date: "2026-06-01",
            slot_ids: [1, 2, 3],
            reason: "AC Maintenance",
        };

        const expectedRows = [
            { room_id: "room-uuid-abc", date: "2026-06-01", slot_id: 1, reason: "AC Maintenance", blocked_by: adminId },
            { room_id: "room-uuid-abc", date: "2026-06-01", slot_id: 2, reason: "AC Maintenance", blocked_by: adminId },
            { room_id: "room-uuid-abc", date: "2026-06-01", slot_id: 3, reason: "AC Maintenance", blocked_by: adminId },
        ];

        const mockResponseData = expectedRows.map((row, index) => ({
            id: `blocked-uuid-${index}`,
            ...row,
            created_at: new Date().toISOString(),
        }));

        // Mock the resolved return value of the entire builder chain
        mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: mockResponseData, error: null }));

        const result = await service.create(adminId, dto);

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("blocked_slots");
        expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(expectedRows, {
            onConflict: "room_id,date,slot_id",
        });
        expect(result).toEqual(mockResponseData);
    });

    // Test Case 2: Bulk Slot Blocking with default reason (when reason is omitted) TC-ADMIN-006 (Edge Case / Default Handling)
    it("should default to 'Admin Block' when no reason is specified TC-ADMIN-006 (Edge Case / Default Handling)", async () => {
        const adminId = "admin-uuid-123";
        const dto: CreateBlockedSlotDto = {
            room_id: "room-uuid-abc",
            date: "2026-06-01",
            slot_ids: [5],
        };

        const expectedRows = [
            { room_id: "room-uuid-abc", date: "2026-06-01", slot_id: 5, reason: "Admin Block", blocked_by: adminId },
        ];

        mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: expectedRows, error: null }));

        await service.create(adminId, dto);

        expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(expectedRows, {
            onConflict: "room_id,date,slot_id",
        });
    });

    // Test Case 3: Find all blocked slots (with optional filters applied) TC-ADMIN-006 and TC-BOOK-003
    it("should find all blocked slots with room and date filters applied TC-ADMIN-006 and TC-BOOK-003", async () => {
        const roomId = "room-123";
        const date = "2026-06-01";
        const mockReturnedSlots = [{ id: "blocked-1", room_id: roomId, date, slot_id: 1 }];

        mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: mockReturnedSlots, error: null }));

        const result = await service.findAll(roomId, date);

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("blocked_slots");
        expect(mockQueryBuilder.order).toHaveBeenCalledWith("date");
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith("room_id", roomId);
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith("date", date);
        expect(result).toEqual(mockReturnedSlots);
    });

    // Test Case 4: Unblock a slot (Remove block) TC-ADMIN-007
    it("should delete a blocked slot entry by its ID TC-ADMIN-007", async () => {
        const targetId = "block-id-to-remove";

        mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: null, error: null }));

        const result = await service.remove(targetId);

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("blocked_slots");
        expect(mockQueryBuilder.delete).toHaveBeenCalled();
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", targetId);
        expect(result).toEqual({ message: "Slot unblocked" });
    });

    // Test Case 5: Idempotency — duplicate slot in slot_ids (TC-ADMIN-006)
    it("should call upsert without throwing when a slot_id is already blocked (TC-ADMIN-006 idempotency)", async () => {
        const adminId = "admin-uuid-123";
        const dto: CreateBlockedSlotDto = {
            room_id: "room-uuid-abc",
            date: "2026-06-01",
            slot_ids: [2], // slot 2 is already blocked in the DB
            reason: "AC Maintenance",
        };

        const expectedRows = [
            { room_id: "room-uuid-abc", date: "2026-06-01", slot_id: 2, reason: "AC Maintenance", blocked_by: adminId },
        ];

        // Simulate DB silently skipping the duplicate and returning the existing row
        const mockResponseData = [{ id: "blocked-uuid-existing", ...expectedRows[0], created_at: new Date().toISOString() }];
        mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: mockResponseData, error: null }));

        // Should resolve without throwing despite the conflict
        await expect(service.create(adminId, dto)).resolves.toEqual(mockResponseData);

        expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(expectedRows, {
            onConflict: "room_id,date,slot_id",
        });
    });

    // Test Case 6: Error handling scenario
    it("should throw database error when query execution fails", async () => {
        const mockError = new Error("Database query failed");

        mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: null, error: mockError }));

        await expect(service.findAll()).rejects.toThrow(mockError);
    });
});
