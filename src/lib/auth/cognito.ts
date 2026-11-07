import "server-only";

import {
  type AuthFlowType,
  type InitiateAuthCommandOutput,
  type RespondToAuthChallengeCommandOutput,
  InitiateAuthCommand,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import type {
  CognitoTokens,
  SignInInput,
  SignInResult,
} from "@/models/auth.model";
import type { CognitoAuthProvider } from "@/services/auth.service";
import { createCognitoClient, secretHash } from "@/lib/auth/client";
import { cognitoRegistration } from "@/lib/auth/registration";

type AuthResponse = InitiateAuthCommandOutput | RespondToAuthChallengeCommandOutput;

function tokensFromResponse(response: AuthResponse): CognitoTokens | null {
  const auth = response.AuthenticationResult;
  if (!auth?.AccessToken || !auth.IdToken || !auth.ExpiresIn) return null;
  return {
    accessToken: auth.AccessToken,
    idToken: auth.IdToken,
    refreshToken: auth.RefreshToken,
    expiresIn: auth.ExpiresIn,
  };
}

export const cognitoAuthProvider: CognitoAuthProvider = {
  ...cognitoRegistration,

  async signIn(input: SignInInput): Promise<SignInResult> {
    const { config, client } = createCognitoClient();
    const authFlow: AuthFlowType = "USER_PASSWORD_AUTH";
    const response = await client.send(new InitiateAuthCommand({
      AuthFlow: authFlow,
      ClientId: config.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: input.email,
        PASSWORD: input.password,
        ...(config.COGNITO_CLIENT_SECRET
          ? { SECRET_HASH: secretHash(input.email, config.COGNITO_CLIENT_ID, config.COGNITO_CLIENT_SECRET)! }
          : {}),
      },
    }));
    const tokens = tokensFromResponse(response);
    if (tokens) return { status: "authenticated", tokens };
    return {
      status: "challenge-required",
      challenge: response.ChallengeName ?? "UNKNOWN_CHALLENGE",
      session: response.Session,
    };
  },

  async signOut(accessToken: string) {
    const { client } = createCognitoClient();
    await client.send(new GlobalSignOutCommand({ AccessToken: accessToken }));
  },
};
