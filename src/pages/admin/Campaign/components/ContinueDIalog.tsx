import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";

import { CustomTextField } from "../../../../components/UI";
import { CallSession } from "../../../../types/contact";

interface ContinueDialogInterface {
  callResults: { label: string }[];
  contactNotes: { [key: string]: string };
  currentBatch: CallSession[];
  pendingResultContacts: CallSession[];
  showContinueDialog: boolean;
  selectedResults: { [key: string]: string };
  handleDialogClose: () => void;
  setSelectedResults: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  setPendingResultContacts: React.Dispatch<React.SetStateAction<CallSession[]>>;
  setShowContinueDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setContactNotes: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  maybeProceedWithNextBatch: () => void;
  handleStopAndSkip: () => void;
  handleResult: (
    c: CallSession,
    selectedResult: string
  ) => Promise<void> | void;
  isCampaign: boolean;
}

const ContinueDialog = ({
  callResults,
  contactNotes,
  currentBatch,
  pendingResultContacts,
  selectedResults,
  showContinueDialog,
  handleDialogClose,
  setSelectedResults,
  setPendingResultContacts,
  setShowContinueDialog,
  setContactNotes,
  maybeProceedWithNextBatch,
  handleStopAndSkip,
  handleResult,
  isCampaign,
}: ContinueDialogInterface) => {
  return (
    <Dialog open={showContinueDialog} onClose={handleDialogClose}>
      <DialogTitle>Call Results</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {currentBatch.map((contact) => (
            <Card key={contact.id} variant="outlined" sx={{ my: 1 }}>
              <CardContent>
                <Typography variant="h6">
                  {contact.first_name} {contact.last_name}
                </Typography>
                <Typography variant="body2">{contact.phone}</Typography>
                <Select
                  value={selectedResults[contact.id] || ""}
                  onChange={(e) =>
                    setSelectedResults((prev) => ({
                      ...prev,
                      [contact.id]: e.target.value,
                    }))
                  }
                  displayEmpty
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  <MenuItem value="" disabled>
                    Select result
                  </MenuItem>
                  {callResults.map((callResult) => (
                    <MenuItem key={callResult.label} value={callResult.label}>
                      {callResult.label}
                    </MenuItem>
                  ))}
                </Select>
                <Typography>Short description</Typography>
                <CustomTextField
                  value={contactNotes[contact.id] || ""}
                  onChange={(e) =>
                    setContactNotes((prev) => ({
                      ...prev,
                      [contact.id]: e.target.value,
                    }))
                  }
                />
              </CardContent>
            </Card>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={async () => {
            await Promise.all(
              currentBatch.map((c) => {
                handleResult(c, selectedResults[c.id]);
              })
            );
            setPendingResultContacts([]);
            setSelectedResults({});
            setShowContinueDialog(false);
            maybeProceedWithNextBatch();
          }}
          disabled={
            pendingResultContacts.length === 0 ||
            pendingResultContacts.some((c) => !selectedResults[c.id])
          }
        >
          Save and continue
        </Button>
        <Button onClick={handleStopAndSkip} color="error" variant="outlined">
          {isCampaign ? "Stop campaign" : "Skip without save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContinueDialog;
