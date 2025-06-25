/* eslint‑disable react/no‑array‑index‑key */
import { useState, useEffect } from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import {
  ArrowBack,
  CallEnd,
  VolumeOff,
  Pause,
  Timer,
  Voicemail,
  Dialpad,
  Info,
} from "@mui/icons-material";
import { Contact } from "../../../../types/contact";

/* ─────────── styled helpers ─────────── */
const LightPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
}));

/* ─────────── props ─────────── */
interface ActiveDialingCardProps {
  session: Contact;
  inputVolume: number;
  outputVolume: number;
  hangUp: () => void;
}

/* talking‑point mock → could be pulled from DB later */
const DEFAULT_POINTS = [
  "Introduce yourself and company",
  "Explain purpose of call",
  "Ask about current challenges",
  "Discuss how our solution addresses their needs",
  "Schedule follow‑up meeting",
];

/* ─────────── component ─────────── */
const ActiveDialingCard = ({
  session,
  inputVolume,
  outputVolume,
  hangUp,
}: ActiveDialingCardProps) => {
  /* timer logic preserved */
  const [callStartTime, setCallStartTime] = useState<Date | null>(new Date());
  const [elapsedTime, setElapsedTime] = useState("00:00");

  /* UI state */
  const [points, setPoints] = useState<string[]>(DEFAULT_POINTS);
  const [newPoint, setNewPoint] = useState("");
  const [tab, setTab] = useState<0 | 1>(0);

  const prospectFields: { label: string; value: string | undefined | null }[] =
    [
      { label: "Account", value: session.company },
      { label: "Title", value: session.capacity },
    ];

  /* tick every second */
  useEffect(() => {
    if (!callStartTime) return;
    const int = setInterval(() => {
      const diff = Math.floor((Date.now() - callStartTime.getTime()) / 1000);
      const mm = String(Math.floor(diff / 60)).padStart(2, "0");
      const ss = String(diff % 60).padStart(2, "0");
      setElapsedTime(`${mm}:${ss}`);
    }, 1_000);
    return () => clearInterval(int);
  }, [callStartTime]);

  /* restart timer whenever we switch session */
  useEffect(() => {
    setCallStartTime(new Date());
  }, [session.id]);

  /* ─────────── render ─────────── */
  return (
    <Box>
      {/* ─── call header bar ─── */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          borderRadius: 2,
          mb: 3,
          px: 2,
          py: 1,
          background:
            "linear-gradient(90deg,#0a4ddb 0%,#0f59ff 50%,#166bff 100%)",
        }}
      >
        <Grid container alignItems="center" color="#fff">
          <Grid item xs={12} md={6} display="flex" alignItems="center" gap={1}>
            <IconButton sx={{ color: "#fff" }}>
              <ArrowBack />
            </IconButton>
            <Typography fontWeight={600}>
              {session.mobile_phone ?? "(no number)"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, ml: 2 }}>
              Call started at{" "}
              {callStartTime?.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
            display="flex"
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
            alignItems="center"
            gap={1.5}
            flexWrap="wrap"
          >
            {/* timer pill */}
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,.15)",
                px: 1.5,
                py: 0.5,
                borderRadius: 4,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {elapsedTime}
            </Box>
            {/* call controls (icons only – real logic unchanged) */}
            <IconButton sx={{ color: "#fff" }}>
              <VolumeOff />
            </IconButton>
            <IconButton sx={{ color: "#fff" }}>
              <Pause />
            </IconButton>
            <IconButton sx={{ color: "#fff" }} onClick={hangUp}>
              <CallEnd color="error" />
            </IconButton>
          </Grid>
        </Grid>
      </AppBar>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <LightPaper>
            <Typography fontWeight={600} gutterBottom>
              Prospect
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="body2" color="text.secondary">
              Name:
            </Typography>
            <Typography fontWeight={500} gutterBottom>
              {session.first_name} {session.last_name}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Title:
            </Typography>
            <Typography gutterBottom>{session.capacity ?? "—"}</Typography>

            <Typography variant="body2" color="text.secondary">
              Company:
            </Typography>
            <Typography gutterBottom>{session.company ?? "—"}</Typography>

            <Typography variant="body2" color="text.secondary">
              Email:
            </Typography>
            <Typography gutterBottom>{session.email ?? "—"}</Typography>

            <Typography variant="body2" color="text.secondary">
              Phone:
            </Typography>
            <Typography gutterBottom>{session.mobile_phone ?? "—"}</Typography>

            <Button
              fullWidth
              variant="contained"
              size="small"
              sx={{ mt: 2, mb: 1 }}
            >
              Open in CRM
            </Button>
            <Button
              fullWidth
              variant="contained"
              size="small"
              sx={{ backgroundColor: "#0a66c2" }}
            >
              LinkedIn
            </Button>
          </LightPaper>
        </Grid>

        <Grid item xs={12} md={6}>
          <LightPaper>
            <Typography fontWeight={600} gutterBottom>
              Talking Points
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {points.map((p, i) => (
              <Box
                key={i}
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: i % 2 ? "#fafafa" : "#fff",
                  mb: 1,
                  fontSize: 14,
                }}
              >
                • {p}
              </Box>
            ))}

            <Box display="flex" gap={1} mt={1}>
              <TextField
                size="small"
                fullWidth
                placeholder="New talking point…"
                value={newPoint}
                onChange={(e) => setNewPoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPoint.trim()) {
                    setPoints([...points, newPoint.trim()]);
                    setNewPoint("");
                  }
                }}
              />
              <Button
                variant="contained"
                disabled={!newPoint.trim()}
                onClick={() => {
                  if (!newPoint.trim()) return;
                  setPoints([...points, newPoint.trim()]);
                  setNewPoint("");
                }}
              >
                Add
              </Button>
            </Box>
          </LightPaper>
        </Grid>

        <Grid item xs={12} md={3}>
          <LightPaper>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab label="Prospect Fields" />
              <Tab label="Activity History" />
            </Tabs>

            {tab === 0 && (
              <Box>
                {prospectFields.map(({ label, value }) => (
                  <Box key={label} mb={1}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: "uppercase" }}
                    >
                      {label}
                    </Typography>
                    <Typography>{value || "—"}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* activity history panel */}
            {tab === 1 && (
              <Box>
                {session.actions?.length ? (
                  session.actions.map((a, i) => {
                    const d = new Date(Number(a.timestamp));
                    return (
                      <Box
                        key={a.id ?? i}
                        display="flex"
                        alignItems="flex-start"
                        gap={1}
                        mb={2}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 28,
                            height: 28,
                          }}
                        >
                          <Info fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography fontWeight={500}>
                            {a.subject ?? "Call"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {d.toLocaleDateString()} • {d.toLocaleTimeString()}
                          </Typography>
                          <Typography
                            variant="body2"
                            color={
                              a.result.toLowerCase() === "answered"
                                ? "success.main"
                                : "error.main"
                            }
                          >
                            {a.result}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                ) : (
                  <Typography>No history available.</Typography>
                )}
              </Box>
            )}
          </LightPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ActiveDialingCard;
