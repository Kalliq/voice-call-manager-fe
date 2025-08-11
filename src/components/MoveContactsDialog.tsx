import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from "@mui/material";
import SelectField from "./UI/SelectField";

interface MoveContactsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lists: { id: string; listName: string }[];
  selectedListId: string;
  targetListId: string;
  setTargetListId: (val: string) => void;
}

export function MoveContactsDialog({
  open,
  onClose,
  onConfirm,
  lists,
  selectedListId,
  targetListId,
  setTargetListId,
}: MoveContactsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Move Contacts</DialogTitle>
      <Divider />
      <DialogContent>
        <SelectField
          items={lists.filter((l) => l.id !== selectedListId)}
          label="Select target list"
          value={targetListId}
          onChange={setTargetListId}
          getValue={(l) => l.id}
          getLabel={(l) => l.listName}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!targetListId}
          onClick={onConfirm}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
