import "server-only";

import { z } from "zod";

const envSchema = z.object({
  AWS_REGION: z.string().min(1),
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1),
  COGNITO_CLIENT_SECRET: z.string().optional(),
});

export function getCognitoConfig() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw Object.assign(new Error("AWS Cognito is not configured."), { name: "CognitoConfigurationError" });
  }
  return parsed.data;
}
