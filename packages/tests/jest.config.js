const { resolve } = require("path");

const config = {
  preset: "ts-jest/presets/default",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "./tsconfig.json" }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.(ts|tsx)"],
  moduleNameMapper: {
    "^@hotora/core$": resolve(__dirname, "../core/src/index.ts"),
    "^@hotora/inputs$": resolve(__dirname, "../inputs/src/index.ts"),
    "^@hotora/react-inputs$": resolve(
      __dirname,
      "../react-inputs/src/index.ts",
    ),
  },
};

module.exports = config;
