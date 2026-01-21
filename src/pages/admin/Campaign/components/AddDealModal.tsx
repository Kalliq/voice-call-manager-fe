import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import api from "../../../../utils/axiosInstance";
import { useSnackbar } from "../../../../hooks/useSnackbar";
import useAppStore from "../../../../store/useAppStore";

interface AddDealModalProps {
  open: boolean;
  onClose: () => void;
  contactId: string;
  onSuccess?: () => void;
}

const AddDealModal: React.FC<AddDealModalProps> = ({
  open,
  onClose,
  contactId,
  onSuccess,
}) => {
  const [dealname, setDealname] = useState("");
  const [pipeline, setPipeline] = useState("");
  const [dealstage, setDealstage] = useState("");
  const [amount, setAmount] = useState("");
  const [closedate, setClosedate] = useState("");
  const [hs_is_closed, setHs_is_closed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { enqueue } = useSnackbar();
  const { user } = useAppStore();

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setDealname("");
      setPipeline("");
      setDealstage("");
      setAmount("");
      setClosedate("");
      setHs_is_closed(false);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!dealname.trim()) {
      enqueue("Deal name is required", { variant: "error" });
      return;
    }

    if (!user?.id) {
      enqueue("User not found", { variant: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const dealData: any = {
        userId: user.id,
        contactId: contactId,
        dealname: dealname.trim(),
      };

      if (pipeline.trim()) dealData.pipeline = pipeline.trim();
      if (dealstage.trim()) dealData.dealstage = dealstage.trim();
      if (amount.trim()) {
        const parsedAmount = parseFloat(amount.trim());
        if (!isNaN(parsedAmount)) {
          dealData.amount = parsedAmount;
        }
      }
      if (closedate.trim()) {
        dealData.closedate = new Date(closedate);
      }
      dealData.hs_is_closed = hs_is_closed;

      await api.post("/deals", dealData);

      enqueue("Deal added successfully", { variant: "success" });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to add deal";
      enqueue(errorMessage, { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Deal</DialogTitle>
      <Divider />
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            label="Deal Name"
            value={dealname}
            onChange={(e) => setDealname(e.target.value)}
            fullWidth
            required
            disabled={submitting}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Pipeline"
            value={pipeline}
            onChange={(e) => setPipeline(e.target.value)}
            fullWidth
            disabled={submitting}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Deal Stage"
            value={dealstage}
            onChange={(e) => setDealstage(e.target.value)}
            fullWidth
            disabled={submitting}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            disabled={submitting}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: "0.01", min: "0" }}
          />

          <TextField
            label="Close Date"
            type="date"
            value={closedate}
            onChange={(e) => setClosedate(e.target.value)}
            fullWidth
            disabled={submitting}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              inputProps: {
                max: "9999-12-31",
              },
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={hs_is_closed}
                onChange={(e) => setHs_is_closed(e.target.checked)}
                disabled={submitting}
              />
            }
            label="Is Closed"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!dealname.trim() || submitting}
        >
          {submitting ? "Adding..." : "Add Deal"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDealModal;
