import { Test, TestingModule } from "@nestjs/testing";
import { BuildingsService, CreateBuildingDto } from "@backend/buildings/buildings.service";
import { SupabaseService } from "@backend/supabase/supabase.service";
import { NotFoundException } from "@nestjs/common";
import { createMockQueryBuilder, createMockSupabaseService } from "./mocks/supabase.mock";

describe("BuildingsService", () => {
    let service: BuildingsService;
    let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
    let mockSupabaseService: any;

    beforeEach(async () => {
        mockQueryBuilder = createMockQueryBuilder();
        mockSupabaseService = createMockSupabaseService(mockQueryBuilder);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BuildingsService,
                {
                    provide: SupabaseService,
                    useValue: mockSupabaseService,
                },
            ],
        }).compile();

        service = module.get<BuildingsService>(BuildingsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test Case: Successful Building Creation (TC-ADMIN-004)
    it("should allow an admin to successfully create a new building with location (TC-ADMIN-004)", async () => {
        const dto: CreateBuildingDto = {
            name: "Aman Tower",
            location: "Main Campus",
        };

        const mockCreatedBuilding = {
            id: "building-uuid-1",
            name: dto.name,
            location: dto.location,
        };

        mockQueryBuilder.single.mockResolvedValueOnce({ data: mockCreatedBuilding, error: null });

        const result = await service.create(dto);

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("buildings");
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
            name: dto.name,
            location: dto.location,
        });
        expect(result).toEqual(mockCreatedBuilding);
    });

    // Test Case: Building Creation with Default Location fallback
    it("should default location to an empty string when location is omitted in DTO", async () => {
        const dto: CreateBuildingDto = {
            name: "Tabba Academic Block",
        };

        const mockCreatedBuilding = {
            id: "building-uuid-2",
            name: dto.name,
            location: "",
        };

        mockQueryBuilder.single.mockResolvedValueOnce({ data: mockCreatedBuilding, error: null });

        await service.create(dto);

        expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
            name: dto.name,
            location: "",
        });
    });

    // Test Case: findAll (Query Validation)
    it("should retrieve all buildings along with their room collections sorted by name", async () => {
        const mockBuildings = [
            { id: "b-1", name: "Aman Tower", rooms: [{ id: "r-1", name: "Aman 101" }] },
            { id: "b-2", name: "Tabba Academic Block", rooms: [] },
        ];

        mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: mockBuildings, error: null }));

        const result = await service.findAll();

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("buildings");
        expect(mockQueryBuilder.select).toHaveBeenCalledWith("*, rooms(id, name, capacity, type)");
        expect(mockQueryBuilder.order).toHaveBeenCalledWith("name");
        expect(result).toEqual(mockBuildings);
    });

    // Test Case: findOne - Success Path
    it("should retrieve a single building by ID along with its rooms", async () => {
        const mockBuilding = { id: "b-1", name: "Aman Tower", rooms: [] };
        mockQueryBuilder.single.mockResolvedValueOnce({ data: mockBuilding, error: null });

        const result = await service.findOne("b-1");

        expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "b-1");
        expect(result).toEqual(mockBuilding);
    });

    // Test Case: findOne - Error handling
    it("should throw a NotFoundException if building is not found", async () => {
        mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

        await expect(service.findOne("non-existent-id")).rejects.toThrow(NotFoundException);
    });

    // Test Case: remove (Cascading confirmation)
    it("should delete a building record which triggers cascading deletions on related rooms", async () => {
        mockQueryBuilder.then.mockImplementation((resolve) => resolve({ data: null, error: null }));

        const result = await service.remove("building-uuid-to-delete");

        expect(mockSupabaseService.db.from).toHaveBeenCalledWith("buildings");
        expect(mockQueryBuilder.delete).toHaveBeenCalled();
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "building-uuid-to-delete");
        expect(result).toEqual({ message: "Building and all its rooms deleted" });
    });
});
