import { defineFunction } from "@aws-amplify/backend";

export const listStuckBulkUploads = defineFunction({
  name: "listStuckBulkUploads",
  entry: "./handler.ts",
});
