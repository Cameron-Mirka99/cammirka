import { defineFunction } from "@aws-amplify/backend";

export const addFolderUser = defineFunction({
  name: "addFolderUser",
  entry: "./handler.ts",
});
