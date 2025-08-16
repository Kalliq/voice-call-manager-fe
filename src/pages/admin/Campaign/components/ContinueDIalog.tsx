import {
  Button,
  Chip,
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
import { TelephonyConnection } from "voice-javascript-common";

import { CustomTextField } from "../../../../components/UI";
import { CallSession } from "../../../../types/contact";
import { transformToSnakeCase } from "../../../../utils/transformCase";

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
  setIsCampaignFinished: React.Dispatch<React.SetStateAction<boolean>>;
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
  defaultDisposition: string;
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
  setIsCampaignFinished,
  setShowContinueDialog,
  setContactNotes,
  maybeProceedWithNextBatch,
  handleResult,
  isCampaign,
  mode,
  defaultDisposition,
}: ContinueDialogInterface) => {
  const saveHandler = async (stopAfter = false) => {
    await Promise.all(
      currentBatch.map((c) => {
        const result =
          selectedResults[c.id] ||
          (c.id !== answeredSessionId ? defaultDisposition : "");
        return handleResult(c, result);
      })
    );
    setPendingResultContacts([]);
    setSelectedResults({});
    setShowContinueDialog(false);

    if (stopAfter) {
      setIsCampaignFinished(true);
    }
  };

  return (
    <Dialog
      open={showContinueDialog}
      onClose={(event, reason) => {
        if (reason === "backdropClick") {
          return; // Ignore backdrop clicks
        }
        handleDialogClose();
      }}
    >
      <DialogTitle>Save Dispositions</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {currentBatch.map((contact) => {
            const isAnswered = contact.id === answeredSessionId;
            const isPower = mode === TelephonyConnection.SOFT_CALL;

            const defaultDispositionFormatted = callResults.find(
              (cr) => transformToSnakeCase(cr.label) === defaultDisposition
            );
            const valueForSelect = isAnswered
              ? selectedResults[contact.id] || ""
              : defaultDispositionFormatted?.label;

            return (
              <Card key={contact.id} variant="outlined" sx={{ my: 1 }}>
                <CardContent>
                  <Typography variant="h6">
                    {contact.first_name} {contact.last_name}
                  </Typography>
                  <Typography variant="body2">{contact.phone}</Typography>

                  <Select
                    value={valueForSelect}
                    onChange={(e) =>
                      setSelectedResults((prev) => ({
                        ...prev,
                        [contact.id]: e.target.value as string,
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
                  {!isAnswered && !isPower && (
                    <Chip
                      label="auto-dropped"
                      size="small"
                      sx={{
                        mt: 1,
                        px: 1.25,
                        borderRadius: "16px",
                        bgcolor: "rgba(244, 67, 54, 0.12)",
                        color: "error.main",
                        fontWeight: 600,
                      }}
                    />
                  )}
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
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={() => {
            saveHandler(false);
            maybeProceedWithNextBatch();
          }}
        >
          {isCampaign ? "Save and continue" : "Save"}
        </Button>
        {isCampaign && (
          <Button variant="contained" onClick={() => saveHandler(true)}>
            Save and stop
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ContinueDialog;
