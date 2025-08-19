import * as z from "zod";
import { isListNameUnique } from "../../utils/listApi";
import api from "../../utils/axiosInstance";

const createListValidationSchema = z.object({
  listName: z.string(),
  listPriority: z.enum(["high", "medium", "low"]),
  listType: z.enum(["static", "dynamic"]),
  listSharing: z.enum(["notShared", "shared"]),
  listOwner: z.string().optional(),
  listActive: z.boolean().optional(),
  restrictToOwnedLeads: z.boolean().optional(),
  restrictToOwnedAccounts: z.boolean().optional(),
  tags: z.string().optional(),
  filters: z
    .array(
      z.object({
        value: z.string(),
        field: z.enum(["city", "state", "country"]),
        operator: z.enum(["equals", "notEquals", "contains"]),
      })
    )
    .optional(),
  crossFilters: z
    .array(
      z.object({
        value: z.string(),
        operator: z.enum(["equals", "notEquals", "contains"]),
        taskField: z.enum(["status", "priority"]),
      })
    )
    .optional(),
});

const listSettingsValidationSchema = z.object({
  listName: z
    .string()
    .min(1, "List name is required")
    .refine(
      // async check: pull all lists and see if this name exists
      async (name) => {
        const { data } = await api.get<{ listName: string }[]>("/lists");
        return !data.some(
          (l) =>
            l.listName.trim().toLowerCase() === name.trim().toLowerCase()
        );
      },
      { message: "That name already exists — please type a new one." }
    ),

  listPriority: z.enum(["high", "medium", "low"], {
    errorMap: () => ({ message: "List priority is required" }),
  }),
});

const listFiltersValidationSchema = z.object({
  filters: z
    .array(
      z.object({
        field: z.enum(["city", "state", "country"], {
          errorMap: () => ({ message: "Select a field" })
        }),
        operator: z.enum(["equals", "notEquals", "contains"], {
          errorMap: () => ({ message: "Select an operator" })
        }),
        value: z
          .string()
          .min(1, "Enter value"),
      })
    )
    .min(1, "Choose at least one filter"), 
});

// Only require exitStrategy and exitStrategyDescription for now
const listExitStrategyValidationSchema = z.object({
  exitStrategy: z.string().min(1, "Exit strategy is required"),
  exitStrategyDescription: z.string().min(1, "Description is required"),
  // exitConditionsPositive: z
  //   .array(
  //     z.object({
  //       value: z.string().min(1, "Select a positive exit condition")
  //     })
  //   )
  //   .min(1, "Add at least one positive exit condition"),
  // exitConditionsNegative: z
  //   .array(
  //     z.object({
  //       value: z.string().min(1, "Select a negative exit condition")
  //     })
  //   )
  //   .min(1, "Add at least one negative exit condition"),
  // steps: z
  //   .array(
  //     z.object({
  //       gap: z.string().min(1, "Gap is required"),
  //       gapUnit: z.enum(["hours", "days"], { errorMap: () => ({ message: "Select a gap unit" }) }),
  //       stepName: z.string().min(1, "Step name is required"),
  //       stepPriority: z.enum(["high", "medium", "low"]).optional(),
  //       defaultAction: z.string().min(1, "Default action is required"),
  //     })
  //   )
  //   .min(1, "Add at least one step"),
});


function getValidationSchemaForStep(step: number) {
  if (step === 1) return listSettingsValidationSchema;
  if (step === 2) return listFiltersValidationSchema;
  return undefined;
}

export {
  getValidationSchemaForStep,
  listSettingsValidationSchema,
  listFiltersValidationSchema,
  listExitStrategyValidationSchema,
};
