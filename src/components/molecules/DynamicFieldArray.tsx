import {
  useFieldArray,
  Controller,
  Control,
  FieldErrors,
} from "react-hook-form";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import { SimpleButton } from "../UI";

interface DynamicFieldConfig {
  type: "dynamic";
  name: string;
  label: string;
  addButtonLabel: string;
  tooltip?: string;
  nestedFields: {
    type: string;
    name: string;
    label: string;
    placeholder?: string;
    options?: { label: string; value: string | boolean }[];
    disableOnFirst: boolean;
    tooltip?: string;
  }[];
}

interface DynamicFieldArrayProps {
  fieldConfig: DynamicFieldConfig;
  control: Control<any>;
  errors: FieldErrors<any>;
}

const DynamicFieldArray: React.FC<DynamicFieldArrayProps> = ({
  fieldConfig,
  control,
  errors,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldConfig.name,
  });

  const renderLabelWithTooltip = (label: string, tooltip?: string) => {
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
    <Box sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" gap={0.5} mb={1}>
        <Typography variant="subtitle1">
          {fieldConfig.label}
        </Typography>
        {fieldConfig.tooltip && (
          <Tooltip title={fieldConfig.tooltip} arrow placement="top">
            <IconButton size="small" sx={{ padding: 0, margin: 0, minWidth: 'auto' }}>
              <InfoIcon fontSize="small" color="action" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {fields.map((item, index) => (
        <Box
          key={item.id}
          sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2, mb: 2 }}
        >
          <Grid container spacing={2}>
            {fieldConfig.nestedFields.map((nestedField, idx) => {
              const fieldName = `${fieldConfig.name}[${index}].${nestedField.name}`;
              const nestedError = (
                errors?.[fieldConfig.name] as unknown as any[]
              )?.[index]?.[nestedField.name];

              const isDisabled =
                index === 0 && Boolean(nestedField.disableOnFirst);

              switch (nestedField.type) {
                case "text":
                  return (
                    <Grid item xs={12} sm={4} key={nestedField.name}>
                      {nestedField.tooltip && (
                        <Box mb={0.5}>
                          {renderLabelWithTooltip(nestedField.label, nestedField.tooltip)}
                        </Box>
                      )}
                      <Controller
                        name={fieldName}
                        control={control}
                        defaultValue={(item as any)[nestedField.name] ?? ""}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ""}
                            label={!nestedField.tooltip ? nestedField.label : undefined}
                            placeholder={nestedField.placeholder}
                            fullWidth
                            error={Boolean(nestedError)}
                            helperText={nestedError?.message}
                            disabled={isDisabled}
                            sx={isDisabled ? { opacity: 0.6 } : undefined}
                          />
                        )}
                      />
                    </Grid>
                  );
                case "select":
                  return (
                    <Grid item xs={12} sm={4} key={nestedField.name}>
                      {nestedField.tooltip && (
                        <Box mb={0.5}>
                          {renderLabelWithTooltip(nestedField.label, nestedField.tooltip)}
                        </Box>
                      )}
                      <Controller
                        name={fieldName}
                        control={control}
                        defaultValue={(item as any)[nestedField.name] ?? ""}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ""}
                            select
                            fullWidth
                            label={!nestedField.tooltip ? nestedField.label : undefined}
                            disabled={isDisabled}
                            sx={isDisabled ? { opacity: 0.6 } : undefined}
                          >
                            {nestedField.options?.map((option) => (
                              <MenuItem
                                key={String(option.value)}
                                value={option.value as string | number}
                              >
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>
                  );
                default:
                  return null;
              }
            })}
          </Grid>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => remove(index)}
            sx={{ mt: 1 }}
          >
            Remove
          </Button>
        </Box>
      ))}
      <SimpleButton
        label={fieldConfig.addButtonLabel}
        variant="outlined"
        onClick={() => append({})}
      />
    </Box>
  );
};

export { DynamicFieldArray };
