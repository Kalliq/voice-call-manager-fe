import { useState } from "react";
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
  onConfirm: (selectedListId: string) => void;
  lists: { id: string; listName: string }[];
  selectedListId: string;
  setTargetListId: (val: string) => void;
}

export function MoveContactsDialog({
  open,
  onClose,
  onConfirm,
  lists,
  selectedListId,
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
          value={selectedListId || ""}
          onChange={setTargetListId}
          getValue={(l) => l.id}
          getLabel={(l) => l.listName}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!selectedListId}
          onClick={() => onConfirm(selectedListId)}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
