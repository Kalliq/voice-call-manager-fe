import * as z from "zod";

export const recordingsManagementValidationSchema = z.object({
  enableCallRecording: z.boolean().optional(),
  recordingExcludePrefixes: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        // Convert multi-line string to array, filter empty lines
        return val
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
      }
      return [];
    })
    .refine(
      (arr) => arr.every((prefix) => /^[0-9*#+\s-]+$/.test(prefix)),
      "Invalid phone prefix format. Use only digits, +, *, #, spaces, and hyphens."
    ),
  recordingIncludePrefixes: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        // Convert multi-line string to array, filter empty lines
        return val
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
      }
      return [];
    })
    .refine(
      (arr) => arr.every((prefix) => /^[0-9*#+\s-]+$/.test(prefix)),
      "Invalid phone prefix format. Use only digits, +, *, #, spaces, and hyphens."
    ),
});
