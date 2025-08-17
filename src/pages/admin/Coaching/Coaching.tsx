import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Button,
  Paper,
  Chip,
  Stack,
  Divider,
  Tabs,
  Tab,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  AccessTime,
  Lock,
  MenuBook,
  CheckCircleOutline,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { CallLog } from "voice-javascript-common";
import { useNavigate } from "react-router-dom";

import ImproveSection from "./ImproveSection";
import api from "../../../utils/axiosInstance";
import useAppStore from "../../../store/useAppStore";
import AudioWaveform from "../../../components/AudioWaveform";
import { CallResult } from "../../../types/call-results";
import { useSnackbar } from "../../../hooks/useSnackbar";

const prettyDisposition = (raw?: string) => {
  if (!raw) return "";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
};

type CallAction = NonNullable<CallLog["action"]>;

type ActivityRowProps = {
  entry: CallLog;
  callResults: CallResult[];
  onUpdateDisposition: (sid: string, result: string) => Promise<void>;
};

const ActivityRow = ({
  entry,
  callResults,
  onUpdateDisposition,
}: ActivityRowProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  let formattedTime = "";
  if (entry.action?.timestamp) {
    formattedTime = format(new Date(parseInt(entry.action.timestamp)), "PPpp");
  }

  const currentValue = entry.action?.result ?? "";

  const handleChange = async (newVal: string) => {
    if (!entry.sid || newVal === currentValue) return;
    setSaving(true);
    try {
      await onUpdateDisposition(entry.sid, newVal);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        py={1}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <CheckCircleOutline color="primary" />

          <Select
            size="small"
            value={currentValue}
            onChange={(e) => handleChange(e.target.value as string)}
            displayEmpty
            sx={{ minWidth: 220 }}
          >
            {currentValue &&
              !callResults.some((cr) => cr.label === currentValue) && (
                <MenuItem value={currentValue}>
                  {prettyDisposition(currentValue)}
                </MenuItem>
              )}
            {callResults.map((cr) => (
              <MenuItem key={cr.label} value={cr.label}>
                {prettyDisposition(cr.label)}
              </MenuItem>
            ))}
          </Select>

          {entry.action?.notes && (
            <Tooltip title={entry.action.notes} arrow placement="top">
              <MenuBook
                fontSize="small"
                sx={{ cursor: "pointer", color: "primary.main" }}
              />
            </Tooltip>
          )}
          {saving && (
            <Typography variant="caption" color="text.secondary" ml={1}>
              Saving…
            </Typography>
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography color="text.secondary" fontSize={13}>
            {formattedTime}
          </Typography>
          <Button size="small" onClick={() => setIsOpen((prev) => !prev)}>
            {isOpen ? "Hide" : "Show"} Voice Recording
          </Button>
        </Stack>
      </Box>

      {isOpen && (
        <Box pl={4} pb={2}>
          {entry.recordingUrl ? (
            <AudioWaveform url={entry.recordingUrl} />
          ) : (
            <Typography fontSize={12} color="text.secondary">
              No call recording available for this call.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

const Coaching = () => {
  const navigate = useNavigate();
  const { enqueue } = useSnackbar();

  const [tabIndex, setTabIndex] = useState(0);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [startDate, setStartDate] = useState<null | Date>(null);
  const [endDate, setEndDate] = useState<null | Date>(null);
  const [selectedDisposition, setSelectedDisposition] = useState<string>("");

  const { settings } = useAppStore((state) => state);
  if (!settings) {
    navigate("/dashboard");
    return null;
  }

  const callResults =
    (settings["Phone Settings"].callResults as CallResult[]) || [];

  const fetchCallLogs = useCallback(
    async (userId = "") => {
      const params: any = { userId };
      if (startDate)
        params.startDate = dayjs(startDate).startOf("day").toISOString();
      if (endDate) params.endDate = dayjs(endDate).endOf("day").toISOString();
      if (selectedDisposition) params.disposition = selectedDisposition;

      const res = await api.get("/call-logs", { params });

      const cleaned: CallLog[] = (res.data.recordings ?? []).filter(
        (r: CallLog) =>
          !!r?.action?.result && String(r.action.result).trim().length > 0
      );

      setCallLogs(cleaned);
    },
    [startDate, endDate, selectedDisposition]
  );

  useEffect(() => {
    if (tabIndex === 1) {
      api.get("/users/mine").then((res) => setUsers(res.data));
      fetchCallLogs();
    }
  }, [tabIndex, fetchCallLogs]);

  useEffect(() => {
    fetchCallLogs(selectedUser);
  }, [selectedUser, startDate, endDate, selectedDisposition, fetchCallLogs]);

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    fetchCallLogs(userId);
  };

  const onUpdateDisposition = async (sid: string, result: string) => {
    const ensureAction = (a?: CallLog["action"]): CallAction => ({
      result: a?.result ?? "",
      notes: a?.notes ?? "",
      timestamp: a?.timestamp ?? String(Date.now()),
    });

    try {
      await api.patch(`/call-logs/${sid}`, { result });
      setCallLogs((prev) => {
        const next: CallLog[] = prev.map((cl): CallLog => {
          if (cl.sid !== sid) return cl;

          const action = ensureAction(cl.action);
          return {
            ...cl,
            action: { ...action, result },
          };
        });
        return next;
      });
      enqueue("Disposition updated.", { variant: "success" });
    } catch (e: any) {
      enqueue(e?.response?.data?.message || "Failed to update disposition.", {
        variant: "error",
      });
    }
  };

  return (
    <Box p={3}>
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 3 }}>
        <Tab label="Improve" sx={{ fontWeight: 600 }} />
        <Tab label="Coach" sx={{ fontWeight: 600 }} />
      </Tabs>

      {tabIndex === 0 ? (
        <ImproveSection />
      ) : (
        <>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Coach Panel
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Review all call logs from your users and give feedback.
          </Typography>

          <Box mb={3} display="flex" gap={2} flexWrap="wrap">
            <Select
              size="small"
              value={selectedUser}
              onChange={(e) => handleUserChange(e.target.value)}
              displayEmpty
              sx={{ minWidth: 250 }}
            >
              <MenuItem value="">All Users</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.email}
                </MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              value={selectedDisposition}
              onChange={(e) => setSelectedDisposition(e.target.value)}
              displayEmpty
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All Dispositions</MenuItem>
              {callResults.map((cr) => (
                <MenuItem key={cr.label} value={cr.label}>
                  {prettyDisposition(cr.label)}
                </MenuItem>
              ))}
            </Select>

            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              slotProps={{ textField: { size: "small" } }}
            />

            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              slotProps={{ textField: { size: "small" } }}
            />
          </Box>

          <Paper variant="outlined" sx={{ p: 2 }}>
            {callLogs.length > 0 ? (
              <Stack spacing={2}>
                {callLogs.map((log) => (
                  <ActivityRow
                    key={log.sid}
                    entry={log}
                    callResults={callResults}
                    onUpdateDisposition={onUpdateDisposition}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No call logs available.
              </Typography>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Coaching;
