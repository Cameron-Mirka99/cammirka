import { defineFunction } from "@aws-amplify/backend";

export const backfillFolderUsers = defineFunction({
  name: "backfillFolderUsers",
  entry: "./handler.ts",
});
