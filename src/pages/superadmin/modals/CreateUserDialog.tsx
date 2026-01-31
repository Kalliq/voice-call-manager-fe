import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  tenantName: string;
  email: string;
  password: string;
  adminId: string;
  adminUsers: any[];
  error?: string | null;
  onErrorClear?: () => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onAdminIdChange: (adminId: string) => void;
  onCreate: () => void;
}

export default function CreateUserDialog({
  open,
  onClose,
  tenantName,
  email,
  password,
  adminId,
  adminUsers,
  error,
  onErrorClear,
  onEmailChange,
  onPasswordChange,
  onAdminIdChange,
  onCreate,
}: CreateUserDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create User for {tenantName}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && (
            <Alert severity="error" onClose={onErrorClear}>
              {error}
            </Alert>
          )}
          <TextField
            label="Email"
            fullWidth
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel>Assign to Admin</InputLabel>
            <Select
              value={adminId}
              label="Assign to Admin"
              onChange={(e) => onAdminIdChange(e.target.value)}
            >
              {adminUsers.map((admin) => (
                <MenuItem key={admin.id} value={admin.id}>
                  {admin.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onCreate}
          disabled={!email || !password || !adminId}
        >
          Create User
        </Button>
      </DialogActions>
    </Dialog>
  );
}
