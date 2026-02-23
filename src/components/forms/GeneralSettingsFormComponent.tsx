import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
} from "@mui/material";
import { formatContactLocalTime } from "../../utils/formatContactLocalTime";
import { useGetSettings } from "../../queries/settings";
import { useUpdateSettings } from "../../mutations/settings";

// US-only IANA timezones
const US_TIMEZONES = [
  { iana: "America/New_York", label: "Eastern Standard Time — New York", gmt: "GMT-5" },
  { iana: "America/Chicago", label: "Central Standard Time — Chicago", gmt: "GMT-6" },
  { iana: "America/Denver", label: "Mountain Standard Time — Denver", gmt: "GMT-7" },
  { iana: "America/Phoenix", label: "Mountain Standard Time — Phoenix", gmt: "GMT-7" },
  { iana: "America/Los_Angeles", label: "Pacific Standard Time — Los Angeles", gmt: "GMT-8" },
  { iana: "America/Anchorage", label: "Alaska Standard Time — Anchorage", gmt: "GMT-9" },
  { iana: "Pacific/Honolulu", label: "Hawaii-Aleutian Standard Time — Honolulu", gmt: "GMT-10" },
];

interface GeneralSettingsFormComponentProps {
  timezone?: string;
}

const GeneralSettingsFormComponent = ({
  timezone: initialTimezone = "UTC",
}: GeneralSettingsFormComponentProps) => {
  const { data: settings } = useGetSettings();
  const { mutateAsync: updateSettings } = useUpdateSettings();
  const [timezone, setTimezone] = useState(initialTimezone);
  const [saveState, setSaveState] = useState<"idle" | "loading" | "success">("idle");
  const [now, setNow] = useState(new Date());

  // Update time every minute for live preview
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync with settings if they change externally
  useEffect(() => {
    const currentTz = settings?.["General Settings"]?.timezone;
    if (currentTz && currentTz !== timezone) {
      setTimezone(currentTz);
    }
  }, [settings, timezone]);

  const handleSave = async () => {
    if (!settings) return;
    if (saveState === "loading") return;

    try {
      setSaveState("loading");
      const existingGeneralSettings = { ...(settings["General Settings"] || {}) };
      await updateSettings({
        "General Settings": {
          ...existingGeneralSettings,
          timezone,
        },
      });
      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      console.error("Failed to save timezone:", err);
      setSaveState("idle");
    }
  };

  const selectedTz = US_TIMEZONES.find((tz) => tz.iana === timezone) || null;
  const preview = selectedTz
    ? formatContactLocalTime(timezone, undefined, now)
    : formatContactLocalTime(timezone, undefined, now) || "—";

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" color="info" mb={4}>
        GENERAL SETTINGS
      </Typography>

      <Box sx={{ maxWidth: 500 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="timezone-select-label">Timezone</InputLabel>
          <Select
            labelId="timezone-select-label"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            label="Timezone"
            disabled={saveState === "loading"}
          >
            {US_TIMEZONES.map((tz) => {
              const tzPreview = formatContactLocalTime(tz.iana, undefined, now);
              return (
                <MenuItem key={tz.iana} value={tz.iana}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {tz.label} ({tz.gmt})
                    </Typography>
                    {tzPreview && (
                      <Typography variant="caption" color="text.secondary">
                        {tzPreview}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {selectedTz && (
          <Box sx={{ mb: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Time Preview:
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {preview}
            </Typography>
          </Box>
        )}

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saveState === "loading" || timezone === initialTimezone}
          sx={{ minWidth: 120 }}
        >
          {saveState === "loading" ? (
            <CircularProgress size={20} color="inherit" />
          ) : saveState === "success" ? (
            "Saved!"
          ) : (
            "Save"
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default GeneralSettingsFormComponent;
