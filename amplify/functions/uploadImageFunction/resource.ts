import { defineFunction } from "@aws-amplify/backend";

export const uploadImageFunction = defineFunction({
  name: "uploadImageFunction",
  entry: "./handler.ts",
  // Real image decode/resize (via jimp, pure JS — no native binary, so no
  // Lambda layer or special bundling needed) takes longer and more memory
  // than the previous no-op stub did under the 3s/512MB defaults.
  timeoutSeconds: 30,
  memoryMB: 1024,
});
