import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from "@mui/material";
import SelectField from "./UI/SelectField";

interface AssignUnassignedDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lists: { id: string; listName: string }[];
  targetListId: string;
  setTargetListId: (val: string) => void;
  loading?: boolean;
}

export function AssignUnassignedDialog({
  open,
  onClose,
  onConfirm,
  lists,
  targetListId,
  setTargetListId,
  loading = false,
}: AssignUnassignedDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose}>
      <DialogTitle>Assign Unassigned Contacts to List</DialogTitle>
      <Divider />
      <DialogContent>
        <SelectField
          items={lists}
          label="Select target list"
          value={targetListId}
          onChange={setTargetListId}
          getValue={(l) => l.id}
          getLabel={(l) => l.listName}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!targetListId || loading}
          onClick={onConfirm}
        >
          {loading ? "Assigning..." : "Assign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
