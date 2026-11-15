import { z } from "zod";

export const cognitoPasswordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(256, "A senha deve ter no máximo 256 caracteres.")
  .regex(/[a-z]/, "A senha deve conter uma letra minúscula.")
  .regex(/[A-Z]/, "A senha deve conter uma letra maiúscula.")
  .regex(/\d/, "A senha deve conter um número.")
  .regex(/[^A-Za-z0-9\s]/, "A senha deve conter um símbolo.");

export const signUpSchema = z.object({
  username: z.string().trim().min(3).max(128),
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(254).toLowerCase(),
  password: cognitoPasswordSchema,
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
