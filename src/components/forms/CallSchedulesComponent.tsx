import { useEffect, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  MenuItem,
  Chip,
  Box,
  Typography,
  IconButton,
  Select,
  FormControl,
  Tooltip,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { WeekDay } from "voice-javascript-common";

import { SimpleButton } from "../UI/SimpleButton";
import { formatContactLocalTime } from "../../utils/formatContactLocalTime";
import { useGetSettings } from "../../queries/settings";
import { useUpdateSettings } from "../../mutations/settings";

interface TimeSlot {
  from: string;
  to: string;
}
type Schedule = Record<string, TimeSlot[]>;
type SaveState = "idle" | "loading" | "success";

const defaultSchedule: Schedule = {
  [WeekDay.MONDAY]: [{ from: "08:00 AM", to: "06:00 PM" }],
  [WeekDay.TUESDAY]: [{ from: "08:00 AM", to: "06:00 PM" }],
  [WeekDay.WEDNESDAY]: [{ from: "08:00 AM", to: "06:00 PM" }],
  [WeekDay.THURSDAY]: [{ from: "08:00 AM", to: "06:00 PM" }],
  [WeekDay.FRIDAY]: [{ from: "08:00 AM", to: "06:00 PM" }],
  [WeekDay.SATURDAY]: [],
  [WeekDay.SUNDAY]: [],
};

const timeOptions = [
  "12:00 AM",
  "01:00 AM",
  "02:00 AM",
  "03:00 AM",
  "04:00 AM",
  "05:00 AM",
  "06:00 AM",
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
  "11:00 PM",
];

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

const ScheduleComponent = () => {
  const { data: settings } = useGetSettings();
  const { mutateAsync: updateSettings } = useUpdateSettings();

  const schedulesManagement =
    settings?.["Phone Settings"]?.schedulesManagement ?? {};
  const [schedule, setSchedule] = useState<Schedule>(() =>
    Object.keys(schedulesManagement).length > 0
      ? schedulesManagement
      : defaultSchedule
  );

  const storedTimezone =
    (settings?.["General Settings"] as { timezone?: string })?.timezone ?? null;
  const isTimezoneLocked = Boolean(storedTimezone);

  // Validate timezone is in allowed list, fallback to empty string if invalid
  const getValidTimezone = (tz: string | null): string => {
    if (!tz) return "";
    const isValid = US_TIMEZONES.some((t) => t.iana === tz);
    return isValid ? tz : "";
  };

  const [timezone, setTimezone] = useState<string>(getValidTimezone(storedTimezone));
  const [now, setNow] = useState(new Date());

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Update time every minute for live preview
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // IMPORTANT:
  // Do NOT sync timezone draft from settings on every render/update.
  // That was reverting user selection instantly (settings still null until Save).
  // Only lock happens naturally after Save because storedTimezone becomes non-null.
  useEffect(() => {
    if (storedTimezone) {
      const validTz = getValidTimezone(storedTimezone);
      if (validTz) {
        setTimezone(validTz);
      }
    }
    // only when storedTimezone changes (after Save or initial load)
  }, [storedTimezone]);

  // keep schedule in sync if settings change
  useEffect(() => {
    const sm = settings?.["Phone Settings"]?.schedulesManagement ?? {};
    setSchedule(Object.keys(sm).length > 0 ? sm : defaultSchedule);
  }, [settings]);

  // clean up timer if unmounted during success flash
  useEffect(() => {
    let t: number | undefined;
    if (saveState === "success") {
      t = window.setTimeout(() => setSaveState("idle"), 3000);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [saveState]);

  const handleOpenModal = (day: string) => {
    setSelectedDay(day);
    setFromTime("");
    setToTime("");
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleAddTimeframe = () => {
    if (!selectedDay || !fromTime || !toTime) return;
    setSchedule((prev) => ({
      ...prev,
      [selectedDay]: [...prev[selectedDay], { from: fromTime, to: toTime }],
    }));
    handleClose();
  };

  const handleRemoveTimeframe = (day: string, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const onSubmit = async () => {
    if (saveState === "loading") return; // prevent double click
    try {
      if (!settings) throw new Error("Missing settings!");
      setSaveState("loading");

      const existingPhoneSettings = { ...settings["Phone Settings"] };
      const existingGeneralSettings = { ...(settings["General Settings"] || {}) };

      const patchData: any = {
        "Phone Settings": {
          ...existingPhoneSettings,
          schedulesManagement: schedule,
        },
      };

      // Only persist timezone if it's currently unset (first-time selection)
      // Validate timezone is in allowed list before saving
      if (!isTimezoneLocked && timezone) {
        const isValidTimezone = US_TIMEZONES.some((t) => t.iana === timezone);
        if (isValidTimezone) {
          patchData["General Settings"] = {
            ...existingGeneralSettings,
            timezone,
          };
        }
      }

      await updateSettings(patchData);

      setSaveState("success"); // flash success for 3s (effect above resets to idle)
    } catch (err) {
      console.error(err);
      setSaveState("idle"); // or keep an 'error' state if you want red styling
    }
  };

  const isBusy = saveState === "loading";

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" color="info" mb={4}>
        CALL SCHEDULE
      </Typography>

      {/* Your Operating Timezone Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Your Operating Timezone
        </Typography>
        <Tooltip
          title={
            isTimezoneLocked
              ? "Timezone can only be set once. Contact support if this needs to be changed."
              : ""
          }
          arrow
          placement="top"
          disableHoverListener={!isTimezoneLocked}
        >
          <span>
            <FormControl fullWidth sx={{ mb: 0.5 }}>
              <Select
                value={timezone || ""}
                onChange={(e) => {
                  const newValue = String(e.target.value);
                  // Validate the selected value is in allowed list
                  const isValid = US_TIMEZONES.some((t) => t.iana === newValue);
                  if (isValid || newValue === "") {
                    setTimezone(newValue);
                  }
                }}
                disabled={isBusy || isTimezoneLocked}
                displayEmpty
                renderValue={(val) =>
                  val ? val : "Select your operating timezone"
                }
                sx={{
                  "& .MuiSelect-select": {
                    py: 1.5,
                    fontSize: 14,
                  },
                }}
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
          </span>
        </Tooltip>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          This timezone is used for call schedules and reporting.
        </Typography>
      </Box>

      <Box
        className="hide-scrollbar"
        overflow="scroll"
        display="flex"
        p={2}
        border="1px solid #eee"
        borderRadius={2}
        mt={1}
        gap={1}
        sx={{ opacity: isBusy ? 0.9 : 1 }}
      >
        {Object.keys(schedule).map((day) => (
          <Box key={day} sx={{ mb: 2 }} pb={2}>
            <Typography
              display="inline-block"
              ml={1}
              width="120px"
              component="span"
              fontWeight="bold"
              color="black"
            >
              {day}
            </Typography>
            {schedule[day].length > 0 ? (
              schedule[day].map((slot, index) => (
                <Chip
                  key={`${day}-${index}`}
                  label={`${slot.from} - ${slot.to}`}
                  onDelete={
                    !isBusy
                      ? () => handleRemoveTimeframe(day, index)
                      : undefined
                  }
                  deleteIcon={<RemoveCircleOutlineIcon />}
                  sx={{ mb: 0.5 }}
                />
              ))
            ) : (
              <Typography component="span" color="black" sx={{ ml: 1 }}>
                No Schedule
              </Typography>
            )}
            <IconButton
              size="small"
              onClick={() => handleOpenModal(day)}
              disabled={isBusy}
            >
              <AddCircleOutlineIcon />
            </IconButton>
          </Box>
        ))}
      </Box>

      <SimpleButton
        label="Save"
        onClick={onSubmit}
        loading={saveState === "loading"}
        success={saveState === "success"}
        disabled={isBusy}
        sx={{ mt: 2 }}
      />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add Timeframe</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="From"
            fullWidth
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            sx={{ mt: 2 }}
            disabled={isBusy}
          >
            {timeOptions.map((time) => (
              <MenuItem key={time} value={time}>
                {time}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="To"
            fullWidth
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
            sx={{ mt: 2 }}
            disabled={isBusy}
          >
            {timeOptions.map((time) => (
              <MenuItem key={time} value={time}>
                {time}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            onClick={handleAddTimeframe}
            variant="contained"
            disabled={isBusy}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleComponent;
