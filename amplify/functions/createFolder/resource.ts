import { defineFunction } from "@aws-amplify/backend";

export const createFolder = defineFunction({
  name: "createFolder",
  entry: "./handler.ts",
});
