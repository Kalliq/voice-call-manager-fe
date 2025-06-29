import { z } from "zod";

export const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  tags: z.string().optional(),
});
