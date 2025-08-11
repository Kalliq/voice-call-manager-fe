import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Avatar,
  Tabs,
  Tab,
  Divider,
  Link,
  Stack,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  Animation,
  CallEnd,
  Add,
  Phone,
  Email,
  PlaylistAdd,
  Person,
  Close,
} from "@mui/icons-material";

import ContactOverview from "./ContactOverview";
import ContactStageChip from "./ContactStageChip";
import { CallBar } from "./molecules/CallBar";

import api from "../../../../utils/axiosInstance";
import { CallSession, Contact } from "../../../../types/contact";

interface SingleCallCampaignPanelProps {
  session: CallSession;
  answeredSession: Contact | null;
  onStartCall?: () => void;
  onEndCall: () => void;
  manual?: boolean;
  phone?: string;
  autoStart?: boolean;
  callStarted?: boolean;
  handleNumpadClick: (char: string) => void;
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
  manual,
  phone,
  autoStart,
  callStarted,
  handleNumpadClick,
}) => {
  const [callStartTime, setCallStartTime] = useState<Date | null>(new Date());
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [activeTab, setActiveTab] = useState(0);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [talkingPoints, setTalkingPoints] = useState<string[]>(
    Array.isArray(session.talkingPoints) ? session.talkingPoints : []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTalkingPoint, setNewTalkingPoint] = useState("");

  useEffect(() => {
    let int: NodeJS.Timeout;
    if (answeredSession) {
      if (!callStartTime) return;
      int = setInterval(() => {
        const diff = Math.floor((Date.now() - callStartTime.getTime()) / 1000);
        const mm = String(Math.floor(diff / 60)).padStart(2, "0");
        const ss = String(diff % 60).padStart(2, "0");
        setElapsedTime(`${mm}:${ss}`);
      }, 1_000);
    } else {
      setElapsedTime(`00:00`);
    }
    return () => clearInterval(int);
  }, [callStartTime, answeredSession]);

  useEffect(() => {
    if (answeredSession) {
      setCallStartTime(new Date());
    }
  }, [session.id, answeredSession]);

  useEffect(() => {
    if (autoStart) {
      onStartCall?.();
    }
  }, [session.id]);

  const onPhoneSubmitHandler = async () => {
    try {
      await api.patch(`/contacts/basic/${session.id}`, {
        phone: newPhone,
      });

      session.phone = newPhone;
      setEditingPhone(false);
      setNewPhone("");
    } catch (err) {
      console.error("Failed to update phone number", err);
    }
  };

  const onStageChangeHandler = async (status: string) => {
    console.log("status: ", typeof status);
    try {
      await api.patch(`/contacts/basic/${session.id}`, {
        status,
      });

      session.status = status;
    } catch (err) {
      console.error("Failed to update phone number", err);
    }
  };

  const handleRemoveTalkingPoint = async (index: number) => {
    const updated = talkingPoints.filter((_, i) => i !== index);
    try {
      await api.patch(`/contacts/basic/${session.id}`, {
        talkingPoints: updated,
      });
      setTalkingPoints(updated);
    } catch (err) {
      console.error("Failed to remove talking point", err);
    }
  };

  return (
    <>
      {callStarted && (
        <CallBar
          session={session}
          callStartTime={callStartTime}
          elapsedTime={elapsedTime}
          hasAnsweredSession={!!answeredSession}
          onEndCall={onEndCall}
          handleNumpadClick={handleNumpadClick}
        />
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
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ width: 56, height: 56, marginRight: 2 }}>
                <Person sx={{ fontSize: 36 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {session.first_name} {session.last_name}
                </Typography>
                {(session.title || session.company) && (
                  <Typography variant="body2" color="text.secondary">
                    {session.title ?? ""}
                    {session.title ? " at " : ""}
                    {session.company ?? ""}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box>
              <Stack spacing={1}>
                {/* Chips */}
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <ContactStageChip
                    contact={session}
                    onStageChange={onStageChangeHandler}
                  />
                  {/* TO DO -- think how to handle this section */}
                  {/* <Chip label="Owner" size="small" variant="outlined" />
                  <Chip label="C-Suite" size="small" variant="outlined" />
                  <Chip label="US-based" size="small" variant="outlined" /> */}
                  <Stack direction="row" spacing={1} alignItems="center">
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
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <Phone fontSize="small" />
                    {!editingPhone && session.phone ? (
                      <>
                        <Typography fontSize="12px" color="text.secondary">
                          {session.phone}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => setEditingPhone(true)}
                          sx={{ minWidth: "auto", fontSize: "11px", px: 1 }}
                        >
                          Change
                        </Button>
                      </>
                    ) : (
                      <>
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
                              onClick={onPhoneSubmitHandler}
                              sx={{
                                minWidth: "auto",
                                fontSize: "11px",
                                px: 1,
                              }}
                            >
                              Add
                            </Button>
                            <Button
                              size="small"
                              onClick={() => setEditingPhone(false)}
                              sx={{
                                minWidth: "auto",
                                fontSize: "11px",
                                px: 1,
                              }}
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
                      </>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </Box>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              sx={{ mt: 2, mb: 1 }}
            >
              {tabLabels.map((label, idx) => (
                <Tab key={idx} label={label} />
              ))}
            </Tabs>
            {activeTab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ContactOverview contact={session} />
                </Grid>
              </Grid>
            )}
            {activeTab !== 0 && (
              <Box px={3} py={2}>
                <Typography variant="body1" color="text.secondary">
                  "{tabLabels[activeTab]}" tab content goes here.
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              variant="outlined"
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                justifyContent: "center",
                borderRadius: 3,
                p: 2,
                mt: 2,
                backgroundColor: "#fff",
                boxShadow: 0,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Button variant="outlined" startIcon={<PlaylistAdd />}>
                Add to list
              </Button>
              <Button variant="outlined" startIcon={<Email />}>
                Send email
              </Button>
              <Button variant="outlined" startIcon={<Animation />}>
                Add to sequence
              </Button>
              {manual && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Phone />}
                  onClick={onStartCall}
                >
                  Call
                </Button>
              )}
            </Paper>
            <Grid
              item
              xs={12}
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
                <Stack direction="row" flexWrap="wrap">
                  {talkingPoints.length > 0 ? (
                    talkingPoints.map((point, idx) => (
                      <Chip
                        key={idx}
                        label={point}
                        onDelete={() => handleRemoveTalkingPoint(idx)}
                        deleteIcon={<Close />}
                        sx={{ m: 0.5 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No talking points available.
                    </Typography>
                  )}
                </Stack>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setIsModalOpen(true)}
                  sx={{ mt: 1 }}
                >
                  Add talking point
                </Button>
              </Paper>
              {!manual && (
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
                </Box>
              )}
            </Grid>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
      </Paper>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogTitle>Add Talking Point</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            label="Talking Point"
            value={newTalkingPoint}
            onChange={(e) => setNewTalkingPoint(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              const updatedPoints = [...talkingPoints, newTalkingPoint.trim()];
              setTalkingPoints(updatedPoints);
              setIsModalOpen(false);
              setNewTalkingPoint("");
              await api.patch(`/contacts/basic/${session.id}`, {
                talkingPoints: updatedPoints,
              });
            }}
            disabled={!newTalkingPoint.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SingleCallCampaignPanel;
