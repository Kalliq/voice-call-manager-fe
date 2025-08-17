import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Tooltip,
  Select,
  MenuItem,
} from "@mui/material";
import { CheckCircleOutline, MenuBook } from "@mui/icons-material";
import { format, isValid } from "date-fns";
import { CallLog } from "voice-javascript-common";
import AudioWaveform from "../../../../../components/AudioWaveform";
import { transformToNormalCase } from "../../../../../utils/transformCase";
import { CallResult } from "../../../../../types/call-results";

import api from "../../../../../utils/axiosInstance";

// helpers to match old/new labels
const norm = (s: string) => s.toLowerCase().replace(/[\s_]/g, "").trim();
const findCanonical = (raw: string, options: CallResult[]) =>
  options.find((o) => norm(o.label) === norm(raw));

type ActivityRowProps = {
  entry: CallLog;
  callResults: CallResult[];
  onResultChange: (sid: string, result: string) => void;
};

const ActivityRow = ({
  entry,
  callResults,
  onResultChange,
}: ActivityRowProps) => {
  // ⏱ time
  let formattedTime = "";
  if (entry.action?.timestamp) {
    const tsNum = Number(entry.action.timestamp);
    if (!isNaN(tsNum)) {
      const dateObj = new Date(tsNum);
      if (isValid(dateObj)) formattedTime = format(dateObj, "PPpp");
    }
  }

  const [isOpen, setIsOpen] = useState(false);
  const currentRaw = entry.action?.result ?? "";
  const canonical = findCanonical(currentRaw, callResults);
  const selectValue = canonical?.label ?? currentRaw; // fallback so value is always defined
  const hasMissingOption = !!currentRaw && !canonical;

  const handleChange = async (newLabel: string) => {
    try {
      await api.patch(`/call-logs/${entry.sid}`, { result: newLabel });
      onResultChange(entry.sid, newLabel);
    } catch (e) {
      console.error("Failed to update disposition", e);
    }
  };

  // If the disposition is empty, don't render this row at all (parent also filters)
  if (!currentRaw.trim()) return null;

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

          {/* Disposition as a Select */}
          <Select
            size="small"
            value={selectValue}
            onChange={(e) => handleChange(String(e.target.value))}
            sx={{ minWidth: 220 }}
          >
            {/* If current value isn't in options, show it once so it renders */}
            {hasMissingOption && (
              <MenuItem value={currentRaw}>
                {transformToNormalCase(currentRaw)}
              </MenuItem>
            )}
            {callResults.map((cr) => (
              <MenuItem key={cr.label} value={cr.label}>
                {transformToNormalCase(cr.label)}
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
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography color="text.secondary" fontSize={13}>
            {formattedTime}
          </Typography>
          <Button size="small" onClick={() => setIsOpen((p) => !p)}>
            {isOpen ? "Hide" : "Show"} Voice Recording
          </Button>
        </Stack>
      </Box>

      {isOpen && (
        <Box pl={4} pb={2}>
          {entry?.recordingUrl ? (
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

export default ActivityRow;
