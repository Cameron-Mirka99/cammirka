import { defineFunction } from "@aws-amplify/backend";

export const listFolders = defineFunction({
  name: "listFolders",
  entry: "./handler.ts",
});
