import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { ZodError } from "zod";
import { z } from "zod";

import useAppStore from "../../../store/useAppStore";
import CreateList_step_1 from "./steps/CreateList_step_1";
import CreateList_step_2 from "./steps/CreateList_step_2";
import CreateList_step_3 from "./steps/CreateList_step_3";

import {
  getValidationSchemaForStep,
  listFiltersValidationSchema,
  listExitStrategyValidationSchema,
} from "../../../schemas/create-list/validation-schema";

import api from "../../../utils/axiosInstance";

// Validation schema factory now handled by imported getValidationSchemaForStep

const MultiStepForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [originalListName, setOriginalListName] = useState<string>("");
  const getListById = useAppStore((state) => state.getListById);
  const updateList = useAppStore((state) => state.updateList);
  const methods = useForm({
    defaultValues: {
      listName: "",
      listPriority: "medium",
      listType: "static",
      listSharing: "notShared",
      filters: [{ field: "", operator: "equals", value: "" }],
      crossFilters: [],
    } as any,
    resolver: zodResolver(getValidationSchemaForStep(step, id)),
    mode: 'onTouched',
  });

  // Dynamically update resolver when step changes or id changes (edit mode)
  useEffect(() => {
    const schema = getValidationSchemaForStep(step, id);
    if (schema) {
      methods.reset(methods.getValues(), {
        keepErrors: false,
        keepDirty: true,
        keepValues: true,
      });
      // @ts-ignore
      methods.control._options.resolver = zodResolver(schema);
    }
  }, [step, id]);

  useEffect(() => {
    if (id) {
      (async () => {
        const list = await getListById(id);

        if (list) {
          setOriginalListName(list.listName || "");
          const transformedList = {
            ...list,
            exitConditionsPositive: list.exitConditionsPositive.map(
              (condition: string) => ({ value: condition })
            ),
            exitConditionsNegative: list.exitConditionsNegative.map(
              (condition: string) => ({ value: condition })
            ),
          };

          methods.reset({
            ...transformedList,
          });
        }
      })();
    }
  }, [id]);

  const onNextStepHandler = (data: any) => {
    setStep(prev => prev + 1);
  };

  const onPreviousStepHandler = () => {
    const previousStep = step - 1;
    setStep(previousStep);
  };

  const submitList = async (formData: any) => {
    if (id) {
      // Edit mode
      return api.patch(`/lists/${id}`, formData);
    } else {
      // Create mode
      return api.post("/lists/create-new", formData);
    }
  };

  const onConfirmHandler = async () => {
    const formDataValues = methods.getValues();
    try {
      const { data } = await submitList(formDataValues);
      console.log(id ? "List updated:" : "New list created:", data);

      navigate("/lists");
    } catch (err) {
      console.error("Error submitting list: ", err);
    }
  };

  const handleRename = async () => {
    if (!id) return;
    
    const currentName = methods.getValues("listName");
    if (!currentName || currentName.trim() === "") {
      return;
    }

    try {
      await api.patch(`/lists/${id}`, { listName: currentName });
      // Update original name to match current name so validation passes
      setOriginalListName(currentName);
      // Clear validation errors on listName field after successful rename
      methods.clearErrors("listName");
      // Trigger validation to ensure form recognizes the name as valid
      // This will re-run uniqueness check, which should now pass since name matches original
      const isValid = await methods.trigger("listName");
      if (!isValid) {
        // If validation still fails, log for debugging
        console.warn("Validation failed after rename - this should not happen");
      }
      console.log("List name updated successfully");
    } catch (err: any) {
      console.error("Error renaming list: ", err);
      // Show error feedback
      throw err; // Re-throw so step 1 can handle error display
    }
  };

  return (
    <Box display="flex" justifyContent="center">
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        width="90%"
      >
        <Typography variant="h1" textAlign="center" fontSize={24} mt={5}>
          {id ? "EDIT LIST" : "CREATE NEW LIST"}
        </Typography>
        <Box>
          <FormProvider {...methods} key={step}>
            {step === 1 && (
              <CreateList_step_1 
                onNext={onNextStepHandler} 
                onRename={id ? handleRename : undefined}
                originalListName={originalListName}
                currentListName={methods.watch("listName")}
              />
            )}
            {step === 2 && (
              <CreateList_step_2
                onNext={onNextStepHandler}
                onPrevious={onPreviousStepHandler}
              />
            )}
            {step === 3 && (
              <CreateList_step_3
                onPrevious={onPreviousStepHandler}
                onConfirm={onConfirmHandler}
              />
            )}
          </FormProvider>
        </Box>
      </Box>
    </Box>
  );
};

export default MultiStepForm;
