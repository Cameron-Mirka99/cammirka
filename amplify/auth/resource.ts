import { defineAuth, secret } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    givenName: {
      required: true,
      mutable: true,
    },
    familyName: {
      required: true,
      mutable: true,
    },
    "custom:folderId": {
      dataType: "String",
      mutable: true,
    },
  },
  groups: ["admin", "user"],
});
