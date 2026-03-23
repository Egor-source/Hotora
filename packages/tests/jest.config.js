const { resolve } = require("path");

const config = {
  preset: "ts-jest/presets/default",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "./tsconfig.json" }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@hotora/core$": resolve(__dirname, "../core/src/index.ts"),
    "^@hotora/hotkeys$": resolve(__dirname, "../hotkeys/src/index.ts"),
  },
};

module.exports = config;
