import { z } from "zod";

export const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  accountId: z.string().optional(),
  email: z.string().email("Must be a valid email"),
  phone: z.string().min(10),
  tags: z.string().optional(),
  linkedIn: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  state: z.string().optional(),
  subject: z.string().optional(),
  city: z.string().optional(),
});
