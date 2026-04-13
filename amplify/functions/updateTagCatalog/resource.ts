import { defineFunction } from "@aws-amplify/backend";

export const updateTagCatalog = defineFunction({
  name: "updateTagCatalog",
  entry: "./handler.ts",
});
