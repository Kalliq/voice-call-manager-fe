import { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  Typography,
  Divider,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import ContactCard from "../../../../components/ContactCard";
import api from "../../../../utils/axiosInstance";
import { useSnackbar } from "../../../../hooks/useSnackbar";

const ContactDialog = ({ open, onClose, contacts }: any) => {
  const { enqueue } = useSnackbar();
  const [localContacts, setLocalContacts] = useState<any[]>([]);

  // Sync local contacts with props when dialog opens or contacts change
  useEffect(() => {
    if (open && contacts) {
      setLocalContacts(contacts);
    }
  }, [open, contacts]);

  const handleDelete = async (contactId: string) => {
    try {
      await api.delete(`/contacts/${contactId}`);
      // Remove the deleted contact from local state
      setLocalContacts((prev) => prev.filter((c) => (c.id || c._id) !== contactId));
      enqueue("Contact deleted", { variant: "success" });
    } catch (error: any) {
      console.error("Failed to delete contact:", error);
      enqueue(error.response?.data?.message || "Failed to delete contact", {
        variant: "error",
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <Box
        display="flex"
        alignContent="space-between"
        flexDirection="row"
        alignItems="center"
        px={2}
        py={1}
      >
        <DialogTitle
          sx={{
            flex: 1,
            m: 0,
            p: 0,
            fontSize: "1.25rem",
            fontWeight: 500,
          }}
        >
          Contacts
        </DialogTitle>
        <Close onClick={onClose} sx={{ cursor: "pointer" }} />
      </Box>
      <Divider />
      <DialogContent>
        {localContacts?.length > 0 ? (
          <List dense>
            {localContacts.map((contact: any, idx: number) => (
              <ContactCard
                key={contact.id || contact._id || idx}
                contact={contact}
                onDeleteClick={handleDelete}
              />
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No contacts available.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
