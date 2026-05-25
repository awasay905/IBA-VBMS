// Define the common TypeScript configuration that both projects must share
const commonConfig = {
    testEnvironment: "node",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "./tsconfig.json",
            },
        ],
    },
    moduleNameMapper: {
        "^@backend/(.*)$": "<rootDir>/../iba-backend/src/$1",
        // Direct Jest to use the backend's node_modules to ensure all @nestjs modules exist and are singletons
        "^@nestjs/(.*)$": "<rootDir>/../iba-backend/node_modules/@nestjs/$1",
    },
};

module.exports = {
    rootDir: ".",
    projects: [
        {
            ...commonConfig,
            displayName: "unit",
            testMatch: ["<rootDir>/unit/**/*.test.ts"],
        },
        {
            ...commonConfig,
            displayName: "integration",
            testMatch: ["<rootDir>/integration/**/*.test.ts"],
        },
    ],
    collectCoverage: false,
    verbose: true,
};
