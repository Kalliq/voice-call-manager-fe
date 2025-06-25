import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import PhoneDisabledIcon from "@mui/icons-material/PhoneDisabled";
import CallEndIcon from "@mui/icons-material/CallEnd";

interface InboundCallDialogProps {
  open: boolean;
  from: string;
  accepted: boolean;
  onAccept: () => void;
  onReject: () => void;
  onHangUp: () => void;
}

export const InboundCallDialog = ({
  open,
  from,
  accepted,
  onAccept,
  onReject,
  onHangUp,
}: InboundCallDialogProps) => {
  return (
    <Dialog open={open} onClose={onReject}>
      <DialogTitle>Incoming Call</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h5">{from || "Unknown number"}</Typography>
          {!accepted && <Typography variant="subtitle2">Ringing…</Typography>}
          {accepted && <Typography variant="subtitle2">On the line</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", p: 2 }}>
        {!accepted ? (
          <>
            <Button
              startIcon={<PhoneInTalkIcon />}
              variant="contained"
              color="success"
              onClick={onAccept}
            >
              Accept
            </Button>

            <Button
              startIcon={<PhoneDisabledIcon />}
              variant="outlined"
              color="error"
              onClick={onReject}
            >
              Reject
            </Button>
          </>
        ) : (
          <Button
            startIcon={<CallEndIcon />}
            variant="contained"
            color="error"
            onClick={onHangUp}
          >
            Hang up
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
