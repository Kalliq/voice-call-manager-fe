import { useState } from "react";
import {
  Popover,
  Box,
  TextField,
  Button,
  Grid,
  Typography,
} from "@mui/material";
import { Phone } from "@mui/icons-material";

interface PhoneDialerPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onCall: (phone: string) => void;
}

const numberPad = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

const PhoneDialerPopover = ({
  anchorEl,
  onClose,
  onCall,
}: PhoneDialerPopoverProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleNumClick = (digit: string) => {
    setPhoneNumber((prev) => prev + digit);
  };

  const handleClear = () => setPhoneNumber("");

  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
    >
      <Box p={2} width={250}>
        <Typography variant="subtitle1" gutterBottom>
          Enter Phone Number
        </Typography>
        <TextField
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        />
        <Grid container spacing={1}>
          {numberPad.flat().map((digit, idx) => (
            <Grid item xs={4} key={idx}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handleNumClick(digit)}
              >
                {digit}
              </Button>
            </Grid>
          ))}
        </Grid>
        <Box display="flex" justifyContent="space-between" mt={2}>
          <Button onClick={handleClear} color="inherit">
            Clear
          </Button>
          <Button
            onClick={() => onCall(phoneNumber)}
            variant="contained"
            color="primary"
            disabled={!phoneNumber.trim()}
          >
            Call
          </Button>
        </Box>
      </Box>
    </Popover>
  );
};

export default PhoneDialerPopover;
