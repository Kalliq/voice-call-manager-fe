import { TextField } from "@mui/material";

interface CustomTextFieldProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: "small" | "medium";
  type?: string;
  InputProps?: any;
  sx?: object;
}

const CustomTextField = ({
  value,
  onChange,
  label,
  placeholder,
  error,
  helperText,
  fullWidth = false,
  size = "medium",
  type = "text",
  InputProps = {},
  sx = {},
}: CustomTextFieldProps) => {
  return (
    <TextField
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      fullWidth={fullWidth}
      size={size}
      variant="outlined"
      type={type}
      InputProps={InputProps}
      sx={sx}
    />
  );
};

export { CustomTextField };
