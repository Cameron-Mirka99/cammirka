import { defineFunction } from "@aws-amplify/backend";

export const backfillPhotoDimensions = defineFunction({
  name: "backfillPhotoDimensions",
  entry: "./handler.ts",
  // Downloads and decodes a batch of full-resolution photos per call —
  // kept well under API Gateway's hard 29s integration timeout, with
  // room for S3/DynamoDB latency on top of the decode work.
  timeoutSeconds: 25,
  memoryMB: 1024,
});
