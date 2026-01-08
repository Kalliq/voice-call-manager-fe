import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface SelectFieldProps<T> {
  items: T[];
  label: string;
  value: string;
  onChange: (value: string) => void;
  getValue: (item: T) => string;
  getLabel: (item: T) => string;
  placeholder?: string;
}

function SelectField<T>({
  items,
  label,
  value,
  onChange,
  getValue,
  getLabel,
  placeholder,
}: SelectFieldProps<T>) {
  // Ensure value is always a string to prevent uncontrolled/controlled warning
  const controlledValue = typeof value === "string" ? value : "";
  
  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={controlledValue}
        onChange={(e) => {
          const selectedValue = e.target.value;
          onChange(selectedValue);
        }}
      >
        <MenuItem value="">{placeholder ?? "All"}</MenuItem>
        {items.map((item) => (
          <MenuItem key={getValue(item)} value={getValue(item)}>
            {getLabel(item)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default SelectField;
