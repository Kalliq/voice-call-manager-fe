import { useEffect, useState, useMemo } from "react";
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

  const { settings } = useAppStore((s) => s);
  const callResults: CallResult[] =
    (settings?.["Phone Settings"]?.callResults as CallResult[]) ?? [];
  
  const userTimeZone = settings?.["General Settings"]?.timezone as string | undefined;
  const { enqueue } = useSnackbar();

  useEffect(() => {
    const fetchCallLogs = async () => {
      const callLogs = await api.get("/call-logs", {
        params: { contactId: contact.id },
      });

      setCallLogs(callLogs.data.recordings);
    };

    fetchCallLogs();
  }, []);

  // Fetch Gmail status when Email tab is opened
  useEffect(() => {
    if (tabIndex === 2) {
      fetchGmailStatus();
      fetchEmailReplies();
    }
  }, [tabIndex, contact.id]);

  const fetchGmailStatus = async () => {
    setLoadingStatus(true);
    try {
      const response = await api.get<GmailStatus>("/email/gmail/status");
      setGmailStatus(response.data);
    } catch (error: any) {
      console.error("Failed to fetch Gmail status:", error);
      setGmailStatus({ connected: false });
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchEmailReplies = async () => {
    if (!contact.id) return;
    setLoadingReplies(true);
    try {
      const response = await api.get<EmailReply[]>("/email/gmail/replies", {
        params: { contactId: contact.id },
      });
      setEmailReplies(response.data);
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Gmail not connected - this is expected, don't show error
        setEmailReplies([]);
      } else {
        console.error("Failed to fetch email replies:", error);
        enqueue("Failed to load email replies", { variant: "error" });
      }
    } finally {
      setLoadingReplies(false);
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
        enqueue("Gmail is not connected. Please connect your Gmail account.", {
          variant: "error",
        });
        fetchGmailStatus(); // Refresh status
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
                <Typography variant="body2">
                  Gmail connected as {gmailStatus.emailAddress || "unknown"}
                </Typography>
              </>
            ) : (
              <>
                <Cancel color="error" />
                <Typography variant="body2">Gmail not connected</Typography>
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
    </Paper>
  );
};

export default ContactOverview;
