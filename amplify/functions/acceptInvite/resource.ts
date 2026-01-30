import { defineFunction } from "@aws-amplify/backend";

export const acceptInvite = defineFunction({
  name: "acceptInvite",
  entry: "./handler.ts",
});
