import * as z from "zod/mini";

export const contactSchema = z.object({
  name: z.string().check(
    z.minLength(3, {
      error: "Name must contain at least 3 characters.",
    }),
    z.maxLength(100, { error: "Name must not exceed 100 characters." })
  ),
  email: z.email({ error: "Please enter a valid email." }).check(
    z.maxLength(254, {
      error: "Email must not exceed 254 characters.",
    })
  ),
  message: z.string().check(
    z.minLength(10, {
      error: "Please write something more descriptive.",
    }),
    z.maxLength(5_000, {
      error: "Message must not exceed 5000 characters.",
    })
  ),
  social: z.optional(
    z.union([
      z.url().check(
        z.maxLength(2_048, {
          error: "Social link must not exceed 2048 characters.",
        })
      ),
      z.literal(""),
    ])
  ),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
