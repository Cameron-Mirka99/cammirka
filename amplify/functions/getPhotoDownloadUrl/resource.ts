import { defineFunction } from "@aws-amplify/backend";

export const getPhotoDownloadUrl = defineFunction({
  name: "getPhotoDownloadUrl",
  entry: "./handler.ts",
});
