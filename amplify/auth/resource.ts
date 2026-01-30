import { defineAuth, secret } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    "custom:folderId": {
      dataType: "String",
      mutable: true,
    },
  },
  groups: ["admin", "user"],
});
