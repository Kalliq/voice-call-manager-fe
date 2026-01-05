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
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
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
        <Box display="flex" alignItems="center" gap={0.5} mb={1}>
          <Typography variant="h6">Map CSV Columns to Data Fields</Typography>
          <Tooltip title="Match each column from your CSV file to the corresponding contact field in the system. Select 'NONE' if you want to skip a column during import." arrow placement="top">
            <IconButton size="small" sx={{ padding: 0, margin: 0, minWidth: 'auto' }}>
              <InfoIcon fontSize="small" color="action" />
            </IconButton>
          </Tooltip>
        </Box>
        <Grid container spacing={2}>
          {csvColumns.map((col) => (
            <Grid
              container
              item
              xs={12}
              key={col}
              alignItems="center"
              spacing={2}
            >
              {/* Column label */}
              <Grid item xs={3}>
                <Typography variant="body1">{col}</Typography>
              </Grid>

              {/* Arrow icon */}
              <Grid item xs={1} display="flex" justifyContent="center">
                <KeyboardArrowRightIcon />
              </Grid>

              {/* Select input */}
              <Grid item xs={8}>
                <FormControl fullWidth  error={!!(
                    errors.mapping &&
                    (errors.mapping as Record<string, any>)[col]
                  )}>
                  <InputLabel id={`mapping-${col}-label`}>Field</InputLabel>
                  <Controller
                    name={`mapping.${col}`}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Select
                        labelId={`mapping-${col}-label`}
                        label="Field"
                        {...field}
                        value={field.value ?? ""}
                      >
                        <MenuItem value="">
                          <em>NONE</em>
                        </MenuItem>
                        {integrationSettings.contacts.map((contact: any) => (
                          <MenuItem key={String(contact.id)} value={contact.id}>
                            {contact.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
                {(errors.mapping as Record<string, any>)?.message && (
                  <Typography color="error" variant="caption" sx={{ mt: 1, ml: 1 }}>
                    {
                      (errors.mapping as Record<string, any>)[col].message
                    }
                  </Typography>
                )}
                {/* {errors.mapping?.[col] && (
                  <Typography color="error" variant="caption" mt={1}>
                    {errors.mapping[col]?.message as string}
                  </Typography>
                )} */}
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
