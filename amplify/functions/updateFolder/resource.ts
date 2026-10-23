import { defineFunction } from "@aws-amplify/backend";

export const updateFolder = defineFunction({
  name: "updateFolder",
  entry: "./handler.ts",
});
