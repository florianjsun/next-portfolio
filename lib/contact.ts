import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(3, {
    message: "Name must contain at least 3 characters.",
  }),
  email: z.email("Please enter a valid email."),
  message: z.string().min(10, {
    message: "Please write something more descriptive.",
  }),
  social: z.url().optional().or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
