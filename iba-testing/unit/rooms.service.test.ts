import { Test, TestingModule } from "@nestjs/testing";
import { RoomsService, CreateRoomDto } from "@backend/rooms/rooms.service";
import { SupabaseService } from "@backend/supabase/supabase.service";
import { NotFoundException } from "@nestjs/common";
import { createMockQueryBuilder, createMockSupabaseService } from "./mocks/supabase.mock";

describe("RoomsService", () => {
    let service: RoomsService;
    let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
    let mockSupabaseService: any;

    beforeEach(async () => {
        mockQueryBuilder = createMockQueryBuilder();
        mockSupabaseService = createMockSupabaseService(mockQueryBuilder);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomsService,
                {
                    provide: SupabaseService,
                    useValue: mockSupabaseService,
                },
            ],
        }).compile();

        service = module.get<RoomsService>(RoomsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test Case 1: getAvailability (TC-BOOK-002 / TC-BOOK-003 supporting logic)
    it("should fetch availability datasets (TC-BOOK-002 / TC-BOOK-003 supporting logic)", async () => {
        const bookingsBuilder = createMockQueryBuilder();
        const blockedBuilder = createMockQueryBuilder();

        // Dynamically assign different builders for parallel queries
        mockSupabaseService.db.from.mockImplementation((tableName: string) => {
            if (tableName === "bookings") return bookingsBuilder;
            if (tableName === "blocked_slots") return blockedBuilder;
            return mockQueryBuilder;
        });

        const mockBookings = [
            { slot_id: 1, status: "approved" },
            { slot_id: 2, status: "pending" },
        ];
        const mockBlocked = [{ slot_id: 5, reason: "AC Repair" }];

        // Stub the promise resolution for both builders
        bookingsBuilder.then.mockImplementation((resolve) => resolve({ data: mockBookings, error: null }));
        blockedBuilder.then.mockImplementation((resolve) => resolve({ data: mockBlocked, error: null }));

        const roomId = "room-uuid-xyz";
        const targetDate = "2026-06-01";

        const result = await service.getAvailability(roomId, targetDate);

        // Assert query configurations
        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("bookings");
        expect(bookingsBuilder.eq).toHaveBeenCalledWith("room_id", roomId);
        expect(bookingsBuilder.eq).toHaveBeenCalledWith("date", targetDate);
        expect(bookingsBuilder.in).toHaveBeenCalledWith("status", ["pending", "approved"]);

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("blocked_slots");
        expect(blockedBuilder.eq).toHaveBeenCalledWith("room_id", roomId);
        expect(blockedBuilder.eq).toHaveBeenCalledWith("date", targetDate);

        // Assert returned aggregate object
        expect(result).toEqual({
            bookedSlots: mockBookings,
            blockedSlots: mockBlocked,
        });
    });

    // Test Case 2: findAll (with optional building ID filter)
    it("should retrieve rooms filtered by building ID when provided", async () => {
        const mockRooms = [{ id: "room-1", name: "Seminar Room" }];
        mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: mockRooms, error: null }));

        const result = await service.findAll("building-uuid-123");

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("rooms");
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith("building_id", "building-uuid-123");
        expect(result).toEqual(mockRooms);
    });

    // Test Case 3: findOne - Success Path
    it("should retrieve a single room by ID", async () => {
        const mockRoom = { id: "room-1", name: "Seminar Room" };
        mockQueryBuilder.single.mockResolvedValue({ data: mockRoom, error: null });

        const result = await service.findOne("room-1");

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("rooms");
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "room-1");
        expect(result).toEqual(mockRoom);
    });

    // Test Case 4: findOne - Non-existent Room Error
    it("should throw a NotFoundException if the room does not exist", async () => {
        mockQueryBuilder.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

        await expect(service.findOne("non-existent")).rejects.toThrow(NotFoundException);
    });

    // Test Case 5: create (TC-ADMIN-005)
    it("should successfully create a new room entry (TC-ADMIN-005)", async () => {
        const dto: CreateRoomDto = {
            building_id: "building-uuid",
            name: "CS Lab 3",
            capacity: 45,
            type: "Computer Lab",
        };

        const mockCreatedResult = { id: "new-room-id", ...dto };
        mockQueryBuilder.single.mockResolvedValue({ data: mockCreatedResult, error: null });

        const result = await service.create(dto);

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("rooms");
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
            building_id: dto.building_id,
            name: dto.name,
            capacity: dto.capacity,
            type: dto.type,
        });
        expect(result).toEqual(mockCreatedResult);
    });

    // Test Case 6: remove
    it("should successfully delete a room entry", async () => {
        mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: null, error: null }));

        const result = await service.remove("room-uuid-to-delete");

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("rooms");
        expect(mockQueryBuilder.delete).toHaveBeenCalled();
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "room-uuid-to-delete");
        expect(result).toEqual({ message: "Room deleted" });
    });
});
