import React, { useState, useEffect } from "react";
import { Grid, Typography, Button, Avatar, Paper } from "@mui/material";
import { Phone, Person } from "@mui/icons-material";

import { CallBar } from "./molecules/CallBar";

interface MinimalCallPanelProps {
  answeredSession: boolean;
  phone: string;
  onStartCall: (phone: string) => void;
  onEndCall: () => void;
  callStarted: boolean;
  handleNumpadClick: (char: string) => void;
}

const MinimalCallPanel: React.FC<MinimalCallPanelProps> = ({
  answeredSession,
  phone,
  onStartCall,
  onEndCall,
  callStarted,
  handleNumpadClick,
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
    let int: NodeJS.Timeout;
    if (answeredSession) {
      if (!callStartTime) return;
      int = setInterval(() => {
        const diff = Math.floor((Date.now() - callStartTime.getTime()) / 1000);
        const mm = String(Math.floor(diff / 60)).padStart(2, "0");
        const ss = String(diff % 60).padStart(2, "0");
        setElapsedTime(`${mm}:${ss}`);
      }, 1000);
    } else {
      setElapsedTime(`00:00`);
    }
    return () => clearInterval(int);
  }, [callStartTime]);

  // CallBar visibility: Show immediately when dialing starts, before connection
  // The bar is a control surface, not a connection indicator
  // It must appear as soon as callStarted === true to allow early hangup
  const shouldShowCallBar = callStarted;

  return (
    <>
      {shouldShowCallBar && (
        <CallBar
          phone={phone}
          callStartTime={callStartTime}
          elapsedTime={elapsedTime}
          hasAnsweredSession={answeredSession}
          onEndCall={onEndCall}
          handleNumpadClick={handleNumpadClick}
        />
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
