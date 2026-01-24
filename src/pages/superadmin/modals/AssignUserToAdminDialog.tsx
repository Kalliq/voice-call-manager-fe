import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

interface AssignUserToAdminDialogProps {
  open: boolean;
  onClose: () => void;
  user: any | null;
  adminUsers: any[];
  selectedAdminId: string;
  onAdminIdChange: (adminId: string) => void;
  onAssign: () => void;
}

export default function AssignUserToAdminDialog({
  open,
  onClose,
  user,
  adminUsers,
  selectedAdminId,
  onAdminIdChange,
  onAssign,
}: AssignUserToAdminDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Assign User to Admin
        {user && ` - ${user.email}`}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography variant="body2" color="text.secondary">
            Select an admin to assign this user to. The user will be associated
            with the selected admin's tenant.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Select Admin</InputLabel>
            <Select
              value={selectedAdminId}
              label="Select Admin"
              onChange={(e) => onAdminIdChange(e.target.value)}
            >
              {adminUsers.map((admin) => (
                <MenuItem key={admin.id} value={admin.id}>
                  {admin.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {user?.adminEmail && (
            <Typography variant="body2" color="text.secondary">
              Currently assigned to: <strong>{user.adminEmail}</strong>
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onAssign}
          disabled={!selectedAdminId}
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
