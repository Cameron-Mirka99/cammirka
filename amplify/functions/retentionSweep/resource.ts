import { defineFunction } from "@aws-amplify/backend";

export const retentionSweep = defineFunction({
  name: "retentionSweep",
  entry: "./handler.ts",
  // Not API Gateway-bound, so none of the 29s integration timeout applies --
  // a daily run needs to walk every folder's S3 listing + metadata lookups.
  timeoutSeconds: 600,
  memoryMB: 512,
});
