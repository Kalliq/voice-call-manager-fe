import { useState, useEffect, useRef } from "react";
import RichTextEditor from "./RichTextEditor";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import api from "../utils/axiosInstance";
import { useSnackbar } from "../hooks/useSnackbar";

interface GmailStatus {
  connected: boolean;
  emailAddress?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  type: "Personal" | "Organization";
  subject?: string;
  bodyHtml: string;
}

interface EmailSignature {
  html: string;
}

interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  contactId: string;
  contactEmail: string;
  onSuccess?: () => void;
}

const SendEmailModal = ({
  open,
  onClose,
  contactId,
  contactEmail,
  onSuccess,
}: SendEmailModalProps) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [signature, setSignature] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const signatureAppendedRef = useRef(false);
  const { enqueue } = useSnackbar();

  // Compute readOnly state: only lock when we KNOW Gmail is disconnected or while sending
  // Do NOT lock while loading (gmailStatus === null) - allow editing while status loads
  const isGmailConnected = gmailStatus?.connected === true;
  const shouldLockEditor = sending || (gmailStatus !== null && !isGmailConnected);
  
  // Debug log (remove after verification)
  useEffect(() => {
    if (open) {
      console.log("[SendEmailModal] Render state:", {
        gmailStatus,
        checkingStatus,
        sending,
        isGmailConnected,
        shouldLockEditor,
        readOnly: shouldLockEditor
      });
    }
  }, [open, gmailStatus, checkingStatus, sending, isGmailConnected, shouldLockEditor]);

  // Load templates and signature when modal opens
  useEffect(() => {
    if (open) {
      checkGmailStatus();
      fetchTemplates();
      fetchSignature();
      signatureAppendedRef.current = false;
      // Reset form state when opening
      setSubject("");
      setBody("");
      setSelectedTemplateId("");
    }
  }, [open]);

  // Helper functions for signature handling
  const normalizeText = (s: string) =>
    (s || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const isHtmlEmpty = (html: string) => normalizeText(html) === "";

  const containsSignature = (bodyHtml: string, signatureHtml: string) => {
    const sig = normalizeText(signatureHtml);
    if (!sig) return true;
    return normalizeText(bodyHtml).includes(sig);
  };

  const withSignature = (bodyHtml: string, signatureHtml: string) => {
    if (!signatureHtml || isHtmlEmpty(signatureHtml)) return bodyHtml || "";
    if (containsSignature(bodyHtml || "", signatureHtml)) return bodyHtml || "";
    const spacer = isHtmlEmpty(bodyHtml) ? "" : "<br/><br/>";
    return `${bodyHtml || ""}${spacer}${signatureHtml}`;
  };

  // Auto-append signature when composer opens (only once)
  useEffect(() => {
    if (signatureAppendedRef.current) return;
    if (!signature || isHtmlEmpty(signature)) return;
    if (!isHtmlEmpty(body)) return;

    setBody(withSignature(body, signature));
    signatureAppendedRef.current = true;
  }, [signature, body]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSubject("");
      setBody("");
      setSelectedTemplateId("");
      setSending(false);
      signatureAppendedRef.current = false;
    }
  }, [open]);

  const checkGmailStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await api.get<GmailStatus>("/email/gmail/status");
      setGmailStatus(response.data);
    } catch (error: any) {
      if (error.response?.status === 409) {
        setGmailStatus({ connected: false });
      } else {
        console.error("Failed to check Gmail status:", error);
        setGmailStatus({ connected: false });
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      console.log("[SendEmailModal] Fetching templates from /email/templates");
      const response = await api.get<EmailTemplate[]>("/email/templates");
      console.log("[SendEmailModal] Templates response:", response.data);
      setTemplates(response.data || []);
    } catch (error: any) {
      console.error("[SendEmailModal] Failed to fetch templates:", error);
      console.error("[SendEmailModal] Error details:", error.response?.status, error.response?.data);
      setTemplates([]);
      // Don't show error - templates are optional
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchSignature = async () => {
    try {
      console.log("[SendEmailModal] Fetching signature from /email/signature");
      const response = await api.get<EmailSignature>("/email/signature");
      console.log("[SendEmailModal] Signature response:", response.data);
      setSignature(response.data.html || "");
    } catch (error: any) {
      // No longer expect 404 - endpoint now returns empty string
      console.error("[SendEmailModal] Failed to fetch signature:", error);
      console.error("[SendEmailModal] Error details:", error.response?.status, error.response?.data);
      setSignature("");
    }
  };


  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    if (!templateId) {
      // Clear template - reset body but keep signature if exists
      const clearedBody = withSignature("", signature || "");
      setBody(clearedBody);
      signatureAppendedRef.current = true;
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      return;
    }

    // Apply template
    if (template.subject) {
      setSubject(template.subject);
    }

    // Apply template body with signature appended
    const nextBody = withSignature(template.bodyHtml || "", signature || "");
    setBody(nextBody);
    signatureAppendedRef.current = true;
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    // Reset signature appended flag if user manually edits after template was applied
    if (selectedTemplateId && signatureAppendedRef.current) {
      signatureAppendedRef.current = false;
    }
  };

  const handleSend = async () => {
    if (!contactId || !subject.trim() || !body.trim()) {
      enqueue("Subject and message are required", { variant: "warning" });
      return;
    }

    if (!gmailStatus?.connected) {
      enqueue(
        "Gmail is not connected. Please connect your Gmail account in Settings → Email Settings.",
        { variant: "error" }
      );
      return;
    }

    // Final safety check: ensure signature is appended before send
    const finalBody = withSignature(body, signature || "");

    // Convert HTML to plain text for email (backend expects plain text)
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = finalBody;
    const plainTextBody = tempDiv.textContent || tempDiv.innerText || "";

    setSending(true);
    try {
      await api.post("/email/gmail/send", {
        contactId,
        subject: subject.trim(),
        body: plainTextBody.trim(),
      });

      enqueue("Email sent successfully", { variant: "success" });
      setSubject("");
      setBody("");
      setSelectedTemplateId("");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      if (error.response?.status === 409) {
        enqueue(
          "Gmail is not connected. Please connect your Gmail account in Settings → Email Settings.",
          { variant: "error" }
        );
      } else {
        enqueue(
          error.response?.data?.message || "Failed to send email",
          { variant: "error" }
        );
      }
    } finally {
      setSending(false);
    }
  };

  const canSend = gmailStatus?.connected && !sending && subject.trim() && body.trim();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Send Email</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {checkingStatus ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : !gmailStatus?.connected ? (
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              Gmail is not connected. Please connect your Gmail account in Settings → Email Settings.
            </Typography>
          ) : null}

          {/* Template Selector */}
          <FormControl fullWidth>
            <InputLabel>Select Template (optional)</InputLabel>
            <Select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              label="Select Template (optional)"
              disabled={!gmailStatus?.connected || sending || loadingTemplates}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="To"
            value={contactEmail || ""}
            disabled
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={!gmailStatus?.connected || sending}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Message
            </Typography>
            <Box sx={{ position: "relative" }}>
              <RichTextEditor
                value={body}
                onChange={handleBodyChange}
                readOnly={shouldLockEditor}
                placeholder="Enter your message..."
                minHeight="250px"
                triggerReset={selectedTemplateId || (signature ? `sig-${signature.slice(0, 10)}` : undefined)}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={!canSend}
          startIcon={sending ? <CircularProgress size={16} /> : null}
        >
          {sending ? "Sending..." : "Send"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendEmailModal;
