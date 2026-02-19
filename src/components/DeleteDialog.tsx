import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

const DeleteDialog = ({
  open,
  title,
  text,
  onClose,
  onConfirm,
  confirmDisabled = false,
}: any) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography>{text}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={confirmDisabled}>
        Cancel
      </Button>
      <Button onClick={onConfirm} disabled={confirmDisabled} autoFocus>
        Confirm
      </Button>
    </DialogActions>
  </Dialog>
);

export { DeleteDialog };
