import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  IconButton,
  Avatar,
  AppBar,
  Paper,
} from "@mui/material";
import {
  ArrowBack,
  CallEnd,
  VolumeOff,
  Pause,
  Phone,
  Person,
} from "@mui/icons-material";

interface MinimalCallPanelProps {
  answeredSession: boolean;
  phone: string;
  onStartCall: (phone: string) => void;
  onEndCall: () => void;
  callStarted: boolean;
}

const MinimalCallPanel: React.FC<MinimalCallPanelProps> = ({
  answeredSession,
  phone,
  onStartCall,
  onEndCall,
  callStarted,
}) => {
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");

  useEffect(() => {
    if (callStarted) {
      const now = new Date();
      setCallStartTime(now);
    }
  }, [callStarted]);

  useEffect(() => {
    if (!callStartTime) return;
    const int = setInterval(() => {
      const diff = Math.floor((Date.now() - callStartTime.getTime()) / 1000);
      const mm = String(Math.floor(diff / 60)).padStart(2, "0");
      const ss = String(diff % 60).padStart(2, "0");
      setElapsedTime(`${mm}:${ss}`);
    }, 1000);
    return () => clearInterval(int);
  }, [callStartTime]);

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
              <Typography fontWeight={600}>{phone || "no number"}</Typography>
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
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: 3,
          px: 4,
          py: 2,
          mt: 2,
          backgroundColor: "#fff",
          boxShadow: 0,
        }}
      >
        <Grid
          item
          display="flex"
          flexDirection="row"
          alignItems="center"
          gap={2}
        >
          <Avatar sx={{ width: 56, height: 56 }}>
            <Person sx={{ fontSize: 36 }} />
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            {phone || "no number"}
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Phone />}
            onClick={() => onStartCall(phone)}
          >
            Call
          </Button>
        </Grid>
      </Paper>
    </>
  );
};

export default MinimalCallPanel;
