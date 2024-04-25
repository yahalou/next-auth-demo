import { UserRole } from "@prisma/client";
import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  code: z.optional(z.string()),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
});

// 当input什么都不动的时候，它的值是undefined
// 当input输了什么，最后全部删除，它的值是""
// 所以不要用optional，空字符串和undefined会冲突
export const SettingsSchema = z
  .object({
    name: z.string().or(z.literal("")),
    isTwoFactorEnabled: z.boolean().or(z.literal("")),
    role: z.enum([UserRole.ADMIN, UserRole.USER]),
    email: z.string().email().or(z.literal("")),
    password: z.string().min(6).or(z.literal("")),
    newPassword: z.string().min(6).or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.password && !data.newPassword) {
        return false;
      }

      return true;
    },
    {
      message: "New password is required!",
      path: ["newPassword"],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && !data.password) {
        return false;
      }

      return true;
    },
    {
      message: "Password is required!",
      path: ["password"],
    }
  );
