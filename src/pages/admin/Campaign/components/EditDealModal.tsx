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

interface Deal {
  id: string;
  dealname?: string;
  name?: string;
  pipeline?: string;
  dealstage?: string;
  amount?: number;
  closedate?: string | Date;
  hs_is_closed?: boolean;
}

interface EditDealModalProps {
  open: boolean;
  onClose: () => void;
  deal: Deal | null;
  onSuccess?: () => void;
}

const EditDealModal: React.FC<EditDealModalProps> = ({
  open,
  onClose,
  deal,
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

  // Populate form when deal is provided or modal opens
  useEffect(() => {
    if (open && deal) {
      setDealname(deal.dealname || deal.name || "");
      setPipeline(deal.pipeline || "");
      setDealstage(deal.dealstage || "");
      setAmount(deal.amount?.toString() || "");
      
      // Format closedate for date input (YYYY-MM-DD)
      if (deal.closedate) {
        const date = new Date(deal.closedate);
        if (!isNaN(date.getTime())) {
          setClosedate(date.toISOString().split("T")[0]);
        } else {
          setClosedate("");
        }
      } else {
        setClosedate("");
      }
      
      setHs_is_closed(deal.hs_is_closed || false);
      setSubmitting(false);
    } else if (!open) {
      // Reset form when modal closes
      setDealname("");
      setPipeline("");
      setDealstage("");
      setAmount("");
      setClosedate("");
      setHs_is_closed(false);
      setSubmitting(false);
    }
  }, [open, deal]);

  const handleSubmit = async () => {
    if (!deal?.id) {
      enqueue("Deal ID is required", { variant: "error" });
      return;
    }

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
        dealname: dealname.trim(),
      };

      if (pipeline.trim()) dealData.pipeline = pipeline.trim();
      if (dealstage.trim()) dealData.dealstage = dealstage.trim();
      if (amount.trim()) {
        const parsedAmount = parseFloat(amount.trim());
        if (!isNaN(parsedAmount)) {
          dealData.amount = parsedAmount;
        }
      } else {
        dealData.amount = null;
      }
      if (closedate.trim()) {
        dealData.closedate = new Date(closedate);
      } else {
        dealData.closedate = null;
      }
      dealData.hs_is_closed = hs_is_closed;

      await api.patch(`/deals/${deal.id}`, dealData);

      enqueue("Deal updated successfully", { variant: "success" });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update deal";
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

  if (!deal) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Deal</DialogTitle>
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
          {submitting ? "Updating..." : "Update Deal"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDealModal;
