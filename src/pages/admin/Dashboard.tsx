// Updated Dashboard layout matching the latest image
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent as MuiCardContent,
  Typography,
  Divider,
  Stack,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import styled from "@emotion/styled";
import { Task } from "voice-javascript-common";

import api from "../../utils/axiosInstance";
import useAppStore from "../../store/useAppStore";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// import { useGoogleCalendar } from "../../contexts/GoogleCalendarContext";

const colors = {
  background: "#fff",
  headline: "#1f1f1f",
  paragraph: "#4a4a4a",
  stroke: "#e0e0e0",
  secondary: "#9e9e9e",
  highlight: "#6246ea",
  highlightHover: "#5039c5",
  tertiary: "#2cb67d",
  cardBackground: "#f9f9f9",
  highlightTransparent: "rgba(98, 70, 234, .08)",
  highlightShadow: "rgba(98, 70, 234, .25)",
  positive: "#2cb67d",
  neutral: "#facc15",
  negative: "#ef4444",
};

const CardContent = styled(MuiCardContent)({
  paddingBottom: 10,
  "&:last-child": { paddingBottom: 10 },
});

const cardStyle = {
  borderRadius: 2,
  border: `1px solid ${colors.stroke}`,
  backgroundColor: colors.cardBackground,
  transition: "all .25s ease",
  "&:hover": {
    boxShadow: `0 4px 16px ${colors.highlightShadow}`,
    transform: "translateY(-2px)",
  },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, callStats, fetchCallStats, settings, setSettings } =
    useAppStore();
  const [tasks, setTasks] = useState<any>([]);
  const [groupedTasks, setGroupedTasks] = useState<any>({
    "To Do": [] as Task[],
    "In Progress": [] as Task[],
    Completed: [] as Task[],
  });
  // const { isLoading, events, signIn, signOut } = useGoogleCalendar();

  useEffect(() => {
    if (!user) return;
    api
      .get(`/settings`)
      .then(({ data }) => setSettings(data))
      .catch((err) => console.error("[dashboard] settings:", err));
  }, [user, setSettings]);

  useEffect(() => {
    if (fetchCallStats) {
      fetchCallStats("today").catch((err) => {
        console.error("[dashboard] Failed to fetch call stats:", err);
      });
    }
  }, [fetchCallStats]);

  const kpi = useMemo(() => {
    if (!callStats) return { calls: 0, satisfaction: 0, duration: 0 };

    return {
      calls: callStats.callsTotal,
      satisfaction: callStats.satisfactionScore ?? 0,
      duration: callStats.avgDurationMin ?? 0,
    };
  }, [callStats]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await api.get("/tasks");

        const grouped = {
          "To Do": [] as Task[],
          "In Progress": [] as Task[],
          Completed: [] as Task[],
        };

        if (Array.isArray(data)) {
          data.forEach((task: Task) => {
            if (grouped[task.status]) {
              grouped[task.status].push(task);
            }
          });
        }

        setTasks(data || []);
        setGroupedTasks(grouped);
      } catch (err) {
        console.error("[dashboard] Failed to fetch tasks:", err);
        setTasks([]);
        setGroupedTasks({
          "To Do": [] as Task[],
          "In Progress": [] as Task[],
          Completed: [] as Task[],
        });
      }
    };

    fetchTasks();
  }, []);

  const outcomeData = useMemo(() => {
    if (!callStats || !settings) {
      return [
        { name: "Successful", value: 0, color: "#2cb67d" },
        { name: "Connected", value: 0, color: "#facc15" },
        { name: "Unanswered", value: 0, color: "#ef4444" },
      ];
    }

    const total = callStats!.callsTotal || 0;
    const successful = callStats!.callsSuccessful || 0;
    const connected = callStats!.callsConnected || 0;

    const unsuccessful = Math.max(total - connected, 0);
    const semiSuccessful = Math.max(connected - successful, 0);

    return [
      { name: "Successful", value: successful, color: "#2cb67d" },
      { name: "Connected", value: semiSuccessful, color: "#facc15" },
      { name: "Unanswered", value: unsuccessful, color: "#ef4444" },
    ];
  }, [callStats, settings]);

  // Debug: Log to verify component is rendering
  console.log("[Dashboard] Rendering", { user, callStats, settings, tasks });

  try {
    return (
      <Box p={3} sx={{backgroundColor: "white", width:"100%", minHeight: "100vh"}}>
        <Box>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Dashboard
          </Typography>
        </Box>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3} sx={{ display: "flex" }}>
          <Card
            elevation={0}
            sx={{ ...cardStyle, width: "100%", height: "100%" }}
          >
            <CardContent>
              <Typography fontWeight="bold">Tasks</Typography>
              <Typography variant="h4">{tasks?.length}</Typography>
              <Stack direction="row" spacing={1} mt={1}>
                {groupedTasks && (
                  <>
                    <Chip
                      label={`${groupedTasks["To Do"].length} To Do`}
                      size="small"
                      color="warning"
                    />
                    <Chip
                      label={`${groupedTasks["In Progress"].length} In Progress`}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={`${groupedTasks["Completed"].length} Done`}
                      size="small"
                      color="success"
                    />
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3} sx={{ display: "flex" }}>
          <Card
            elevation={0}
            sx={{ ...cardStyle, width: "100%", height: "100%" }}
          >
            <CardContent>
              <Typography fontWeight="bold">Call Volume</Typography>
              <Typography variant="h4">{kpi.calls}</Typography>
              <Typography variant="caption" color="text.secondary">
                Daily calls
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3} sx={{ display: "flex" }}>
          <Card
            elevation={0}
            sx={{ ...cardStyle, width: "100%", height: "100%" }}
          >
            <CardContent>
              <Typography fontWeight="bold">Satisfaction Score</Typography>
              <Typography variant="h4">{kpi.satisfaction}/5</Typography>
              <Typography variant="caption" color="text.secondary">
                ★★★★☆
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3} sx={{ display: "flex" }}>
          <Card
            elevation={0}
            sx={{ ...cardStyle, width: "100%", height: "100%" }}
          >
            <CardContent>
              <Typography fontWeight="bold">Avg Call Duration</Typography>
              <Typography variant="h4">{kpi.duration} min</Typography>
              <Typography variant="caption" color="text.secondary">
                Improving efficiency
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7} sx={{ display: "flex" }}>
          <Card
            elevation={0}
            sx={{ ...cardStyle, width: "100%", height: "100%" }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight="bold">Recent Tasks</Typography>
                <Typography
                  fontSize={14}
                  color="primary"
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate("/tasks")}
                >
                  View all
                </Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Stack
                spacing={1}
                sx={{
                  overflowY: "scroll",
                  maxHeight: "220px",
                }}
                className="hide-scrollbar"
              >
                {tasks.map((task: any) => (
                  <Box
                    key={task.id}
                    p={2}
                    border="1px solid #e0e0e0"
                    borderRadius={2}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <Typography fontWeight={500} flex={1}>
                      {task.title}
                    </Typography>
                    <Chip
                      label={task.priority}
                      size="small"
                      sx={{ mx: 1, minWidth: 70, justifyContent: "center" }}
                    />
                    <Chip
                      label={task.status}
                      size="small"
                      color={
                        task.status === "To Do"
                          ? "default"
                          : task.status === "In Progress"
                          ? "primary"
                          : "success"
                      }
                      sx={{ mx: 1, minWidth: 90, justifyContent: "center" }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      minWidth={100}
                    >
                      {task.assigneeName || "-"}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5} sx={{ display: "flex" }}>
          <Card
            elevation={0}
            sx={{ ...cardStyle, width: "100%", height: "100%" }}
          >
            <CardContent>
              <Typography fontWeight="bold" mb={1}>
                Call Outcomes
              </Typography>
              <Divider sx={{ my: 1 }} />
              {outcomeData && outcomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={outcomeData}
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {outcomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No data available
                  </Typography>
                </Box>
              )}

              <Stack direction="row" justifyContent="space-around">
                {outcomeData &&
                  outcomeData.map((item) => (
                    <Stack key={item.name} alignItems="center">
                      <Box
                        width={12}
                        height={12}
                        borderRadius="50%"
                        bgcolor={item.color}
                        mb={0.5}
                      />
                      <Typography variant="caption">
                        {item.name} ({item.value})
                      </Typography>
                    </Stack>
                  ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      

       {/* <Grid container spacing={2} mt={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ ...cardStyle }}>
            <CardContent>
              <Typography fontWeight="bold" mb={1}>Your Calendar</Typography>
              <Divider sx={{ mb: 2 }} />
              <CalendarPage />
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}
      </Box>
    );
  } catch (error) {
    console.error("[Dashboard] Render error:", error);
    return (
      <Box p={3}>
        <Typography variant="h5" color="error">
          Dashboard Error
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error instanceof Error ? error.message : "Unknown error"}
        </Typography>
      </Box>
    );
  }
};

export default Dashboard;
