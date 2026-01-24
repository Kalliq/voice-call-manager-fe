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

interface AssignNumbersDialogProps {
  open: boolean;
  onClose: () => void;
  userEmail: string | null;
  numbers: any[];
  selectedNumbers: string[];
  onNumbersChange: (numbers: string[]) => void;
  onAssign: () => void;
}

export default function AssignNumbersDialog({
  open,
  onClose,
  userEmail,
  numbers,
  selectedNumbers,
  onNumbersChange,
  onAssign,
}: AssignNumbersDialogProps) {
  const availableNumbers = numbers.filter((n) => !n.assigned || n.released);

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
          </Typography>
          <Autocomplete
            multiple
            options={availableNumbers}
            getOptionLabel={(option) => option.number || String(option)}
            value={numbers.filter((n) =>
              selectedNumbers.includes(n.number || String(n))
            )}
            onChange={(_, newValue) => {
              onNumbersChange(
                newValue.map((n) => n.number || String(n)).filter(Boolean)
              );
            }}
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
          disabled={selectedNumbers.length === 0}
        >
          Assign Numbers
        </Button>
      </DialogActions>
    </Dialog>
  );
}
