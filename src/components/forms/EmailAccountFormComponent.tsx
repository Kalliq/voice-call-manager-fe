import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "../../hooks/useSnackbar";
import cfg from "../../config";
import { useGetGmailStatus } from "../../queries/email";
import { useDisconnectGmail } from "../../mutations/email";
import { GET_GMAIL_STATUS_KEY } from "../../queries/constants";

const EmailAccountFormComponent = () => {
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [emailProvider, setEmailProvider] = useState("gmail");

  const { enqueue } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: gmailStatus, isLoading: loadingStatus } = useGetGmailStatus();
  const { mutateAsync: disconnectGmailMutation, isPending: disconnecting } = useDisconnectGmail();

  // Track if we've already shown OAuth success message
  const oauthSuccessShownRef = useRef(false);
  const prevConnectedRef = useRef<boolean | undefined>(undefined);

  // Refetch status when window regains focus (handles OAuth return)
  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: GET_GMAIL_STATUS_KEY });
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [queryClient]);

  // Handle OAuth return URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gmailError = params.get("gmail_error");
    const gmailSuccess = params.get("gmail_success");

    if (gmailSuccess === "true") {
      // Refetch status to get updated connection state
      queryClient.invalidateQueries({ queryKey: GET_GMAIL_STATUS_KEY });
      // Clean URL
      navigate(location.pathname, { replace: true });
    } else if (gmailError) {
      let errorMessage = "Failed to connect Gmail";
      if (gmailError === "cancelled") {
        errorMessage = "Gmail connection was cancelled";
      } else if (gmailError === "missing_code") {
        errorMessage = "Gmail connection failed: Missing authorization code";
      } else if (gmailError === "invalid_state") {
        errorMessage = "Gmail connection failed: Invalid session";
      } else {
        try {
          errorMessage = decodeURIComponent(gmailError);
        } catch {
          errorMessage = `Gmail connection failed: ${gmailError}`;
        }
      }
      enqueue(errorMessage, { variant: "error" });
      // Refetch status to ensure UI reflects backend state
      queryClient.invalidateQueries({ queryKey: GET_GMAIL_STATUS_KEY });
      // Clean URL
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate, location.pathname, enqueue, queryClient]);

  // Show success message if Gmail was just connected (OAuth return)
  useEffect(() => {
    if (!gmailStatus) return;

    const wasConnected = prevConnectedRef.current;
    const isNowConnected = gmailStatus.connected;

    if (
      wasConnected === false &&
      isNowConnected &&
      !oauthSuccessShownRef.current &&
      !new URLSearchParams(location.search).get("gmail_success")
    ) {
      enqueue("Gmail connected successfully", { variant: "success" });
      oauthSuccessShownRef.current = true;
    }

    // Reset success message ref if disconnected
    if (!isNowConnected) {
      oauthSuccessShownRef.current = false;
    }

    prevConnectedRef.current = isNowConnected;
  }, [gmailStatus, enqueue, location.search]);

  const handleConnectGmail = () => {
    // Use full-page redirect (not popup) to avoid popup blockers
    // Backend will handle OAuth flow and redirect back
    try {
      window.location.href = `${cfg.backendUrl}/api/auth/google`;
    } catch (error) {
      console.error("Failed to redirect to OAuth:", error);
      enqueue("Failed to start Gmail connection. Please try again.", {
        variant: "error",
      });
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      await disconnectGmailMutation();
      enqueue("Gmail disconnected successfully", { variant: "success" });
      setDisconnectDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to disconnect Gmail:", error);
      enqueue(
        error.response?.data?.message || "Failed to disconnect Gmail",
        { variant: "error" }
      );
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Accounts
        </Typography>

        <Stack spacing={3}>
          {/* Email Account */}
          <TextField
            value={gmailStatus?.emailAddress || ""}
            placeholder={gmailStatus?.connected ? "Connected email" : "Not connected"}
            disabled
            label="Email Account"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {/* Email Provider */}
          <FormControl fullWidth>
            <InputLabel>Email Provider</InputLabel>
            <Select
              value={emailProvider}
              onChange={(e) => setEmailProvider(e.target.value)}
              label="Email Provider"
              disabled
            >
              <MenuItem value="gmail">Gmail</MenuItem>
            </Select>
          </FormControl>

          {/* Connection Status */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              backgroundColor: gmailStatus?.connected
                ? "success.light"
                : "error.light",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {loadingStatus ? (
              <CircularProgress size={20} />
            ) : gmailStatus?.connected ? (
              <>
                <CheckCircle color="success" />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Connected as {gmailStatus.emailAddress || "unknown"}
                </Typography>
              </>
            ) : (
              <>
                <Cancel color="error" />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Not connected
                </Typography>
              </>
            )}
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {gmailStatus?.connected ? (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDisconnectDialogOpen(true)}
                disabled={disconnecting}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleConnectGmail}
                disabled={loadingStatus}
              >
                Connect Gmail
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={disconnectDialogOpen}
        onClose={() => !disconnecting && setDisconnectDialogOpen(false)}
      >
        <DialogTitle>Disconnect Gmail?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to disconnect your Gmail account? You will no longer be able to send emails or view replies until you reconnect.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDisconnectDialogOpen(false)}
            disabled={disconnecting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDisconnectGmail}
            color="error"
            variant="contained"
            disabled={disconnecting}
            startIcon={disconnecting ? <CircularProgress size={16} /> : null}
          >
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailAccountFormComponent;
