import { z } from "zod";

export const signUpSchema = z.object({
  username: z.string().trim().min(3).max(128),
  fullName: z.string().trim().min(2).max(200),
  email: z.email().trim().max(254),
  password: z.string().min(8).max(256),
});

export const confirmSignUpSchema = z.object({
  username: z.string().trim().min(1).max(128),
  code: z.string().trim().min(4).max(10),
});

export const signInSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
});
