import { defineFunction } from "@aws-amplify/backend";

export const uploadImageFunction = defineFunction({
  name: "uploadImageFunction",
  entry: "./handler.ts",
  resourceGroupName: "storage",
});
