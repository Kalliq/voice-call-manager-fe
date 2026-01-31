import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Autocomplete,
  Chip,
} from "@mui/material";

interface AssignAdminUsersDialogProps {
  open: boolean;
  onClose: () => void;
  tenantName: string;
  allAdmins: any[];
  selectedAdminUsers: string[];
  onAdminUsersChange: (adminIds: string[]) => void;
  onAssign: () => void;
}

export default function AssignAdminUsersDialog({
  open,
  onClose,
  tenantName,
  allAdmins,
  selectedAdminUsers,
  onAdminUsersChange,
  onAssign,
}: AssignAdminUsersDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Admin Users to {tenantName}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} mt={1}>
          <Autocomplete
            multiple
            options={allAdmins}
            getOptionLabel={(option) => option.email}
            value={allAdmins.filter((u) => selectedAdminUsers.includes(u.id))}
            onChange={(_, newValue) => {
              onAdminUsersChange(newValue.map((u) => u.id));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Admin Users" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.email}
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onAssign}>
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
