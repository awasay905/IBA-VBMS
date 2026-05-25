import type { Config } from "jest";

const config: Config = {
    rootDir: ".",
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
    projects: [
        {
            displayName: "unit",
            testMatch: ["<rootDir>/unit/**/*.test.ts"],
        },
        {
            displayName: "integration",
            testMatch: ["<rootDir>/integration/**/*.test.ts"],
        },
    ],
    collectCoverage: false,
    verbose: true,
};

export default config;
