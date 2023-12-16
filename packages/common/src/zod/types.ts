import z from "zod";

export const signupSchema = z.object({
  email: z
    .string()
    .email("This is not a valid email.")
    .includes("@")
    .min(3, "Email must be at least 3 characters long.")
    .max(254, "Email must be no longer than 254 characters."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});
