import { defineFunction } from "@aws-amplify/backend";

export const updatePhotoTags = defineFunction({
  name: "updatePhotoTags",
  entry: "./handler.ts",
});
