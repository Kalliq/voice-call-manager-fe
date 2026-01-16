import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, CircularProgress, Stack } from "@mui/material";
import { Save } from "@mui/icons-material";
import api from "../../utils/axiosInstance";
import { useSnackbar } from "../../hooks/useSnackbar";
import useAppStore from "../../store/useAppStore";
import RichTextEditor from "../RichTextEditor";

const EmailSignatureFormComponent = () => {
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { enqueue } = useSnackbar();
  const setSettings = useAppStore((state) => state.setSettings);

  useEffect(() => {
    fetchSignature();
  }, []);

  const fetchSignature = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ html: string }>("/email/signature");
      setSignature(response.data.html || "");
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No signature yet - that's OK
        setSignature("");
      } else {
        console.error("Failed to fetch signature:", error);
        enqueue("Failed to load signature", { variant: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/email/signature", { html: signature });
      enqueue("Signature saved successfully", { variant: "success" });
      
      // Refresh settings to keep store in sync
      const { data } = await api.get("/settings");
      setSettings(data);
    } catch (error: any) {
      console.error("Failed to save signature:", error);
      enqueue(
        error.response?.data?.message || "Failed to save signature",
        { variant: "error" }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Signature
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Your signature will be automatically appended to all outbound emails.
              </Typography>
              <Box sx={{ position: "relative" }}>
                <RichTextEditor
                  value={signature}
                  onChange={setSignature}
                  placeholder="Enter your email signature..."
                  minHeight="200px"
                />
              </Box>
            </Box>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

export default EmailSignatureFormComponent;
