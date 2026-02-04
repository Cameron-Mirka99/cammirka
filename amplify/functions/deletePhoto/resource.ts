import { defineFunction } from "@aws-amplify/backend";

export const deletePhoto = defineFunction({
  name: "deletePhoto",
  entry: "./handler.ts",
});
