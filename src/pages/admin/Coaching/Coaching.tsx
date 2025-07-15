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
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CallLog } from "voice-javascript-common";
import { useNavigate } from "react-router-dom";

import api from "../../../utils/axiosInstance";

import useAppStore from "../../../store/useAppStore";
import AudioWaveform from "../../../components/AudioWaveform";
import { CallResult } from "../../../types/call-results";

const ActivityRow = ({ entry }: { entry: CallLog }) => {
  let formattedTime = "";
  if (entry.action?.timestamp) {
    formattedTime = format(new Date(parseInt(entry.action.timestamp)), "PPpp");
  }
  const [isOpen, setIsOpen] = useState(false);

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
          <Typography fontWeight={500}>{entry.action?.result}</Typography>
          {entry.action?.notes && (
            <Tooltip title={entry.action.notes} arrow placement="top">
              <MenuBook
                fontSize="small"
                sx={{ cursor: "pointer", color: "primary.main" }}
              />
            </Tooltip>
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
    return;
  }
  const callResults = settings["Phone Settings"].callResults as CallResult[];

  useEffect(() => {
    if (tabIndex === 1) {
      api.get("/users?role=user").then((res) => {
        setUsers(res.data);
      });
      fetchCallLogs();
    }
  }, [tabIndex]);

  useEffect(() => {
    fetchCallLogs(selectedUser);
  }, [selectedUser, startDate, endDate, selectedDisposition]);

  const fetchCallLogs = async (userId = "") => {
    const params: any = { userId };

    if (startDate)
      params.startDate = dayjs(startDate).startOf("day").toISOString();
    if (endDate) params.endDate = dayjs(endDate).endOf("day").toISOString();
    if (selectedDisposition) params.disposition = selectedDisposition;

    const res = await api.get("/call-logs", { params });
    setCallLogs(res.data.recordings);
  };

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    fetchCallLogs(userId);
  };

  return (
    <Box p={3}>
      <Tabs
        value={tabIndex}
        onChange={(_, val) => setTabIndex(val)}
        sx={{ mb: 3 }}
      >
        <Tab label="Improve" sx={{ fontWeight: 600 }} />
        <Tab label="Coach" sx={{ fontWeight: 600 }} />
      </Tabs>
      {tabIndex === 0 ? (
        <>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Coaching
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Improve your skills with personalized coaching and training
            resources
          </Typography>

          {/* Progress Section */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Completed Modules
                </Typography>
                <Typography color="primary" fontSize={28} fontWeight="bold">
                  2/5
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(2 / 5) * 100}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Performance Score
                </Typography>
                <Typography
                  color="success.main"
                  fontSize={28}
                  fontWeight="bold"
                >
                  86%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={86}
                  sx={{ mt: 1, bgcolor: "#e0f2f1" }}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Training Hours
                </Typography>
                <Typography color="secondary" fontSize={28} fontWeight="bold">
                  12.5 hrs
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(12.5 / 20) * 100}
                  sx={{ mt: 1, bgcolor: "#f3e5f5" }}
                  color="secondary"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Learning Modules */}
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Learning Modules
          </Typography>
          <Grid container spacing={2} mb={4}>
            {[
              {
                title: "Effective Communication Skills",
                time: "45 min",
                status: "Start",
                description:
                  "Learn techniques to communicate clearly and effectively with clients over the phone.",
              },
              {
                title: "Handling Difficult Conversations",
                time: "60 min",
                status: "Start",
                description:
                  "Strategies for navigating challenging client interactions with confidence and professionalism.",
              },
              {
                title: "Product Knowledge Fundamentals",
                time: "90 min",
                status: "Continue",
                description:
                  "Comprehensive overview of product features, benefits, and value propositions.",
                badge: "In Progress",
              },
              {
                title: "Advanced Sales Techniques",
                time: "120 min",
                status: "Locked",
                description:
                  "Learn proven methods to increase conversion rates and customer satisfaction.",
                locked: true,
              },
            ].map((mod, idx) => (
              <Grid item xs={12} md={6} key={idx}>
                <Paper sx={{ p: 2, height: "100%" }} variant="outlined">
                  <Typography fontWeight="bold">{mod.title}</Typography>
                  {mod.badge && (
                    <Chip
                      label={mod.badge}
                      size="small"
                      color="warning"
                      sx={{ ml: 1 }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {mod.description}
                  </Typography>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccessTime
                        fontSize="small"
                        sx={{ color: "text.secondary" }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {mod.time}
                      </Typography>
                    </Stack>
                    {mod.locked ? (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled
                        startIcon={<Lock />}
                      >
                        Locked
                      </Button>
                    ) : (
                      <Button size="small" variant="contained">
                        {mod.status}
                      </Button>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Upcoming Training Sessions & Resources */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight="bold" mb={1}>
                Upcoming Training Sessions
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography fontWeight="bold">
                      Team Role Play Session
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tomorrow, 2:00 PM • 8 participants
                    </Typography>
                    <Button variant="contained" size="small" sx={{ mt: 1 }}>
                      Join
                    </Button>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography fontWeight="bold">
                      New Product Introduction
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      June 15, 10:30 AM • 12 participants
                    </Typography>
                    <Button variant="contained" size="small" sx={{ mt: 1 }}>
                      Join
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight="bold" mb={1}>
                Coaching Resources
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  {[
                    "Call Scripts Library",
                    "Training Videos",
                    "Request 1-on-1 Coaching",
                    "Peer Review Sessions",
                  ].map((res, i) => (
                    <Button key={i} variant="outlined" fullWidth>
                      {res}
                    </Button>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* AI Coach Notice */}
          <Box
            mt={5}
            p={3}
            sx={{
              background: "linear-gradient(to right, #6366f1, #8b5cf6)",
              borderRadius: 2,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography color="#fff" fontSize={18} fontWeight="bold">
                  Coming Soon: AI Coach
                </Typography>
                <Typography color="#e0e0e0">
                  Our new AI coaching assistant will provide personalized
                  feedback on your calls and help improve your performance.
                </Typography>
              </Box>
              <Button variant="contained" color="secondary">
                Get Notified
              </Button>
            </Stack>
          </Box>
        </>
      ) : (
        <>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Coach Panel
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Review all call logs from your users and give feedback.
          </Typography>
          <Box mb={3}>
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
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">All Dispositions</MenuItem>
              {callResults.map((cr) => (
                <MenuItem key={cr.label} value={cr.label}>
                  {cr.label}
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
                  <ActivityRow key={log.sid} entry={log} />
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
