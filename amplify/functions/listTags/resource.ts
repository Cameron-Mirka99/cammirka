import { defineFunction } from "@aws-amplify/backend";

export const listTags = defineFunction({
  name: "listTags",
  entry: "./handler.ts",
});
