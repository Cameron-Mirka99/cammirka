import { defineFunction } from "@aws-amplify/backend";

export const updateUser = defineFunction({
  name: "updateUser",
  entry: "./handler.ts",
});
