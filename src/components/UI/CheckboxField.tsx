import { Checkbox, FormControlLabel } from "@mui/material";

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
}

function CheckboxField({
  label,
  checked,
  onChange,
  indeterminate = false,
}: CheckboxFieldProps) {
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          indeterminate={indeterminate}
          onChange={(e) => onChange(e.target.checked)}
        />
      }
      label={label}
    />
  );
}

export default CheckboxField;
