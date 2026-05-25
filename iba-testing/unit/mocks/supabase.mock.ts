// 1. Create a builder that includes all the common chained methods Supabase uses
export const createMockQueryBuilder = () => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
});

// 2. Create the mock Supabase service that returns your builder
export const createMockSupabaseService = (queryBuilderMock: any) => ({
    db: {
        from: jest.fn().mockReturnValue(queryBuilderMock),
    },
});
