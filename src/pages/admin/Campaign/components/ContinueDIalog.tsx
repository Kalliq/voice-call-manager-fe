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
  answeredSessionId: string | null;
  mode: string;
}

const ContinueDialog = ({
  callResults,
  contactNotes,
  currentBatch,
  pendingResultContacts,
  selectedResults,
  showContinueDialog,
  answeredSessionId,
  handleDialogClose,
  setSelectedResults,
  setPendingResultContacts,
  setShowContinueDialog,
  setContactNotes,
  maybeProceedWithNextBatch,
  handleStopAndSkip,
  handleResult,
  isCampaign,
  mode,
}: ContinueDialogInterface) => {
  const saveHandler = async () => {
    await Promise.all(
      currentBatch.map((c) => {
        const result =
          selectedResults[c.id] ||
          (c.id !== answeredSessionId ? "No Answer" : "");
        return handleResult(c, result);
      })
    );
    setPendingResultContacts([]);
    setSelectedResults({});
    setShowContinueDialog(false);
  };

  return (
    <Dialog open={showContinueDialog} onClose={handleDialogClose}>
      <DialogTitle>Call Results</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {currentBatch.map((contact) => {
            const isAnswered = contact.id === answeredSessionId;
            return (
              <>
                {isAnswered ? (
                  <Card key={contact.id} variant="outlined" sx={{ my: 1 }}>
                    <CardContent>
                      <Typography variant="h6">
                        {contact.first_name} {contact.last_name}
                      </Typography>
                      <Typography variant="body2">{contact.phone}</Typography>

                      <Select
                        value={
                          selectedResults[contact.id] ||
                          (isAnswered ? "" : "No Answer")
                        }
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
                          <MenuItem
                            key={callResult.label}
                            value={callResult.label}
                          >
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
                ) : (
                  <Typography>Dispositions saved automatically!</Typography>
                )}
              </>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={() => {
            saveHandler();
            maybeProceedWithNextBatch();
          }}
        >
          {answeredSessionId ? "Save and continue" : "Continue"}
        </Button>
        {mode !== "Soft call" && (
          <Button variant="contained" onClick={() => saveHandler()}>
            Save and stop
          </Button>
        )}

        <Button onClick={handleStopAndSkip} color="error" variant="outlined">
          {isCampaign ? "Stop campaign" : "Skip without save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContinueDialog;
