import { z } from "zod";

export const signUpSchema = z.object({
  username: z.string().trim().min(3).max(128),
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(254).toLowerCase(),
  // A política de senha é aplicada pelo Cognito; aqui só evitamos valores vazios.
  password: z.string().min(1).max(256),
  description: z.string().trim().max(500).default(""),
});

export const confirmSignUpSchema = z.object({
  username: z.string().trim().min(1).max(128),
  code: z.string().trim().min(4).max(10),
});

export const signInSchema = z.object({
  email: z.string().trim().email().max(254).toLowerCase(),
  password: z.string().min(1).max(256),
});
