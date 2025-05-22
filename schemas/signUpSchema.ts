import * as z from "zod";

export const signUpSchema = z
  .object({
    email: z
      .string()
      .nonempty({ message: "Email is required" })
      .email({ message: "Invalid email" }),

    password: z
      .string()
      .nonempty({ message: "Password is required" })
      .min(6, { message: "Password must be at least 6 characters" }),

    passwordConfirmation: z
      .string()
      .nonempty({ message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });
           