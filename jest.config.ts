import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(ts|tsx)?$": "ts-jest",
  },
  setupFilesAfterEnv: ["./jest.setup.ts"],
  verbose: true,
};

export default config;
