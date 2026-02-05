import { defineFunction } from "@aws-amplify/backend";

export const listFolderUsers = defineFunction({
  name: "listFolderUsers",
  entry: "./handler.ts",
});
