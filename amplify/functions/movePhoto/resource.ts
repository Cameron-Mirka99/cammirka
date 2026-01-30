import { defineFunction } from "@aws-amplify/backend";

export const movePhoto = defineFunction({
  name: "movePhoto",
  entry: "./handler.ts",
});
