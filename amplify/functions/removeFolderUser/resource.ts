import { defineFunction } from "@aws-amplify/backend";

export const removeFolderUser = defineFunction({
  name: "removeFolderUser",
  entry: "./handler.ts",
});
