import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Alert,
} from "@mui/material";

interface CreateAdminDialogProps {
  open: boolean;
  onClose: () => void;
  tenantName: string;
  email: string;
  password: string;
  error?: string | null;
  onErrorClear?: () => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onCreate: () => void;
}

export default function CreateAdminDialog({
  open,
  onClose,
  tenantName,
  email,
  password,
  error,
  onErrorClear,
  onEmailChange,
  onPasswordChange,
  onCreate,
}: CreateAdminDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create Admin User for {tenantName}</DialogTitle>
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
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onCreate}
          disabled={!email || !password}
        >
          Create Admin
        </Button>
      </DialogActions>
    </Dialog>
  );
}
