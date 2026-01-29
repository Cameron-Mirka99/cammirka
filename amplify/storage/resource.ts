import { defineStorage } from "@aws-amplify/backend";
import { getPhotoList } from "../functions/getPhotoList/resource";
import { uploadImageFunction } from "../functions/uploadImageFunction/resource";

export const storage = defineStorage({
  name: "photoSiteAssets",
  access: (allow) => ({
    "uploads/*": [
      allow.resource(uploadImageFunction).to(["read", "write", "delete"]),
      allow.resource(getPhotoList).to(["read"]),
    ],
  }),
});
