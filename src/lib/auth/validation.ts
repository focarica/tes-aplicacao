import { z } from "zod";
import { passwordMeetsPolicy } from "@/lib/auth/password-policy";

export const signUpSchema = z.object({
  username: z.string().trim().min(3).max(128),
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(254).toLowerCase(),
  password: z.string().min(8).max(256).refine(passwordMeetsPolicy, "A senha deve atender a todos os requisitos indicados."),
});

export const confirmSignUpSchema = z.object({
  username: z.string().trim().min(1).max(128),
  code: z.string().trim().min(4).max(10),
});

export const signInSchema = z.object({
  email: z.string().trim().email().max(254).toLowerCase(),
  password: z.string().min(1).max(256),
});
