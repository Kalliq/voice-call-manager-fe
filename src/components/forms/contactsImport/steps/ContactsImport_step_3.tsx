import { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
} from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import Papa from "papaparse";

import useAppStore from "../../../../store/useAppStore";
import { SimpleButton } from "../../../UI";

const CsvImport_step_3 = ({
  onNext,
  onPrevious,
}: {
  onNext: (data: any) => void;
  onPrevious: () => void;
}) => {
  const { control, handleSubmit, watch,formState: { errors },} = useFormContext();
  const [csvColumns, setCsvColumns] = useState<string[]>([]);

  const settings = useAppStore((state) => state.settings);
  const integrationSettings = settings && settings["Phone Settings"] && settings["Phone Settings"].integrationSettings;

  if (!settings || !integrationSettings || !integrationSettings.contacts) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography color="error">Loading integration settings...</Typography>
      </Box>
    );
  }

  const hasHeader = watch("hasHeader");
  const selectedFile = watch("file");
  const duplicateField = watch("duplicateField");

  const REQUIRED_FIELD_IDS = new Set([
    "first_name",
    "last_name",
    "accountWebsite",
    "phone",
    ...(duplicateField ? [duplicateField] : []),
  ]);

  // Debug logs
  console.log("[Step 3] selectedFile:", selectedFile);
  console.log("[Step 3] hasHeader:", hasHeader);

  useEffect(() => {
    if (selectedFile) {
      Papa.parse(selectedFile, {
        header: hasHeader,
        preview: 1, // only read the first row
        skipEmptyLines: true,
        complete: (results: any) => {
          console.log("[Step 3] PapaParse results:", results);
          if (hasHeader) {
            // If hasHeader is true, PapaParse gives data as object
            const headers = Object.keys(results.data[0] || {});
            setCsvColumns(headers);
          } else {
            // If no header, we get values only
            const firstRow = results.data[0];
            const headers = firstRow.map(
              (_: any, index: number) => `Column ${index + 1}`
            );
            setCsvColumns(headers);
          }
        },
        error: (error: any) => {
          console.error("Error parsing CSV:", error);
        },
      });
    }
  }, [selectedFile, hasHeader]);

  if (csvColumns.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography color="error">
          No columns found in the uploaded CSV file. Please check your file and try again.
        </Typography>
      </Box>
    );
  }

  const onSubmit = (data: any) => {
    console.log("Step 1 Data:", data);
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box
        display="flex"
        flexDirection="column"
        padding={2}
        border="1px solid #eee"
        borderRadius={2}
        mt={1}
        gap={1}
      >
        <Typography variant="h6">Map Data Fields to CSV Columns</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          Required: First Name, Last Name, Company Website, Phone, and the Duplicate Filter Field. Select which CSV column maps to each field.
        </Typography>
        {(errors.mapping as { message?: string })?.message && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {(errors.mapping as { message: string }).message}
          </Typography>
        )}
        <Grid container spacing={2}>
          {integrationSettings.contacts.map((contact: any) => (
            <Grid
              container
              item
              xs={12}
              key={String(contact.id)}
              alignItems="center"
              spacing={2}
            >
              {/* Our field name (left) */}
              <Grid item xs={3}>
                <Typography variant="body1">
                  {contact.name}
                  {REQUIRED_FIELD_IDS.has(contact.id) && (
                    <Box component="span" color="error.main">
                      *
                    </Box>
                  )}
                </Typography>
              </Grid>

              {/* Arrow icon */}
              <Grid item xs={1} display="flex" justifyContent="center">
                <KeyboardArrowRightIcon />
              </Grid>

              {/* CSV column select (right) */}
              <Grid item xs={8}>
                <FormControl
                  fullWidth
                  error={!!(errors.mapping as Record<string, any>)?.[contact.id]}
                >
                  <InputLabel id={`mapping-${contact.id}-label`}>
                    CSV Column
                  </InputLabel>
                  <Controller
                    name={`mapping.${contact.id}`}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Box display="flex" gap={1}>
                        <Select
                          labelId={`mapping-${contact.id}-label`}
                          label="CSV Column"
                          {...field}
                          value={field.value ?? ""}
                          sx={{ flex: 1 }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {csvColumns.map((col) => (
                            <MenuItem key={col} value={col}>
                              {col}
                            </MenuItem>
                          ))}
                        </Select>
                        {field.value && (
                          <SimpleButton
                            label="Clear"
                            type="button"
                            onClick={() => field.onChange("")}
                          />
                        )}
                      </Box>
                    )}
                  />
                </FormControl>
                {(errors.mapping as Record<string, any>)?.[contact.id] && (
                  <Typography color="error" variant="caption" sx={{ mt: 1, ml: 1 }}>
                    {(errors.mapping as Record<string, any>)[contact.id]?.message as string}
                  </Typography>
                )}
              </Grid>
            </Grid>
          ))}
        </Grid>
        <Box display="flex" flexDirection="row">
          <SimpleButton label="Next" type="submit" />
          <SimpleButton label="Previous" onClick={onPrevious} />
        </Box>
      </Box>
    </form>
  );
};

export default CsvImport_step_3;
