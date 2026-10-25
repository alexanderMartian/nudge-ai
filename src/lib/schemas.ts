import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid work email"),
});

export type WaitlistFormValues = z.infer<typeof waitlistSchema>;
