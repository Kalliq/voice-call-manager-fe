import React, { useState } from "react";
import {
  useFormContext,
  Controller,
  SubmitHandler,
  FieldValues,
} from "react-hook-form";
import { Box, Typography, Switch, Tooltip, IconButton } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import { useAuth } from "../contexts/AuthContext";
import { FormRendererProps } from "../interfaces/form-renderer";
import { ButtonAction } from "../enums/form-buttons-actions";
import { SimpleButton, CustomTextField } from "./UI";
import {
  CheckBoxWithNestedField,
  RadioGroupWithNestedField,
  DynamicFieldArray,
} from "./molecules";
import { FormErrorMessage } from "./atoms";

type BtnVisual = "idle" | "loading" | "success";

const FormRenderer = ({
  schema,
  onSubmit,
  onNext,
  onPrevious,
}: FormRendererProps) => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext();
  const { isAdmin } = useAuth();

  // Track non-submit actions (e.g., NEXT/PREVIOUS) to show spinners/disable buttons
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [btnState, setBtnState] = useState<Record<string, BtnVisual>>({});

  const setBtn = (id: string, state: BtnVisual) =>
    setBtnState((s) => ({ ...s, [id]: state }));

  const runButtonAction = async (id: string, fn: () => Promise<void>) => {
    if (!id) return;
    if (btnState[id] === "loading") return; // guard double-click
    setBtn(id, "loading");
    try {
      await fn();
      setBtn(id, "success");
      // fade back after 3s
      setTimeout(() => setBtn(id, "idle"), 3000);
    } catch (e) {
      // on error, just return to idle (or keep separate error state if you wish)
      setBtn(id, "idle");
      throw e;
    }
  };

  const handleButtonClick = async (action?: string, id?: string) => {
    if (!action) return;
    const btnId = id || action;

    switch (action) {
      case ButtonAction.NEXT:
        await runButtonAction(btnId, async () => {
          await handleSubmit(async (data) => {
            await onNext?.(data);
          })();
        });
        break;
      case ButtonAction.PREVIOUS:
        await runButtonAction(btnId, async () => {
          await onPrevious?.();
        });
        break;
      default:
        // custom actions → wrap them similarly
        await runButtonAction(btnId, async () => {
          /* await something */
        });
    }
  };

  const anyLoading = isSubmitting || pendingAction !== null;

  const renderLabelWithTooltip = (label: string | undefined, tooltip: string | undefined) => {
    if (!label) return null;
    if (!tooltip) return label;
    
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        <Typography component="span">{label}</Typography>
        <Tooltip title={tooltip} arrow placement="top">
          <IconButton size="small" sx={{ padding: 0, margin: 0, minWidth: 'auto' }}>
            <InfoIcon fontSize="small" color="action" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  return (
    <>
      <form
        key={schema.title + (schema.sections?.[0]?.fields?.length || 0)}
        onSubmit={
          onSubmit
            ? handleSubmit(async (data) => {
                // Ensures RHF sets isSubmitting while your promise is pending
                await (onSubmit as SubmitHandler<FieldValues>)(data);
              })
            : (e) => e.preventDefault()
        }
      >
        {/* Optional: block interactions while loading */}
        <fieldset
          disabled={anyLoading}
          style={{ border: "none", padding: 0, margin: 0 }}
        >
          <Box
            display="flex"
            flexDirection="column"
            gap={4}
            sx={{ opacity: anyLoading ? 0.9 : 1 }}
          >
            <Typography
              variant="h2"
              fontWeight="bold"
              mt={2}
              pl={2}
              fontSize={16}
            >
              {schema.title}
            </Typography>

            <Box
              display="flex"
              flexDirection="column"
              padding={2}
              border="1px solid #eee"
              borderRadius={2}
              mt={1}
              px={3}
              py={2}
              gap={1}
            >
              {schema.sections.map((section, idx) => {
                const isButtonSection = section.fields.every(
                  (f) => f.type === "button"
                );

                return (
                  <Box
                    key={`${section}.${idx}`}
                    display={isButtonSection ? "flex" : "block"}
                    flexDirection={isButtonSection ? "row" : "column"}
                    gap={0}
                  >
                    {!isButtonSection && (
                      <Typography
                        variant="h3"
                        fontSize={14}
                        mt={4}
                        mb={2}
                        fontWeight="bold"
                      >
                        {section.title}
                      </Typography>
                    )}

                    {section.fields.map((field, fIdx) => {
                      const isReadonly = field.adminOnly && !isAdmin;

                      switch (field.type) {
                        case "text":
                          return (
                            <Box key={fIdx}>
                              {field.tooltip && (
                                <Box mb={0.5}>
                                  {renderLabelWithTooltip(field.label, field.tooltip)}
                                </Box>
                              )}
                              <Controller
                                name={field.name || ""}
                                control={control}
                                render={({ field: controllerField }) => (
                                  <CustomTextField
                                    value={controllerField.value}
                                    onChange={controllerField.onChange}
                                    label={!field.tooltip ? field.label : undefined}
                                    placeholder={field.placeholder}
                                    fullWidth={field.fullWidth}
                                    error={!!errors[field.name || ""]}
                                    helperText={
                                      !isReadonly
                                        ? (errors[field.name || ""]
                                            ?.message as string)
                                        : "(Admin only field)"
                                    }
                                    InputProps={{ readOnly: isReadonly }}
                                    sx={
                                      isReadonly
                                        ? { opacity: 0.5, pointerEvents: "none" }
                                        : {}
                                    }
                                  />
                                )}
                              />
                            </Box>
                          );

                        case "radio":
                          if (!field.options) return null;
                          const selectedOption = watch(field.name || "");
                          return (
                            <Box key={fIdx}>
                              {field.tooltip && (
                                <Box mb={1}>
                                  {renderLabelWithTooltip(field.label, field.tooltip)}
                                </Box>
                              )}
                              <RadioGroupWithNestedField
                                controllerKey={fIdx}
                                field={field}
                                control={control}
                                errors={errors}
                                selectedOption={selectedOption}
                                isReadonly={isReadonly || false}
                              />
                            </Box>
                          );

                        case "checkbox":
                          return (
                            <CheckBoxWithNestedField
                              key={fIdx}
                              controllerKey={fIdx}
                              field={field}
                              control={control}
                              errors={errors}
                              isReadonly={isReadonly || false}
                            />
                          );

                        case "toggle":
                          return (
                            <Controller
                              key={fIdx}
                              name={field.name || ""}
                              control={control}
                              render={({ field: controllerField }) => (
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Switch
                                    checked={controllerField.value || false}
                                    onChange={(e) =>
                                      controllerField.onChange(e.target.checked)
                                    }
                                    sx={{ transform: "scale(1.5)" }}
                                  />
                                  <Typography>{field.label}</Typography>
                                </Box>
                              )}
                            />
                          );

                        case "dynamic":
                          return (
                            <DynamicFieldArray
                              key={fIdx}
                              fieldConfig={field as any}
                              control={control}
                              errors={errors}
                            />
                          );

                        case "button": {
                          const isSubmit = field.action === "submit";
                          const btnId =
                            field.name ||
                            `btn-${idx}-${fIdx}-${field.action || "custom"}`;

                          const loading = btnState[btnId] === "loading";
                          const success = btnState[btnId] === "success";

                          return (
                            <Box key={fIdx}>
                              <SimpleButton
                                type={"button"}
                                label={field.label || ""}
                                loading={loading}
                                success={success}
                                onClick={() =>
                                  runButtonAction(btnId, async () => {
                                    if (isSubmit) {
                                      // manual submit -> keeps RHF validation but avoids global isSubmitting visuals
                                      await handleSubmit(async (data) => {
                                        await (
                                          onSubmit as SubmitHandler<FieldValues>
                                        )?.(data);
                                      })();
                                    } else {
                                      await handleButtonClick(
                                        field.action,
                                        btnId
                                      );
                                    }
                                  })
                                }
                                disabled={loading}
                              />
                            </Box>
                          );
                        }

                        default:
                          return null;
                      }
                    })}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </fieldset>
      </form>

      <FormErrorMessage errors={errors} />
    </>
  );
};

export default FormRenderer;
