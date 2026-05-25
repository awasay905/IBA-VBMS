import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "@backend/auth/auth.service";
import { SupabaseService } from "@backend/supabase/supabase.service";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import { createMockQueryBuilder, createMockSupabaseService } from "./mocks/supabase.mock";
import * as bcrypt from "bcryptjs";

jest.mock("bcryptjs", () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

describe("AuthService", () => {
    let authService: AuthService;

    let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
    let mockSupabaseService: any;
    let mockJwtService: any;

    beforeEach(async () => {
        mockQueryBuilder = createMockQueryBuilder();
        mockSupabaseService = createMockSupabaseService(mockQueryBuilder);

        mockJwtService = {
            sign: jest.fn().mockReturnValue("mock-jwt-token"),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: SupabaseService,
                    useValue: mockSupabaseService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test Case: Database does not find the ERP/username (TC-AUTH-003 partial)
    it("should throw UnauthorizedException if user does not exist (TC-AUTH-003 partial)", async () => {
        // Force Supabase single() to return no data (simulating user not found)
        mockQueryBuilder.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

        await expect(authService.login("non-existent-user", "any-password")).rejects.toThrow(UnauthorizedException);
    });

    // Test Case: User found, but password verification fails (TC-AUTH-003 partial)
    it("should throw UnauthorizedException if password does not match (TC-AUTH-003)", async () => {
        const mockDbUser = {
            id: "mock-uuid",
            erp: "test-student",
            password: "hashed-password-in-db",
            role: "student",
        };
        mockQueryBuilder.single.mockResolvedValue({ data: mockDbUser, error: null });

        // Force bcrypt.compare to return false (simulating password mismatch)
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(authService.login("test-student", "incorrect-password")).rejects.toThrow(UnauthorizedException);
    });

    // Test Case: Successful Student Login (TC-AUTH-001)
    it("should return an access token and student profile on valid student credentials (TC-AUTH-001)", async () => {
        const mockDbUser = {
            id: "student-uuid",
            erp: "27000",
            name: "Test Student",
            email: "student@test.com",
            password: "hashed-password-in-db",
            role: "student",
        };
        mockQueryBuilder.single.mockResolvedValue({ data: mockDbUser, error: null });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const result = await authService.login("27000", "correct-password");

        expect(result.access_token).toBe("mock-jwt-token");
        expect(result.user).toEqual({
            id: "student-uuid",
            erp: "27000",
            name: "Test Student",
            email: "student@test.com",
            role: "student",
        });

        // Ensure the payload passed to JWT includes student role properties
        expect(mockJwtService.sign).toHaveBeenCalledWith({
            sub: "student-uuid",
            erp: "27000",
            role: "student",
        });
    });

    // Test Case: Successful Program Office Login (TC-AUTH-002)
    it("should return an access token and PO profile on valid PO credentials (TC-AUTH-002)", async () => {
        const mockDbUser = {
            id: "po-uuid",
            erp: "po-staff-1",
            name: "PO Manager",
            email: "po@test.com",
            password: "hashed-password-in-db",
            role: "programoffice",
        };
        mockQueryBuilder.single.mockResolvedValue({ data: mockDbUser, error: null });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const result = await authService.login("po-staff-1", "correct-password");

        expect(result.access_token).toBe("mock-jwt-token");
        expect(result.user).toEqual({
            id: "po-uuid",
            erp: "po-staff-1",
            name: "PO Manager",
            email: "po@test.com",
            role: "programoffice",
        });

        expect(mockJwtService.sign).toHaveBeenCalledWith({
            sub: "po-uuid",
            erp: "po-staff-1",
            role: "programoffice",
        });
    });

    // Test Case: Hash password function
    it("should correctly call bcrypt to hash a plain text password", async () => {
        const plainPassword = "my-secure-password";
        const expectedHash = "encrypted-string-value";
        (bcrypt.hash as jest.Mock).mockResolvedValue(expectedHash);

        const result = await authService.hashPassword(plainPassword);

        expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
        expect(result).toBe(expectedHash);
    });
});
