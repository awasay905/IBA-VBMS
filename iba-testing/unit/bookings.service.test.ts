import { Test, TestingModule } from "@nestjs/testing";
import { BookingsService, CreateBookingDto } from "@backend/bookings/bookings.service";
import { SupabaseService } from "@backend/supabase/supabase.service";
import { ConflictException, ForbiddenException, BadRequestException, NotFoundException } from "@nestjs/common";
import { createMockQueryBuilder, createMockSupabaseService } from "./mocks/supabase.mock";

describe("BookingsService", () => {
    let service: BookingsService;
    let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
    let mockSupabaseService: any;

    beforeEach(async () => {
        mockQueryBuilder = createMockQueryBuilder();
        mockSupabaseService = createMockSupabaseService(mockQueryBuilder);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BookingsService,
                {
                    provide: SupabaseService,
                    useValue: mockSupabaseService,
                },
            ],
        }).compile();

        service = module.get<BookingsService>(BookingsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("create()", () => {
        let blockedBuilder: ReturnType<typeof createMockQueryBuilder>;
        let bookingsBuilder: ReturnType<typeof createMockQueryBuilder>;

        beforeEach(() => {
            blockedBuilder = createMockQueryBuilder();
            bookingsBuilder = createMockQueryBuilder();

            // Intercept different table calls with distinct query builders
            mockSupabaseService.db.from.mockImplementation((tableName: string) => {
                if (tableName === "blocked_slots") return blockedBuilder;
                if (tableName === "bookings") return bookingsBuilder;
                return mockQueryBuilder;
            });
        });

        // Test Case 4: Successful Booking Creation (TC-BOOK-001)
        it("should successfully create a pending booking if no conflicts exist (TC-BOOK-001)", async () => {
            const userId = "student-123";
            const dto: CreateBookingDto = {
                room_id: "room-abc",
                date: "2026-06-01",
                slot_id: 3,
                purpose: "Group Study Session",
            };

            const mockCreatedBooking = {
                id: "booking-uuid",
                user_id: userId,
                room_id: dto.room_id,
                date: dto.date,
                slot_id: dto.slot_id,
                purpose: dto.purpose,
                status: "pending",
            };

            // 1st check: blocked slot (returns null - not blocked)
            blockedBuilder.single.mockResolvedValueOnce({ data: null, error: null });
            // 2nd check: conflicting booking (returns null - no active booking conflicts)
            bookingsBuilder.single.mockResolvedValueOnce({ data: null, error: null });
            // 3rd statement: insert result (returns newly created booking object)
            bookingsBuilder.single.mockResolvedValueOnce({ data: mockCreatedBooking, error: null });

            const result = await service.create(userId, dto);

            // Verify validations and insertions were called with correct properties
            expect(blockedBuilder.eq).toHaveBeenNthCalledWith(1, "room_id", dto.room_id);
            expect(blockedBuilder.eq).toHaveBeenNthCalledWith(2, "date", dto.date);
            expect(blockedBuilder.eq).toHaveBeenNthCalledWith(3, "slot_id", dto.slot_id);

            expect(bookingsBuilder.insert).toHaveBeenCalledWith({
                user_id: userId,
                room_id: dto.room_id,
                date: dto.date,
                slot_id: dto.slot_id,
                purpose: dto.purpose,
                status: "pending",
            });

            expect(result).toEqual(mockCreatedBooking);
        });

        // Test Case 5: Slot Blocked by Admin (TC-BOOK-003)
        it("should reject creation and throw ConflictException if the slot is blocked by admin (TC-BOOK-003)", async () => {
            const dto: CreateBookingDto = {
                room_id: "room-abc",
                date: "2026-06-01",
                slot_id: 3,
                purpose: "Exam Prep",
            };

            // 1st check: blocked slot query returns a record (blocked)
            blockedBuilder.single.mockResolvedValueOnce({ data: { id: "block-id" }, error: null });

            await expect(service.create("student-123", dto)).rejects.toThrow(ConflictException);

            // Confirm booking lookup and insert processes are immediately bypassed
            expect(bookingsBuilder.single).not.toHaveBeenCalled();
            expect(bookingsBuilder.insert).not.toHaveBeenCalled();
        });

        // Test Case 6: Slot Already Booked (TC-BOOK-002)
        it("should reject creation and throw ConflictException if slot has a pending or approved booking (TC-BOOK-002)", async () => {
            const dto: CreateBookingDto = {
                room_id: "room-abc",
                date: "2026-06-01",
                slot_id: 3,
                purpose: "Tutorial session",
            };

            // 1st check: slot is not blocked
            blockedBuilder.single.mockResolvedValueOnce({ data: null, error: null });
            // 2nd check: slot has an active conflict (returns existing booking ID)
            bookingsBuilder.single.mockResolvedValueOnce({ data: { id: "existing-booking-id" }, error: null });

            await expect(service.create("student-123", dto)).rejects.toThrow(ConflictException);

            // Confirm flow halted before insert
            expect(bookingsBuilder.insert).not.toHaveBeenCalled();
        });
    });

    describe("cancel() and updateStatus() validations", () => {
        // Test Case 7: Unauthorised Student Cancellation (TC-CANCEL-001 safety guard)
        it("should block a student from cancelling another user's booking (TC-CANCEL-001 safety guard)", async () => {
            const requesterId = "student-b";
            const requesterRole = "student";
            const targetBookingId = "booking-123";

            const mockDbBooking = {
                id: targetBookingId,
                status: "pending",
                users: { id: "student-a" }, // Owned by student-a
            };

            // Mock findOne query lookup
            mockQueryBuilder.single.mockResolvedValueOnce({ data: mockDbBooking, error: null });

            await expect(service.cancel(targetBookingId, requesterId, requesterRole)).rejects.toThrow(
                ForbiddenException,
            );

            expect(mockQueryBuilder.update).not.toHaveBeenCalled();
        });

        // Test Case 8: Invalid Booking Status for Cancellation (TC-CANCEL-004 safety guard)
        it("should reject cancellation of bookings that are already rejected or cancelled (TC-CANCEL-004 safety guard)", async () => {
            const requesterId = "student-a";
            const requesterRole = "student";
            const targetBookingId = "booking-123";

            const mockDbBooking = {
                id: targetBookingId,
                status: "rejected", // Invalid state for cancellation
                users: { id: requesterId },
            };

            mockQueryBuilder.single.mockResolvedValueOnce({ data: mockDbBooking, error: null });

            await expect(service.cancel(targetBookingId, requesterId, requesterRole)).rejects.toThrow(
                BadRequestException,
            );

            expect(mockQueryBuilder.update).not.toHaveBeenCalled();
        });

        // Test Case 9: Successful Booking Cancellation (TC-CANCEL-001 / TC-CANCEL-002 / TC-CANCEL-005)
        it("should successfully cancel a booking and update status to 'rejected' (TC-CANCEL-001 / TC-CANCEL-002 / TC-CANCEL-005)", async () => {
            const requesterId = "student-a";
            const requesterRole = "student";
            const targetBookingId = "booking-123";

            const mockDbBooking = {
                id: targetBookingId,
                status: "approved",
                users: { id: requesterId }, // Authorized owner
            };

            const mockCancelledBooking = {
                ...mockDbBooking,
                status: "rejected", // Acts as cancelled
                reviewed_by: requesterId,
            };

            // 1st call to single() - findOne inside cancel()
            mockQueryBuilder.single.mockResolvedValueOnce({ data: mockDbBooking, error: null });
            // 2nd call to single() - updateStatus inside cancel()
            mockQueryBuilder.single.mockResolvedValueOnce({ data: mockCancelledBooking, error: null });

            const result = await service.cancel(targetBookingId, requesterId, requesterRole);

            expect(mockQueryBuilder.update).toHaveBeenCalledWith({
                status: "rejected",
                reviewed_by: requesterId,
            });
            expect(mockQueryBuilder.eq).toHaveBeenLastCalledWith("id", targetBookingId);
            expect(result).toEqual(mockCancelledBooking);
        });
    });

    describe("findAll() and findOne()", () => {
        it("should find bookings with specific filters", async () => {
            const filters = { status: "pending", userId: "student-123" };
            const mockBookings = [{ id: "booking-1", status: "pending", user_id: "student-123" }];

            mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: mockBookings, error: null }));

            const result = await service.findAll(filters);

            expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(1, "status", "pending");
            expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(2, "user_id", "student-123");
            expect(result).toEqual(mockBookings);
        });

        it("should throw NotFoundException if findOne query is missing or empty", async () => {
            mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

            await expect(service.findOne("non-existent-id")).rejects.toThrow(NotFoundException);
        });
    });
});
