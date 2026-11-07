import "server-only";

import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "node:crypto";
import { getCognitoConfig } from "@/lib/auth/config";

export function createCognitoClient() {
  const config = getCognitoConfig();
  return { config, client: new CognitoIdentityProviderClient({ region: config.AWS_REGION }) };
}

export function secretHash(username: string, clientId: string, secret?: string) {
  if (!secret) return undefined;
  return createHmac("sha256", secret).update(username + clientId).digest("base64");
}
