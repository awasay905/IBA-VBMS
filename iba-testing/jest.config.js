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
    // Tells Jest to look inside the backend's node_modules first for ALL packages
    moduleDirectories: ["<rootDir>/../iba-backend/node_modules", "node_modules"],
    moduleNameMapper: {
        // Only map your custom backend source code alias here
        "^@backend/(.*)$": "<rootDir>/../iba-backend/src/$1",
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
            testTimeout: 15000
        },
    ],
    collectCoverage: false,
    verbose: true,
};
