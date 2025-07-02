import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

import { useSnackbar } from "../../hooks/useSnackbar";

import api from "../../utils/axiosInstance";
import { PhoneNumber } from "../../types/number";

export default function PhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { enqueue } = useSnackbar();

  useEffect(() => {
    const fetchMyNumbers = async () => {
      try {
        const { data } = await api.get("/numbers/my");

        setPhoneNumbers(data.map((num: PhoneNumber) => num.number));
        setLoading(false);
      } catch (error) {
        enqueue("Failed to load numbers", { variant: "error" });
      }
    };

    fetchMyNumbers();
  }, []);

  const handleCopy = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  return (
    <Box p={4}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Your Phone Numbers
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {phoneNumbers.map((number) => (
            <Chip
              key={number}
              label={
                <Box display="flex" alignItems="center">
                  {number}
                  <Tooltip title={copiedNumber === number ? "Copied!" : "Copy"}>
                    <IconButton
                      size="small"
                      sx={{ ml: 1 }}
                      onClick={() => handleCopy(number)}
                    >
                      {copiedNumber === number ? (
                        <CheckIcon fontSize="small" />
                      ) : (
                        <ContentCopyIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              variant="outlined"
              sx={{ fontSize: "1rem", pl: 1 }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
