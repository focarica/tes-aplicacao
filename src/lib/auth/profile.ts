import "server-only";

import {
  AdminGetUserCommand,
  ChangePasswordCommand,
  GetUserCommand,
  UpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import type { ChangePasswordInput } from "@/models/auth.model";
import type { UpdateUserProfile, UserProfile } from "@/models/user.model";
import { createCognitoClient } from "@/lib/auth/client";
import { avatarViewUrl } from "@/lib/aws/s3";

export interface CognitoProfileInput {
  username?: string;
  attributes?: Array<{ Name?: string; Value?: string }>;
  createdAt?: Date;
}

export function mapProfile(input: CognitoProfileInput): UserProfile {
  const attributes = new Map(
    (input.attributes ?? []).map((item) => [item.Name ?? "", item.Value ?? ""]),
  );

  return {
    id: attributes.get("sub") ?? input.username ?? "",
    fullName: attributes.get("name") ?? "",
    username: attributes.get("cognito:username") ?? input.username ?? "",
    email: attributes.get("email") ?? "",
    profileImageUrl: null,
    description: attributes.get("custom:description") ?? "",
    createdAt: input.createdAt?.toISOString() ?? "",
    avatarKey: attributes.get("custom:avatar_key") || null,
  };
}

export async function getProfile(
  accessToken: string,
  options: { includeCreatedAt?: boolean } = {},
): Promise<UserProfile> {
  const { client, config } = createCognitoClient();
  const response = await client.send(new GetUserCommand({ AccessToken: accessToken }));

  let attributes = response.UserAttributes;
  let createdAt: Date | undefined;
  if (options.includeCreatedAt !== false) {
    try {
      const admin = await client.send(new AdminGetUserCommand({
        UserPoolId: config.COGNITO_USER_POOL_ID,
        Username: response.Username,
      }));
      attributes = admin.UserAttributes ?? attributes;
      createdAt = admin.UserCreateDate;
    } catch (error) {
      // A data de criação exige AdminGetUser; o restante do perfil continua disponível.
      const name = error !== null && typeof error === "object" && "name" in error
        ? String((error as { name: unknown }).name)
        : "UnknownError";
      console.warn("[profile] creation date unavailable", { name });
    }
  }

  const profile = mapProfile({
    username: response.Username,
    attributes,
    createdAt,
  });

  if (profile.avatarKey) {
    try {
      profile.profileImageUrl = await avatarViewUrl(profile.id, profile.avatarKey);
    } catch {
      profile.profileImageUrl = null;
    }
  }
  return profile;
}

export async function updateProfile(accessToken: string, input: UpdateUserProfile) {
  const { client } = createCognitoClient();
  await client.send(new UpdateUserAttributesCommand({
    AccessToken: accessToken,
    UserAttributes: [
      { Name: "name", Value: input.fullName },
      { Name: "custom:description", Value: input.description },
    ],
  }));
}

export async function updateAvatarKey(accessToken: string, key: string) {
  const { client } = createCognitoClient();
  await client.send(new UpdateUserAttributesCommand({
    AccessToken: accessToken,
    UserAttributes: [{ Name: "custom:avatar_key", Value: key }],
  }));
}

export async function changePassword(accessToken: string, input: ChangePasswordInput) {
  const { client } = createCognitoClient();
  await client.send(new ChangePasswordCommand({
    AccessToken: accessToken,
    PreviousPassword: input.currentPassword,
    ProposedPassword: input.newPassword,
  }));
}
