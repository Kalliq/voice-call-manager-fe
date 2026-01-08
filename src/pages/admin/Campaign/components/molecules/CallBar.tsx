import {
  Box,
  Grid,
  Typography,
  IconButton,
  AppBar,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from "@mui/material";
import {
  ArrowBack,
  CallEnd,
  VolumeOff,
  VolumeUp,
  Pause,
  PlayArrow,
  Dialpad,
} from "@mui/icons-material";
import { useState } from "react";
import { Call } from "@twilio/voice-sdk";
import { Device } from "@twilio/voice-sdk";

import { Contact } from "../../../../../types/contact";

interface CallBarProps {
  session?: Contact;
  phone?: string;
  callStartTime: Date | null;
  elapsedTime: string;
  hasAnsweredSession: boolean;
  onEndCall: () => void;
  handleNumpadClick: (char: string) => void;
  activeCallRef?: React.MutableRefObject<Call | null>;
  twilioDevice?: Device | null;
}

export const CallBar = ({
  session,
  phone,
  callStartTime,
  elapsedTime,
  hasAnsweredSession,
  onEndCall,
  handleNumpadClick,
  activeCallRef,
  twilioDevice,
}: CallBarProps) => {
  const [showNumpad, setShowNumpad] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isHeld, setIsHeld] = useState(false);

  const handleMute = () => {
    if (!activeCallRef?.current) return;
    try {
      const currentMuted = activeCallRef.current.isMuted();
      const newMutedState = !currentMuted;
      activeCallRef.current.mute(newMutedState);
      setIsMuted(newMutedState);
    } catch (error) {
      console.error("Failed to toggle mute:", error);
    }
  };

  const handleHold = () => {
    if (!activeCallRef?.current) return;
    try {
      const newHeldState = !isHeld;
      // Hold = mute microphone (same as mute) with separate UI state
      activeCallRef.current.mute(newHeldState);
      setIsHeld(newHeldState);
      setIsMuted(newHeldState); // Sync mute state with hold
    } catch (error) {
      console.error("Failed to toggle hold:", error);
    }
  };

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          borderRadius: 2,
          mb: 3,
          px: 5,
          py: 3,
          background:
            "linear-gradient(90deg,#0a4ddb 0%,#0f59ff 50%,#166bff 100%)",
        }}
      >
        <Box sx={{ fontSize: "1rem", width: "100%" }}>
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
              {phone && (
                <Typography fontWeight={600} sx={{ ml: 2, fontSize: "16px" }}>
                  {phone || "no number"}
                </Typography>
              )}
              {session && (
                <Typography fontWeight={600} sx={{ ml: 2, fontSize: "16px" }}>
                  {session.phone || "no number"}
                </Typography>
              )}
              <Typography variant="body2" sx={{ ml: 2, fontSize: "14px" }}>
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
              {hasAnsweredSession && (
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
              )}
              <IconButton
                sx={{ color: "#fff" }}
                onClick={() => setShowNumpad(true)}
              >
                <Dialpad />
              </IconButton>
              <IconButton
                sx={{ color: isMuted ? "primary.light" : "#fff" }}
                onClick={handleMute}
                disabled={!activeCallRef?.current}
              >
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
              <IconButton
                sx={{ color: isHeld ? "primary.light" : "#fff" }}
                onClick={handleHold}
                disabled={!activeCallRef?.current}
              >
                {isHeld ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton sx={{ color: "#fff" }} onClick={onEndCall}>
                <CallEnd color="error" />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
      </AppBar>

      <Dialog open={showNumpad} onClose={() => setShowNumpad(false)}>
        <DialogTitle>Numpad</DialogTitle>
        <DialogContent>
          {/* Replace this placeholder with your actual Numpad component */}
          <Box
            display="grid"
            gridTemplateColumns="repeat(3, 1fr)"
            gap={2}
            p={2}
          >
            {[..."123456789*0#"].map((char) => (
              <Button
                key={char}
                variant="outlined"
                onClick={() => handleNumpadClick(char)}
              >
                {char}
              </Button>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
