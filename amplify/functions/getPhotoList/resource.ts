import { defineFunction } from "@aws-amplify/backend";

export const getPhotoList = defineFunction({
  name: "GetPhotoList",
  entry: "./handler.ts",
});
