import { defineFunction } from "@aws-amplify/backend";

export const presignBulkUpload = defineFunction({
  name: "presignBulkUpload",
  entry: "./handler.ts",
});
