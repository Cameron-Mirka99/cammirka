import { defineFunction } from "@aws-amplify/backend";

export const listAllUsers = defineFunction({
  name: "listAllUsers",
  entry: "./handler.ts",
});
