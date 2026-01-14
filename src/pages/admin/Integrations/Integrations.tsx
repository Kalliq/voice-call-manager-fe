import { useState, useEffect } from "react";
import { Box, Typography, Paper, TextField, Switch, Stack, CircularProgress, FormControlLabel, Checkbox } from "@mui/material";
import api from "../../../utils/axiosInstance";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { SimpleButton } from "../../../components/UI/SimpleButton";
import { useAuth } from "../../../contexts/AuthContext";

const ALLOWED_EVENTS = [
  "contact.created",
  "note.created",
  "integration.test",
] as const;

interface IntegrationConfig {
  aiWebhookUrl: string;
  enabled: boolean;
  hasSecret: boolean;
  events?: string[];
}

const Integrations = () => {
  const { enqueue } = useSnackbar();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "loading" | "success">("idle");
  const [testState, setTestState] = useState<"idle" | "loading">("idle");

  // Form state
  const [webhookUrl, setWebhookUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [events, setEvents] = useState<string[]>([]);

  // Initial values to track dirty state
  const [initialWebhookUrl, setInitialWebhookUrl] = useState("");
  const [initialEnabled, setInitialEnabled] = useState(false);
  const [initialHasSecret, setInitialHasSecret] = useState(false);
  const [initialEvents, setInitialEvents] = useState<string[]>([]);

  // Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<IntegrationConfig>("/integrations/ai");
        setWebhookUrl(data.aiWebhookUrl || "");
        setEnabled(data.enabled || false);
        setSecret(""); // Never display existing secret
        const fetchedEvents = Array.isArray(data.events) ? data.events : [];
        setEvents(fetchedEvents);
        setInitialWebhookUrl(data.aiWebhookUrl || "");
        setInitialEnabled(data.enabled || false);
        setInitialHasSecret(data.hasSecret || false);
        setInitialEvents(fetchedEvents);
      } catch (err: any) {
        console.error("Failed to fetch integration config:", err);
        enqueue("Failed to load integration configuration", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [enqueue]);

  // Check if form is dirty
  const isDirty =
    webhookUrl !== initialWebhookUrl ||
    enabled !== initialEnabled ||
    secret !== "" || // Any non-empty secret is a change
    JSON.stringify([...events].sort()) !== JSON.stringify([...initialEvents].sort());

  const handleSave = async () => {
    if (saveState === "loading") return;
    if (!isDirty) return;

    try {
      setSaveState("loading");

      const updateData: any = {};

      if (webhookUrl !== initialWebhookUrl) {
        updateData.aiWebhookUrl = webhookUrl;
      }

      if (secret !== "") {
        updateData.aiWebhookSecret = secret;
      }

      if (enabled !== initialEnabled) {
        updateData.enabled = enabled;
      }

      // Send events if changed
      if (JSON.stringify([...events].sort()) !== JSON.stringify([...initialEvents].sort())) {
        updateData.events = events;
      }

      const { data } = await api.put<IntegrationConfig>("/integrations/ai", updateData);

      // Update state from response
      setWebhookUrl(data.aiWebhookUrl || "");
      setEnabled(data.enabled || false);
      setSecret(""); // Clear secret field after save
      const savedEvents = Array.isArray(data.events) ? data.events : [];
      setEvents(savedEvents);
      setInitialWebhookUrl(data.aiWebhookUrl || "");
      setInitialEnabled(data.enabled || false);
      setInitialHasSecret(data.hasSecret || false);
      setInitialEvents(savedEvents);

      setSaveState("success");
      enqueue("Integration configuration saved", { variant: "success" });
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err: any) {
      console.error("Failed to save integration config:", err);
      enqueue("Failed to save integration configuration", { variant: "error" });
      setSaveState("idle");
    }
  };

  const handleTest = async () => {
    if (testState === "loading") return;
    if (!webhookUrl || !enabled) {
      enqueue("Webhook URL must be set and integration must be enabled", { variant: "warning" });
      return;
    }

    try {
      setTestState("loading");
      const { data } = await api.post<{ ok?: boolean; success?: boolean; message?: string }>("/integrations/ai/test");

      if (data.ok || data.success) {
        enqueue("Test webhook sent successfully", { variant: "success" });
      } else {
        enqueue(data.message || "Integration not enabled", { variant: "warning" });
      }
    } catch (err: any) {
      console.error("Failed to send test webhook:", err);
      enqueue("Failed to send test webhook", { variant: "error" });
    } finally {
      setTestState("idle");
    }
  };

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Integrations
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Outbound Webhook
        </Typography>
        <Stack spacing={3}>
          <TextField
            label="Webhook URL"
            fullWidth
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            disabled={!isAdmin || saveState === "loading"}
          />
          <TextField
            label="Secret"
            type="password"
            fullWidth
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={initialHasSecret ? "Enter new secret to update" : "Enter secret key"}
            disabled={!isAdmin || saveState === "loading"}
            helperText={initialHasSecret ? "Leave blank to keep existing secret" : ""}
          />
          <Box display="flex" alignItems="center" gap={2}>
            <Typography>Enabled</Typography>
            <Switch
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={!isAdmin || saveState === "loading"}
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Events
            </Typography>
            <Stack spacing={1}>
              {ALLOWED_EVENTS.map((eventType) => (
                <FormControlLabel
                  key={eventType}
                  control={
                    <Checkbox
                      checked={events.includes(eventType)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEvents([...events, eventType]);
                        } else {
                          setEvents(events.filter((e) => e !== eventType));
                        }
                      }}
                      disabled={!isAdmin || saveState === "loading"}
                    />
                  }
                  label={eventType}
                />
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Select which events to send to the webhook endpoint.
            </Typography>
          </Box>
          {!isAdmin && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: -2 }}>
              Only admins can modify integration settings.
            </Typography>
          )}
          {isAdmin && (
            <Box>
              <SimpleButton
                label="Save"
                onClick={handleSave}
                loading={saveState === "loading"}
                success={saveState === "success"}
                disabled={!isDirty || saveState === "loading"}
              />
            </Box>
          )}
          {isAdmin && (
            <Box>
              <SimpleButton
                label="Send test"
                onClick={handleTest}
                loading={testState === "loading"}
                disabled={!webhookUrl || !enabled || testState === "loading" || saveState === "loading"}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
                Sends an integration.test event to verify delivery.
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default Integrations;
