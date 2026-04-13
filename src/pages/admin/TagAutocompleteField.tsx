import { Autocomplete, TextField } from "@mui/material";

type TagAutocompleteFieldProps = {
  value: string[];
  options: string[];
  label: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string[]) => void;
};

export function TagAutocompleteField({
  value,
  options,
  label,
  helperText,
  placeholder,
  disabled,
  onChange,
}: TagAutocompleteFieldProps) {
  return (
    <Autocomplete
      multiple
      freeSolo
      filterSelectedOptions
      options={options}
      value={value}
      onChange={(_, nextValue) => onChange(nextValue.map((entry) => String(entry)))}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          helperText={helperText}
          placeholder={placeholder}
        />
      )}
      disabled={disabled}
    />
  );
}
