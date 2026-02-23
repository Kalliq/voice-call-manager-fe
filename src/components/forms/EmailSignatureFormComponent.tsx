import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, CircularProgress, Stack } from "@mui/material";
import { Save } from "@mui/icons-material";
import { useSnackbar } from "../../hooks/useSnackbar";
import RichTextEditor from "../RichTextEditor";
import { useGetEmailSignature } from "../../queries/email";
import { useUpdateEmailSignature } from "../../mutations/email";

const EmailSignatureFormComponent = () => {
  const [signature, setSignature] = useState("");
  const { enqueue } = useSnackbar();

  const { data: signatureData, isLoading: loading } = useGetEmailSignature();
  const { mutateAsync: updateSignature, isPending: saving } = useUpdateEmailSignature();

  // Sync local state when query data arrives
  useEffect(() => {
    if (signatureData) {
      setSignature(signatureData.html || "");
    }
  }, [signatureData]);

  const handleSave = async () => {
    try {
      await updateSignature(signature);
      enqueue("Signature saved successfully", { variant: "success" });
    } catch (error: any) {
      console.error("Failed to save signature:", error);
      enqueue(
        error.response?.data?.message || "Failed to save signature",
        { variant: "error" }
      );
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
