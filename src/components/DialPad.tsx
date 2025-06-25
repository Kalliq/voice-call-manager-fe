// src/components/DialPad.tsx
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Button,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import DialpadIcon from "@mui/icons-material/Dialpad";

interface DialPadProps {
  open: boolean;
  onClose: () => void;
  onCall: (number: string) => void;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

export default function DialPad({ open, onClose, onCall }: DialPadProps) {
  const [number, setNumber] = useState("");
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Dial Pad</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            mb: 2,
            p: 1,
            textAlign: "center",
            border: "1px solid #ccc",
            borderRadius: 1,
          }}
        >
          <Typography variant="h5">{number || " "}</Typography>
        </Box>
        <Stack spacing={1}>
          {KEYS.map((row) => (
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              key={row.join("")}
            >
              {row.map((k) => (
                <Button
                  key={k}
                  variant="outlined"
                  onClick={() => setNumber((n) => n + k)}
                  sx={{ width: 60, height: 60, borderRadius: 1 }}
                >
                  {k}
                </Button>
              ))}
            </Stack>
          ))}
        </Stack>
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
          <Button onClick={() => setNumber("")}>Clear</Button>
          <Button
            variant="contained"
            startIcon={<DialpadIcon />}
            onClick={() => {
              onCall(number);
              onClose();
            }}
            disabled={!number}
          >
            Call
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
