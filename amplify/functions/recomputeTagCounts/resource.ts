import { defineFunction } from "@aws-amplify/backend";

export const recomputeTagCounts = defineFunction({
  name: "recomputeTagCounts",
  entry: "./handler.ts",
  // Scans the tag-assignments table in full to retally every tag's count --
  // cheap per item, but needs headroom for however many assignment rows
  // exist, plus one catalog scan and one write per tag.
  timeoutSeconds: 60,
});
