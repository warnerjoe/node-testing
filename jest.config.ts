export default {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    verbose: true,
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  };