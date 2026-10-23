import { defineFunction } from "@aws-amplify/backend";

export const toggleLike = defineFunction({
  name: "toggleLike",
  entry: "./handler.ts",
});
