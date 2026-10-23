import { Amplify } from "aws-amplify";

let configured = false;

export function configureAmplify() {
  if (configured) return;
  configured = true;

  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
  const identityPoolId = process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID;

  if (identityPoolId) {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId,
          identityPoolId,
          loginWith: { email: true },
        },
      },
    });
  } else {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId,
          loginWith: { email: true },
        },
      },
    });
  }
}
