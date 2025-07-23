import { z } from "zod";

export const csvFileImportStep_1_ValidationSchema = z.object({
  file: z.instanceof(File).refine((file) => file.type === "text/csv", {
    message: "Please upload a CSV file",
  }),
  hasHeader: z.boolean(),
});

export const csvFileImportStep_2_ValidationSchema = z.object({
  duplicateField: z.string().min(1, "Please select a duplicate filter field"),
});

export const csvFileImportStep_3_ValidationSchema = z
  .object({
    mapping: z.record(
      z.string().min(1, "Please map every column to a data field")
    ),
  })
  .refine(
    (data) => Object.keys(data.mapping).length > 0,
    { message: "You must map at least one column" }
  );

export const csvFileImportStep_4_ValidationSchema = z.object({
  selectedListId: z.string().min(1, "Please select a list to assign"),
});
