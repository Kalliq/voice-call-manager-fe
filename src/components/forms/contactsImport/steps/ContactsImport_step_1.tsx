import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { Controller } from "react-hook-form";

import { SimpleButton } from "../../../UI";
import { DropzoneField } from "../../../molecules";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { csvFileImportStep_1_ValidationSchema } from "../../../../schemas/contacts-import/csv-file-import/validation-schema";

const CsvImport_step_1 = ({ onNext }: { onNext: (data: any) => void }) => {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useFormContext();

  const selectedFile = watch("file");

  const handleDrop = (files: File[]) => {
    const file = files[0];
    setValue("file", file, { shouldValidate: true });
  };

  const onSubmit = (data: any) => {
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
        <Box>
          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
            <Typography variant="body2" color="text.secondary">
              Upload CSV File
            </Typography>
            <Tooltip title="Select a CSV file containing contact data. The file should have columns for contact information such as name, phone, email, etc." arrow placement="top">
              <IconButton size="small" sx={{ padding: 0, margin: 0, minWidth: 'auto' }}>
                <InfoIcon fontSize="small" color="action" />
              </IconButton>
            </Tooltip>
          </Box>
          <DropzoneField onDrop={handleDrop} selectedFile={selectedFile} />
        </Box>
        {errors.file && (
          <Typography color="error" mt={1}>
            {errors.file.message as string}
          </Typography>
        )}
        <Box>
          <FormControlLabel
            control={
              <Controller
                name="hasHeader"
                control={control}
                render={({ field }) => (
                  <Checkbox {...field} checked={field.value} />
                )}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography>CSV includes header row</Typography>
                <Tooltip title="Check this box if your CSV file has a header row with column names. If unchecked, the system will treat the first row as data." arrow placement="top">
                  <IconButton size="small" sx={{ padding: 0, margin: 0, minWidth: 'auto' }}>
                    <InfoIcon fontSize="small" color="action" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
        </Box>

        <SimpleButton label="Next" type="submit" />
      </Box>
    </form>
  );
};

export default CsvImport_step_1;
