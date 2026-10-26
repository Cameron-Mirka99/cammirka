import { defineFunction } from "@aws-amplify/backend";

export const triggerRetentionSweep = defineFunction({
  name: "triggerRetentionSweep",
  entry: "./handler.ts",
});
