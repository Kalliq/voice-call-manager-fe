import React, { useEffect } from "react";
import { styled } from "@mui/material/styles";
import {
  Box,
  Grid,
  Typography,
  Button,
  IconButton,
  Avatar /*, ... other MUI components*/,
} from "@mui/material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import { Contact } from "../../../../types/contact";

interface SingleCallCampaignPanelProps {
  contact: Contact;
  status: "ringing" | "connected" | "ended" | "idle";
  onCallStart?: () => void;
  onCallEnd: () => void;
  onCallContinue: () => void;
  talkingPoints?: string[];
  onAddTalkingPoint?: () => void;
}

const StatusBar = styled(Box)<{ statusColor: string }>(
  ({ theme, statusColor }) => ({
    width: "100%",
    backgroundColor: statusColor,
    color: theme.palette.common.white,
    textAlign: "center",
    // If we want it to behave like an AppBar: use theme spacing for height
    padding: theme.spacing(1),
    // You can adjust height or use Typography for text styling
  })
);

const ContactName = styled(Typography)(({ theme }) => ({
  ...theme.typography.h5,
  fontWeight: theme.typography.fontWeightBold,
}));
const ContactSubtitle = styled(Typography)(({ theme }) => ({
  ...theme.typography.body1,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
}));

const TalkingPointsContainer = styled(Box)(({ theme }) => ({
  maxHeight: "200px", // make scrollable if too tall
  overflowY: "auto",
  paddingRight: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const SingleCallCampaignPanel: React.FC<SingleCallCampaignPanelProps> = ({
  contact,
  status,
  onCallStart,
  onCallEnd,
  onCallContinue,
  talkingPoints,
  onAddTalkingPoint,
}) => {
  useEffect(() => {
    if (status === "ringing" && onCallStart) {
      onCallStart();
    }
  }, [status, onCallStart]);

  useEffect(() => {
    if (status === "ended") {
      // Trigger the call result modal via parent callback
      onCallEnd();
      // Note: Depending on how the parent handles onCallEnd,
      // you might call onCallEnd here or instead have parent call it when ending the call.
    }
  }, [status, onCallEnd]);

  // Status bar color and text based on status
  let statusText = "";
  let statusColor = "";
  if (status === "ringing") {
    statusText = `Calling ${contact.first_name} ${contact.last_name}…`;
    statusColor = "#4caf50";
  } else if (status === "connected") {
    statusText = "Recording";
    statusColor = "#2196f3";
  } else if (status === "ended") {
    statusText = "Call Ended";
    statusColor = "#757575";
  }

  // Render JSX
  return (
    <Box display="flex" flexDirection="column" width="100%">
      {/* Status Bar */}
      {status !== "idle" && (
        <StatusBar statusColor={statusColor}>
          <Typography variant="subtitle1">
            {status === "connected" ? (
              <>
                <FiberManualRecordIcon
                  style={{
                    verticalAlign: "middle",
                    fontSize: "1rem",
                    color: "red",
                  }}
                />{" "}
                Recording
              </>
            ) : (
              statusText
            )}
          </Typography>
        </StatusBar>
      )}

      {/* Main content area */}
      <Grid container spacing={2} padding={2}>
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar sx={{ width: 56, height: 56, marginRight: 2 }}>
              {contact.first_name.charAt(0)}
            </Avatar>
            <Box>
              <ContactName>
                {contact.first_name} {contact.last_name}
              </ContactName>
              {(contact.title || contact.company) && (
                <ContactSubtitle>
                  {contact.capacity}
                  {contact.company ? ` at ${contact.company}` : ""}
                </ContactSubtitle>
              )}
            </Box>
          </Box>
          {contact.mobile_phone && (
            <Typography variant="body2" color="textSecondary">
              📞 {contact.mobile_phone}
            </Typography>
          )}
          {contact.email && (
            <Typography variant="body2" color="textSecondary">
              ✉️ {contact.email}
            </Typography>
          )}
          {/* ... any other contact fields as needed */}
        </Grid>

        {/* Right: Talking Points and Controls */}
        <Grid
          item
          xs={12}
          md={6}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={1}
            >
              <Typography variant="h6">Talking Points</Typography>
              {onAddTalkingPoint && (
                <IconButton
                  size="small"
                  onClick={onAddTalkingPoint}
                  aria-label="Add talking point"
                >
                  ➕
                </IconButton>
              )}
            </Box>
            <TalkingPointsContainer>
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
            </TalkingPointsContainer>
            {/* TO DO -- Additional Notes or script content can be added here */}
          </Box>

          {/* (End Call / Next Call) */}
          <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CallEndIcon />}
              onClick={() => onCallEnd()}
              disabled={status !== "connected" && status !== "ringing"}
            >
              End Call
            </Button>
            <Button
              variant="contained"
              color="primary"
              endIcon={<SkipNextIcon />}
              onClick={() => onCallContinue()}
              // Enable Next Call only when current call cycle is fully done:
              disabled={status !== "ended"}
            >
              Next Call
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SingleCallCampaignPanel;
