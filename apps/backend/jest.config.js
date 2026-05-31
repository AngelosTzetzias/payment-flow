/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest/presets/default-esm",
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  extensionsToTreatAsEsm: [".ts"],
  setupFiles: ["reflect-metadata"],
  collectCoverageFrom: ["**/*.ts", "!**/generated/**"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { useESM: true, tsconfig: "<rootDir>/../tsconfig.json" }],
  },
  // Source uses NodeNext `.js` extensions on relative imports; strip them so Jest resolves the .ts.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testEnvironment: "node",
};
