import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
  Autocomplete,
  Chip,
  Box,
} from "@mui/material";

const MAX_NUMBERS_PER_USER = 2;

interface AssignNumbersDialogProps {
  open: boolean;
  onClose: () => void;
  userEmail: string | null;
  numbers: any[];
  selectedNumbers: string[];
  onNumbersChange: (numbers: string[]) => void;
  onAssign: () => void;
  maxSelectable?: number;
}

export default function AssignNumbersDialog({
  open,
  onClose,
  userEmail,
  numbers,
  selectedNumbers,
  onNumbersChange,
  onAssign,
  maxSelectable,
}: AssignNumbersDialogProps) {
  const availableNumbers = numbers.filter((n) => !n.assigned || n.released);

  const handleNumbersChange = (newValue: any[]) => {
    const newNumbers = newValue.map((n) => n.number || String(n)).filter(Boolean);
    const limited =
      maxSelectable !== undefined && newNumbers.length > maxSelectable
        ? newNumbers.slice(0, maxSelectable)
        : newNumbers;
    onNumbersChange(limited);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Assign Phone Numbers
        {userEmail && ` to ${userEmail}`}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography variant="body2" color="text.secondary">
            Select phone numbers to assign. Only unassigned numbers are shown.
            {maxSelectable !== undefined &&
              (maxSelectable === 0 ? (
                <> This user has reached the maximum of {MAX_NUMBERS_PER_USER} numbers.</>
              ) : (
                <> Maximum {maxSelectable} more number(s) can be assigned.</>
              ))}
          </Typography>
          <Autocomplete
            multiple
            options={availableNumbers}
            getOptionLabel={(option) => option.number || String(option)}
            value={numbers.filter((n) =>
              selectedNumbers.includes(n.number || String(n))
            )}
            onChange={(_, newValue) => handleNumbersChange(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Phone Numbers" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.number || String(option)}
                  {...getTagProps({ index })}
                  key={option.number || String(option)}
                />
              ))
            }
          />
          {selectedNumbers.length > 0 && (
            <Box>
              <Typography variant="body2" fontWeight="bold" mb={1}>
                Selected Numbers ({selectedNumbers.length}):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {selectedNumbers.map((num) => (
                  <Chip key={num} label={num} size="small" />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onAssign}
          disabled={
            selectedNumbers.length === 0 ||
            (maxSelectable !== undefined &&
              selectedNumbers.length > maxSelectable)
          }
        >
          Assign Numbers
        </Button>
      </DialogActions>
    </Dialog>
  );
}
