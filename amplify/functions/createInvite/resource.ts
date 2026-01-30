import { defineFunction } from "@aws-amplify/backend";

export const createInvite = defineFunction({
  name: "createInvite",
  entry: "./handler.ts",
});
