import React, { useState, useEffect, ChangeEvent } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  IconButton,
  Avatar,
  AppBar,
  Tabs,
  Tab,
  Divider,
  Chip,
  Link,
  Stack,
  Paper,
  TextField,
} from "@mui/material";
import {
  ArrowBack,
  CallEnd,
  SkipNext,
  VolumeOff,
  Pause,
  Add,
  Phone,
  Email,
  PlaylistAdd,
  AccessTime,
} from "@mui/icons-material";

import { CallSession, Contact } from "../../../../types/contact";
import ContactOverview from "./ContactOverview";
import api from "../../../../utils/axiosInstance";

interface SingleCallCampaignPanelProps {
  session: CallSession;
  answeredSession: Contact | null;
  onStartCall?: () => void;
  onEndCall: () => void;
  onNextCall: () => void;
  talkingPoints?: string[];
  onAddTalkingPoint?: () => void;
}

const tabLabels = [
  "Contact overview",
  "Sequences",
  "Deals",
  "Conversations",
  "Meetings",
];

const SingleCallCampaignPanel: React.FC<SingleCallCampaignPanelProps> = ({
  session,
  answeredSession,
  onStartCall,
  onEndCall,
  onNextCall,
  talkingPoints,
  onAddTalkingPoint,
}) => {
  const [callStartTime, setCallStartTime] = useState<Date | null>(new Date());
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [activeTab, setActiveTab] = useState(0);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    if (!callStartTime) return;
    const int = setInterval(() => {
      const diff = Math.floor((Date.now() - callStartTime.getTime()) / 1000);
      const mm = String(Math.floor(diff / 60)).padStart(2, "0");
      const ss = String(diff % 60).padStart(2, "0");
      setElapsedTime(`${mm}:${ss}`);
    }, 1_000);
    return () => clearInterval(int);
  }, [callStartTime, answeredSession]);

  useEffect(() => {
    if (answeredSession) {
      setCallStartTime(new Date());
    }
  }, [session.id, answeredSession]);

  const handlePhoneSubmit = async () => {
    try {
      await api.patch(`/contacts/${session.id}`, {
        mobile_phone: newPhone,
      });

      session.mobile_phone = newPhone;
      setEditingPhone(false);
      setNewPhone("");
    } catch (err) {
      console.error("Failed to update phone number", err);
    }
  };

  return (
    <>
      {answeredSession && (
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
            <Grid
              item
              xs={12}
              md={6}
              display="flex"
              alignItems="center"
              gap={1}
            >
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
              <Box
                sx={{
                  bgcolor: "rgba(255,255,255,.15)",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                {elapsedTime}
              </Box>
              <IconButton sx={{ color: "#fff" }}>
                <VolumeOff />
              </IconButton>
              <IconButton sx={{ color: "#fff" }}>
                <Pause />
              </IconButton>
              <IconButton sx={{ color: "#fff" }} onClick={onEndCall}>
                <CallEnd color="error" />
              </IconButton>
            </Grid>
          </Grid>
        </AppBar>
      )}
      <Paper
        variant="outlined"
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          p: 2,
          mt: 2,
          backgroundColor: "#fff",
          boxShadow: 0,
        }}
      >
        <Grid container spacing={2} padding={2}>
          <Grid item xs={12} md={7}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ width: 56, height: 56, marginRight: 2 }}>
                {session.first_name?.[0] ?? "?"}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {session.first_name} {session.last_name}
                </Typography>
                {(session.capacity || session.company) && (
                  <Typography variant="body2" color="text.secondary">
                    {session.capacity ?? ""}{" "}
                    {session.company ? ` at ${session.company}` : ""}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box display="flex" gap={1} justifyContent="flex-end">
              <Button variant="outlined" startIcon={<PlaylistAdd />}>
                Add to list
              </Button>
              <Button variant="outlined" startIcon={<Email />}>
                Send email
              </Button>
              <Button variant="contained" disableElevation>
                Add to sequence
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box>
              <Stack spacing={1}>
                {/* Chips */}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label="Cold"
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                  <Chip label="Owner" size="small" variant="outlined" />
                  <Chip label="C-Suite" size="small" variant="outlined" />
                  <Chip label="US-based" size="small" variant="outlined" />
                </Stack>

                {/* Email + Phone + Time */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  flexWrap="wrap"
                >
                  {/* Email */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Email fontSize="small" />
                    <Link
                      href="mailto:mike@bdm-pro.com"
                      underline="hover"
                      color="inherit"
                      fontSize="12px"
                    >
                      {session.email}
                    </Link>
                  </Stack>

                  {/* Phone */}
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <Phone fontSize="small" />
                    {editingPhone ? (
                      <>
                        <Box
                          component="input"
                          type="tel"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="Enter phone"
                          sx={{
                            fontSize: "12px",
                            padding: "2px 6px",
                            border: "1px solid #ccc",
                            borderRadius: 1,
                            height: 24,
                            lineHeight: 1.2,
                            display: "inline-block",
                          }}
                        />
                        <Button
                          size="small"
                          onClick={handlePhoneSubmit}
                          sx={{ minWidth: "auto", fontSize: "11px", px: 1 }}
                        >
                          Add
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setEditingPhone(false)}
                          sx={{ minWidth: "auto", fontSize: "11px", px: 1 }}
                          color="inherit"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Typography fontSize="12px" color="text.secondary">
                          No phone number
                        </Typography>
                        <Typography
                          fontSize="0.9rem"
                          color="primary"
                          sx={{ cursor: "pointer", ml: 0.5 }}
                          onClick={() => setEditingPhone(true)}
                        >
                          • Add phone
                        </Typography>
                      </>
                    )}
                  </Stack>

                  {/* Time */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <AccessTime fontSize="small" />
                    <Typography fontSize="12px" color="text.secondary">
                      Jun 24, 2025 02:50 PM
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          </Grid>
        </Grid>

        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ mb: 2 }}
        >
          {tabLabels.map((label, idx) => (
            <Tab key={idx} label={label} />
          ))}
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2} padding={2}>
            <Grid item xs={12} md={7}>
              <ContactOverview contact={session} />
            </Grid>

            <Grid
              item
              xs={12}
              md={5}
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
            >
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
                <Typography variant="h6" gutterBottom>
                  Talking Points
                </Typography>
                <Box sx={{ maxHeight: 180, overflowY: "auto", pr: 1 }}>
                  {talkingPoints && talkingPoints.length > 0 ? (
                    <ul>
                      {talkingPoints.map((point, idx) => (
                        <li key={idx}>
                          <Typography variant="body2">{point}</Typography>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No talking points available.
                    </Typography>
                  )}
                </Box>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={onAddTalkingPoint}
                  sx={{ mt: 1 }}
                >
                  Add talking point
                </Button>
              </Paper>

              <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CallEnd />}
                  onClick={onEndCall}
                  disabled={!answeredSession}
                >
                  End Call
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<SkipNext />}
                  onClick={onNextCall}
                  disabled={!!answeredSession}
                >
                  Next Call
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 0 && (
          <Box px={3} py={2}>
            <Typography variant="body1" color="text.secondary">
              "{tabLabels[activeTab]}" tab content goes here.
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />
      </Paper>
    </>
  );
};

export default SingleCallCampaignPanel;
