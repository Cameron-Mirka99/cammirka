import { defineFunction } from "@aws-amplify/backend";

export const listUserFolders = defineFunction({
  name: "listUserFolders",
  entry: "./handler.ts",
});
