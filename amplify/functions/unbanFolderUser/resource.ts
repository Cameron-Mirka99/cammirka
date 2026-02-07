import { defineFunction } from "@aws-amplify/backend";

export const unbanFolderUser = defineFunction({
  name: "unbanFolderUser",
  entry: "./handler.ts",
});
