import { defineFunction } from "@aws-amplify/backend";

export const publicPhotos = defineFunction({
  name: "publicPhotos",
  entry: "./handler.ts",
});
