import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  globalSetup: "./jest.setup.ts",
  cache: false, // disabled caching to prevent old Tact files from being used after a rebuild
  testEnvironment: "@ton/sandbox/jest-environment",
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/tact-dex/"],
  testMatch: ["**/tests/**/*.spec.ts"],
  reporters: ["default", ["@ton/sandbox/jest-reporter", {}]],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    "contracts/**/*.tact",
    "!contracts/**/*.backup",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/build/**",
  ],
};

export default config;
