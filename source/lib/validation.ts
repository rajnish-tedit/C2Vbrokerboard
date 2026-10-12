import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const onboardingBusinessSchema = z.object({
  legalName: z.string().trim().min(2, "Legal business name is required"),
  ein: z
    .string()
    .trim()
    .regex(/^\d{2}-\d{7}$/, "Use the format 12-3456789"),
  address: z.string().trim().min(5, "Business address is required"),
  website: z.string().trim().optional(),
});

export const onboardingIdentitySchema = z.object({
  representative: z.string().trim().min(2, "Representative name is required"),
  title: z.string().trim().min(2, "Title is required"),
  dob: z.string().min(1, "Date of birth is required"),
  ssnLast4: z.string().regex(/^\d{4}$/, "Enter the last 4 digits"),
});

export const onboardingBankSchema = z.object({
  accountHolder: z.string().trim().min(2, "Account holder name is required"),
  routing: z.string().regex(/^\d{9}$/, "Routing numbers have 9 digits"),
  account: z.string().regex(/^\d{4,17}$/, "Enter a valid account number"),
});

export type OnboardingBusiness = z.infer<typeof onboardingBusinessSchema>;
export type OnboardingIdentity = z.infer<typeof onboardingIdentitySchema>;
export type OnboardingBank = z.infer<typeof onboardingBankSchema>;

export const reasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Give a reason of at least 10 characters for the audit log"),
});
