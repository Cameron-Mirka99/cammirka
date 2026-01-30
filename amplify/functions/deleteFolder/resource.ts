import { defineFunction } from "@aws-amplify/backend";

export const deleteFolder = defineFunction({
  name: "deleteFolder",
  entry: "./handler.ts",
});
