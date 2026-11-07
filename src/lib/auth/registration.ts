import "server-only";

import { SignUpCommand, ConfirmSignUpCommand, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";
import { createCognitoClient, secretHash } from "@/lib/auth/client";
import type { ConfirmSignUpInput, SignUpInput, SignUpResult } from "@/models/auth.model";

export const cognitoRegistration = {
  async signUp(input: SignUpInput): Promise<SignUpResult> {
    const { config, client } = createCognitoClient();
    const email = input.email.trim().toLowerCase();
    const escapedEmail = email.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    let paginationToken: string | undefined;
    do {
      const existing = await client.send(new ListUsersCommand({
        UserPoolId: config.COGNITO_USER_POOL_ID,
        Filter: `email = "${escapedEmail}"`,
        Limit: 1,
        PaginationToken: paginationToken,
      }));
      if (existing.Users?.length) {
        throw Object.assign(new Error("Email already registered."), { name: "EmailExistsException" });
      }
      paginationToken = existing.PaginationToken;
    } while (paginationToken);

    const response = await client.send(new SignUpCommand({
      ClientId: config.COGNITO_CLIENT_ID,
      Username: input.username,
      Password: input.password,
      SecretHash: secretHash(input.username, config.COGNITO_CLIENT_ID, config.COGNITO_CLIENT_SECRET),
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: input.fullName },
      ],
    }));
    if (!response.UserSub) throw new Error("Cognito did not return a user identifier.");
    return { userId: response.UserSub, requiresConfirmation: response.UserConfirmed !== true };
  },

  async confirmSignUp(input: ConfirmSignUpInput) {
    const { config, client } = createCognitoClient();
    await client.send(new ConfirmSignUpCommand({
      ClientId: config.COGNITO_CLIENT_ID,
      Username: input.username,
      ConfirmationCode: input.code,
      SecretHash: secretHash(input.username, config.COGNITO_CLIENT_ID, config.COGNITO_CLIENT_SECRET),
    }));
  },
};
