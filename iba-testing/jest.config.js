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
