import { defineFunction } from "@aws-amplify/backend";

export const processBulkUpload = defineFunction({
  name: "processBulkUpload",
  entry: "./handler.ts",
  // Not API Gateway-bound (S3-triggered), so no 29s limit -- image
  // download + Jimp thumbnailing + two uploads needs more headroom than
  // the API-facing default.
  timeoutSeconds: 60,
  memoryMB: 1024,
});
