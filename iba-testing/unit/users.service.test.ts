import { Test, TestingModule } from "@nestjs/testing";
import { UsersService, CreateUserDto } from "@backend/users/users.service";
import { AuthService } from "@backend/auth/auth.service";
import { SupabaseService } from "@backend/supabase/supabase.service";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { createMockQueryBuilder, createMockSupabaseService } from "./mocks/supabase.mock";

describe("UsersService", () => {
    let service: UsersService;
    let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
    let mockSupabaseService: any;
    let mockAuthService: any;

    beforeEach(async () => {
        mockQueryBuilder = createMockQueryBuilder();
        mockSupabaseService = createMockSupabaseService(mockQueryBuilder);

        mockAuthService = {
            hashPassword: jest.fn().mockResolvedValue("mocked-hashed-password"),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: SupabaseService,
                    useValue: mockSupabaseService,
                },
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test Case 1: Successful Student Account Creation (TC-ADMIN-001)
    it("should allow an admin to successfully create a new student account (TC-ADMIN-001)", async () => {
        const dto: CreateUserDto = {
            erp: "27079",
            name: "Saad Imam",
            email: "saad@test.com",
            password: "plain-password",
            role: "student",
        };

        const mockReturnedUser = {
            id: "student-uuid",
            erp: dto.erp,
            name: dto.name,
            email: dto.email,
            role: dto.role,
            created_at: new Date().toISOString(),
        };

        // 1st call to single(): Uniqueness check (returns null - user does not exist yet)
        mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null });

        // 2nd call to single(): Post-insert return (returns the freshly created student record)
        mockQueryBuilder.single.mockResolvedValueOnce({ data: mockReturnedUser, error: null });

        const result = await service.create(dto);

        // Verify uniqueness query parameters
        expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(1, "erp", dto.erp);

        // Verify hashing was executed
        expect(mockAuthService.hashPassword).toHaveBeenCalledWith("plain-password");

        // Verify the inserted dataset uses the hashed password, and that the return payload omits passwords
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
            erp: dto.erp,
            name: dto.name,
            email: dto.email,
            password: "mocked-hashed-password",
            role: dto.role,
        });

        expect(result).toEqual(mockReturnedUser);
    });

    // Test Case 2: Successful Program Office Account Creation (TC-ADMIN-003)
    it("should allow an admin to successfully create a new program office account (TC-ADMIN-003)", async () => {
        const dto: CreateUserDto = {
            erp: "po-member-1",
            name: "PO Coordinator",
            email: "po@test.com",
            password: "po-secure-password",
            role: "programoffice",
        };

        const mockReturnedUser = {
            id: "po-uuid",
            erp: dto.erp,
            name: dto.name,
            email: dto.email,
            role: dto.role,
            created_at: new Date().toISOString(),
        };

        mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null }); // Unique check
        mockQueryBuilder.single.mockResolvedValueOnce({ data: mockReturnedUser, error: null }); // Insert confirmation

        const result = await service.create(dto);

        expect(mockAuthService.hashPassword).toHaveBeenCalledWith("po-secure-password");
        expect(result).toEqual(mockReturnedUser);
    });

    // Test Case 3: Duplicate User / ERP Prevention (TC-ADMIN-002)
    it("should reject creation and throw a ConflictException if the ERP already exists (TC-ADMIN-002)", async () => {
        const dto: CreateUserDto = {
            erp: "27079", // Duplicate ERP
            name: "Duplicate User Attempt",
            email: "other@test.com",
            password: "any-password",
            role: "student",
        };

        // Mock uniqueness lookup returning a record (conflict exists)
        mockQueryBuilder.single.mockResolvedValueOnce({ data: { id: "existing-uuid" }, error: null });

        await expect(service.create(dto)).rejects.toThrow(ConflictException);

        // Confirm process halted before password was hashed or user inserted
        expect(mockAuthService.hashPassword).not.toHaveBeenCalled();
        expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
    });

    // Test Case 4: findAll (Query Verification)
    it("should retrieve all user records ordered by creation date", async () => {
        const mockUsers = [
            { id: "u-1", erp: "1001", name: "User A", email: "a@test.com", role: "admin" },
            { id: "u-2", erp: "1002", name: "User B", email: "b@test.com", role: "student" },
        ];

        mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: mockUsers, error: null }));

        const result = await service.findAll();

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("users");
        expect(mockQueryBuilder.order).toHaveBeenCalledWith("created_at", { ascending: true });
        expect(result).toEqual(mockUsers);
    });

    // Test Case 5: findOne - Success Path
    it("should find a user by ID", async () => {
        const mockUser = { id: "u-1", erp: "1001", name: "User A", email: "a@test.com", role: "admin" };
        mockQueryBuilder.single.mockResolvedValueOnce({ data: mockUser, error: null });

        const result = await service.findOne("u-1");

        expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "u-1");
        expect(result).toEqual(mockUser);
    });

    // Test Case 6: findOne - Error handling
    it("should throw a NotFoundException if user id does not exist", async () => {
        mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

        await expect(service.findOne("non-existent-id")).rejects.toThrow(NotFoundException);
    });

    // Test Case 7: remove
    it("should delete a user record by ID", async () => {
        mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: null, error: null }));

        const result = await service.remove("user-uuid-to-delete");

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("users");
        expect(mockQueryBuilder.delete).toHaveBeenCalled();
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "user-uuid-to-delete");
        expect(result).toEqual({ message: "User deleted" });
    });
});
