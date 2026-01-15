import { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Business,
  Person,
  Phone,
  Email as EmailIcon,
  LinkedIn,
  LocationOn,
  AccessTime,
  Title,
  InsertDriveFile,
  Send,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import { CallLog } from "voice-javascript-common";

import useAppStore from "../../../../store/useAppStore";
import { CallResult } from "../../../../types/call-results";
import api from "../../../../utils/axiosInstance";
import { useSnackbar } from "../../../../hooks/useSnackbar";
import cfg from "../../../../config";

import ActivityRow from "./molecules/ActivityRow";

import { Contact } from "../../../../types/contact";
import { EditableFieldItem } from "../../../../components/atoms/EditableFieldItem";
import { formatContactLocalTime } from "../../../../utils/formatContactLocalTime";

interface ContactOverviewProps {
  contact: Contact;
  onUpdate?: (field: string, value: string) => Promise<void>;
}

interface GmailStatus {
  connected: boolean;
  emailAddress?: string;
}

interface EmailReply {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
}

const ContactOverview = ({ contact, onUpdate }: ContactOverviewProps) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [now, setNow] = useState(new Date());
  const [isTimezoneHovered, setIsTimezoneHovered] = useState(false);
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);

  // Email state
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [emailReplies, setEmailReplies] = useState<EmailReply[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const { settings } = useAppStore((s) => s);
  const callResults: CallResult[] =
    (settings?.["Phone Settings"]?.callResults as CallResult[]) ?? [];
  
  const userTimeZone = settings?.["General Settings"]?.timezone as string | undefined;
  const { enqueue } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCallLogs = async () => {
      const callLogs = await api.get("/call-logs", {
        params: { contactId: contact.id },
      });

      setCallLogs(callLogs.data.recordings);
    };

    fetchCallLogs();
  }, []);

  // Track if we've already shown OAuth success message
  const oauthSuccessShownRef = useRef(false);

  // Fetch Gmail status when Email tab is opened
  useEffect(() => {
    if (tabIndex === 2) {
      // Always refetch status when tab opens (handles OAuth return)
      fetchGmailStatus();
    }
  }, [tabIndex, contact.id]);

  // Refetch status when window regains focus (handles OAuth return)
  useEffect(() => {
    if (tabIndex !== 2) return;

    const handleFocus = () => {
      // Refetch status when window regains focus (user might have returned from OAuth)
      fetchGmailStatus();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [tabIndex]);

  // Handle OAuth return URL parameters (if user navigates to Contact page after OAuth)
  useEffect(() => {
    if (tabIndex !== 2) return;

    const params = new URLSearchParams(location.search);
    const gmailError = params.get("gmail_error");
    const gmailSuccess = params.get("gmail_success");

    if (gmailSuccess === "true") {
      // Refetch status to get updated connection state
      fetchGmailStatus();
      // Clean URL
      navigate(location.pathname + location.hash, { replace: true });
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
      fetchGmailStatus();
      // Clean URL
      navigate(location.pathname + location.hash, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabIndex, location.search]);

  // Fetch replies after status is loaded (only if connected)
  useEffect(() => {
    if (tabIndex === 2 && gmailStatus?.connected && contact.id) {
      // Only fetch if we have a valid status and it's connected
      fetchEmailReplies();
    } else if (tabIndex === 2 && gmailStatus?.connected === false) {
      // Clear replies if disconnected
      setEmailReplies([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabIndex, gmailStatus?.connected, contact.id]);

  const fetchGmailStatus = async () => {
    setLoadingStatus(true);
    try {
      const response = await api.get<GmailStatus>("/email/gmail/status");
      const wasConnected = gmailStatus?.connected;
      const isNowConnected = response.data.connected;

      setGmailStatus(response.data);

      // Show success message if Gmail was just connected (OAuth return)
      // Only show if not already shown and not triggered by URL param (URL param handler shows its own message)
      if (
        !wasConnected &&
        isNowConnected &&
        !oauthSuccessShownRef.current &&
        !new URLSearchParams(location.search).get("gmail_success")
      ) {
        enqueue("Gmail connected successfully", { variant: "success" });
        oauthSuccessShownRef.current = true;
      }

      // Reset success message ref if disconnected (allows showing message again on reconnect)
      if (!isNowConnected) {
        oauthSuccessShownRef.current = false;
      }
    } catch (error: any) {
      console.error("Failed to fetch Gmail status:", error);
      setGmailStatus({ connected: false });
      
      // Show error if it's not a 409 (which is expected when not connected)
      if (error.response?.status !== 409) {
        enqueue("Failed to check Gmail connection status", { variant: "error" });
      }
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchEmailReplies = async () => {
    if (!contact.id) return;
    // Note: gmailStatus?.connected check is handled by useEffect dependency
    setLoadingReplies(true);
    try {
      const response = await api.get<EmailReply[]>("/email/gmail/replies", {
        params: { contactId: contact.id },
      });
      setEmailReplies(response.data);
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Gmail not connected - check if it was revoked externally
        const errorMessage = error.response?.data?.message;
        if (errorMessage?.includes("revoked")) {
          enqueue(
            "Gmail access has been revoked. Please reconnect your Gmail account.",
            { variant: "error" }
          );
          // Refresh status to reflect revoked state
          fetchGmailStatus();
        }
        setEmailReplies([]);
      } else {
        console.error("Failed to fetch email replies:", error);
        enqueue("Failed to load email replies", { variant: "error" });
      }
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleDisconnectGmail = async () => {
    setDisconnecting(true);
    try {
      await api.delete("/email/gmail/disconnect");
      enqueue("Gmail disconnected successfully", { variant: "success" });
      setDisconnectDialogOpen(false);
      
      // Refresh status to reflect disconnected state
      await fetchGmailStatus();
      // Clear replies
      setEmailReplies([]);
    } catch (error: any) {
      console.error("Failed to disconnect Gmail:", error);
      enqueue(
        error.response?.data?.message || "Failed to disconnect Gmail",
        { variant: "error" }
      );
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!contact.id || !emailSubject.trim() || !emailBody.trim()) {
      enqueue("Subject and body are required", { variant: "warning" });
      return;
    }

    setSendingEmail(true);
    try {
      const response = await api.post("/email/gmail/send", {
        contactId: contact.id,
        subject: emailSubject.trim(),
        body: emailBody.trim(),
      });

      enqueue("Email sent successfully", { variant: "success" });
      setEmailSubject("");
      setEmailBody("");
      
      // Refresh replies after sending
      await fetchEmailReplies();
    } catch (error: any) {
      if (error.response?.status === 409) {
        const errorMessage =
          error.response?.data?.message ||
          "Gmail is not connected. Please connect your Gmail account.";
        enqueue(errorMessage, {
          variant: "error",
        });
        // Refresh status to reflect backend state (might be revoked externally)
        fetchGmailStatus();
      } else {
        enqueue(
          error.response?.data?.message || "Failed to send email",
          { variant: "error" }
        );
      }
    } finally {
      setSendingEmail(false);
    }
  };

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const localTimeDisplay = formatContactLocalTime(
    contact.timezone,
    userTimeZone,
    now
  );
  const showTimezoneSelect = isTimezoneHovered || isTimezoneOpen;

  const visibleCallLogs = useMemo(
    () => callLogs.filter((l) => !!l.action?.result?.trim()),
    [callLogs]
  );

  const handleResultChange = (sid: string, result: string) => {
    setCallLogs((prev) =>
      prev.map((cl) =>
        cl.sid === sid
          ? {
              ...cl,
              action: {
                ...(cl.action ?? { result: "", notes: "", timestamp: "" }),
                result,
              },
            }
          : cl
      )
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        p: 2,
        mt: 2,
        backgroundColor: "#fff",
        boxShadow: 0,
      }}
    >
      {/* Tabs Header */}
      <Tabs
        value={tabIndex}
        onChange={(_, val) => setTabIndex(val)}
        sx={{ mb: 3 }}
      >
        <Tab
          label="Prospect Fields"
          sx={{
            fontWeight: 600,
            color: tabIndex === 0 ? "#0f59ff" : "text.secondary",
          }}
        />
        <Tab
          label="Activity History"
          sx={{
            fontWeight: 600,
            color: tabIndex === 1 ? "#0f59ff" : "text.secondary",
          }}
        />
        <Tab
          label="Email"
          sx={{
            fontWeight: 600,
            color: tabIndex === 2 ? "#0f59ff" : "text.secondary",
          }}
        />
      </Tabs>

      {/* Tab Content */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          {/* Left */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <EditableFieldItem
                icon={<Business color="primary" />}
                label="Account Name"
                value={contact.accountName || ""}
                onSave={onUpdate ? (value) => onUpdate("accountName", value) : undefined}
              />
              <EditableFieldItem
                icon={<Title color="primary" />}
                label="Title"
                value={contact.title || contact.capacity || ""}
                onSave={onUpdate ? (value) => onUpdate("title", value) : undefined}
              />
              <EditableFieldItem
                icon={<EmailIcon color="primary" />}
                label="Email"
                value={contact.email || ""}
                onSave={onUpdate ? (value) => onUpdate("email", value) : undefined}
              />
              <EditableFieldItem
                icon={<Phone color="primary" />}
                label="Direct Phone"
                value={contact.phone || ""}
                onSave={onUpdate ? (value) => onUpdate("phone", value) : undefined}
              />
              <EditableFieldItem
                icon={<LocationOn color="primary" />}
                label="City"
                value={contact.city || ""}
                onSave={onUpdate ? (value) => onUpdate("city", value) : undefined}
              />
              <EditableFieldItem
                icon={<InsertDriveFile color="primary" />}
                label="Record Type"
                value={contact.recordType || ""}
                onSave={onUpdate ? (value) => onUpdate("recordType", value) : undefined}
              />
            </Stack>
          </Grid>

          {/* Right */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <EditableFieldItem
                icon={<Person color="primary" />}
                label="Contact Name"
                value={`${contact.first_name} ${contact.last_name}`}
                onSave={onUpdate ? async (value) => {
                  const parts = value.trim().split(/\s+/);
                  const firstName = parts[0] || "";
                  const lastName = parts.slice(1).join(" ") || "";
                  await onUpdate("first_name", firstName);
                  if (lastName || !contact.last_name) {
                    await onUpdate("last_name", lastName);
                  }
                } : undefined}
              />
              <EditableFieldItem
                icon={<Phone color="primary" />}
                label="Phone"
                value={contact.phone || ""}
                onSave={onUpdate ? (value) => onUpdate("phone", value) : undefined}
              />
              <EditableFieldItem
                icon={<LinkedIn color="primary" />}
                label="LinkedIn URL"
                value={contact.linkedIn || ""}
                onSave={onUpdate ? (value) => onUpdate("linkedIn", value) : undefined}
              />
              <Box
                display="flex"
                alignItems="center"
                sx={{ py: 1 }}
                onMouseEnter={() => setIsTimezoneHovered(true)}
                onMouseLeave={() => {
                  if (!isTimezoneOpen) {
                    setIsTimezoneHovered(false);
                  }
                }}
              >
                <AccessTime
                  color="primary"
                  sx={{ mr: 1, fontSize: 20, cursor: "pointer" }}
                  onClick={() => setIsTimezoneOpen(true)}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography fontSize={13} fontWeight={500} color="text.secondary" sx={{ mb: 0.5 }}>
                    Timezone
                  </Typography>
                  <Box
                    sx={{
                      minHeight: 32,
                      opacity: showTimezoneSelect ? 1 : 0,
                      transition: "opacity 0.2s",
                      pointerEvents: showTimezoneSelect ? "auto" : "none",
                    }}
                    onClick={() => setIsTimezoneOpen(true)}
                  >
                    <FormControl fullWidth size="small">
                      <Select
                        open={isTimezoneOpen}
                        onOpen={() => setIsTimezoneOpen(true)}
                        onClose={() => {
                          setIsTimezoneOpen(false);
                          setIsTimezoneHovered(false);
                        }}
                        value={contact.timezone || ""}
                        onChange={(e) => {
                          if (onUpdate) {
                            onUpdate("timezone", e.target.value);
                          }
                        }}
                        displayEmpty
                        sx={{
                          fontSize: 13,
                          "& .MuiSelect-select": {
                            py: 0.5,
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        <MenuItem value="America/New_York">Eastern (New York)</MenuItem>
                        <MenuItem value="America/Chicago">Central (Chicago)</MenuItem>
                        <MenuItem value="America/Denver">Mountain (Denver)</MenuItem>
                        <MenuItem value="America/Phoenix">Mountain (Phoenix)</MenuItem>
                        <MenuItem value="America/Los_Angeles">Pacific (Los Angeles)</MenuItem>
                        <MenuItem value="America/Anchorage">Alaska (Anchorage)</MenuItem>
                        <MenuItem value="Pacific/Honolulu">Hawaii (Honolulu)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Box>
              <EditableFieldItem
                icon={<LocationOn color="primary" />}
                label="State"
                value={contact.state || ""}
                onSave={onUpdate ? (value) => onUpdate("state", value) : undefined}
              />
              <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
                <AccessTime color="primary" sx={{ fontSize: 20 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography fontSize={13} fontWeight={500} color="text.secondary">
                    Local Time
                  </Typography>
                  <Typography fontSize={13} sx={{ mt: 0.5 }}>
                    {localTimeDisplay || "—"}
                  </Typography>
                </Box>
              </Stack>
              {contact.subject && (
                <EditableFieldItem
                  icon={<InsertDriveFile color="primary" />}
                  label={contact.subject}
                  value=""
                />
              )}
            </Stack>
          </Grid>
        </Grid>
      )}
      {tabIndex === 1 && (
        <Box px={2}>
          {visibleCallLogs.length > 0 ? (
            <Stack spacing={2}>
              {visibleCallLogs.map((callLog) => (
                <ActivityRow
                  key={callLog.sid}
                  entry={callLog}
                  callResults={callResults}
                  onResultChange={handleResultChange}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No activity history available yet.
            </Typography>
          )}
        </Box>
      )}
      {tabIndex === 2 && (
        // Email Tab
        <Box px={2} py={2}>
          {/* Gmail Connection Status */}
          <Box
            sx={{
              mb: 3,
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
                  Gmail connected as {gmailStatus.emailAddress || "unknown"}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setDisconnectDialogOpen(true)}
                  disabled={disconnecting}
                >
                  Disconnect Gmail
                </Button>
              </>
            ) : (
              <>
                <Cancel color="error" />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Gmail not connected
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => {
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
                  }}
                >
                  Connect Gmail
                </Button>
              </>
            )}
          </Box>

          {/* Compose Email */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: gmailStatus?.connected ? "#fff" : "action.disabledBackground",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Send Email
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                fullWidth
                size="small"
                disabled={!gmailStatus?.connected || sendingEmail}
              />
              <TextField
                label="Message"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                fullWidth
                multiline
                rows={4}
                size="small"
                disabled={!gmailStatus?.connected || sendingEmail}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={sendingEmail ? <CircularProgress size={16} /> : <Send />}
                  onClick={handleSendEmail}
                  disabled={
                    !gmailStatus?.connected ||
                    sendingEmail ||
                    !emailSubject.trim() ||
                    !emailBody.trim()
                  }
                >
                  {sendingEmail ? "Sending..." : "Send"}
                </Button>
              </Box>
            </Stack>
          </Paper>

          {/* Email Replies */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Email Replies
            </Typography>
            {loadingReplies ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : !gmailStatus?.connected ? (
              <Typography variant="body2" color="text.secondary">
                Connect Gmail to view email replies
              </Typography>
            ) : emailReplies.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No email replies yet
              </Typography>
            ) : (
              <Stack spacing={2}>
                {emailReplies.map((reply) => (
                  <Box
                    key={reply.id}
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {reply.subject || "(No subject)"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(reply.date).toLocaleString()}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                      From: {reply.from} | To: {reply.to}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {reply.snippet || "(No preview available)"}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Box>
      )}

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
    </Paper>
  );
};

export default ContactOverview;
