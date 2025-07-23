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
  listSettingsValidationSchema,
  listFiltersValidationSchema,
  listExitStrategyValidationSchema,
} from "../../../schemas/create-list/validation-schema";

import api from "../../../utils/axiosInstance";

const getValidationSchemaForStep = (step: number) => {
  switch (step) {
    case 1:
      return listSettingsValidationSchema;
    case 2:
      return listFiltersValidationSchema;
    case 3:
      return listExitStrategyValidationSchema;
    default:
      // Return a pass-through schema for steps without validation
      return z.object({});
  }
};

const MultiStepForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
    resolver: zodResolver(getValidationSchemaForStep(step)),
    mode: 'onTouched',
  });

  // Dynamically update resolver when step changes
  useEffect(() => {
    methods.reset(methods.getValues(), {
      keepErrors: false,
      keepDirty: true,
      keepValues: true,
    });
    // @ts-ignore
    methods.control._options.resolver = zodResolver(getValidationSchemaForStep(step));
  }, [step]);

  useEffect(() => {
    if (id) {
      (async () => {
        const list = await getListById(id);

        if (list) {
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
            {step === 1 && <CreateList_step_1 onNext={onNextStepHandler} />}
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
