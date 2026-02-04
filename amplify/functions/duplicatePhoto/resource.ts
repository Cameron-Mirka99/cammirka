import { defineFunction } from "@aws-amplify/backend";

export const duplicatePhoto = defineFunction({
  name: "duplicatePhoto",
  entry: "./handler.ts",
});
