import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.email("Please enter a valid work email").max(254, "Please enter a valid work email"),
  // Honeypot: real users never see or fill it
  website: z.string().optional(),
});

export type WaitlistFormValues = z.infer<typeof waitlistSchema>;
