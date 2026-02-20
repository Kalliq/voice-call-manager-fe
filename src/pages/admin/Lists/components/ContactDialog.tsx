import { useState } from "react";
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

const ContactDialog = ({
  open,
  onClose,
  contacts,
  listId,
  onContactRemoved,
}: {
  open: boolean;
  onClose: () => void;
  contacts: any[];
  listId: string;
  onContactRemoved?: () => void;
}) => {
  const { enqueue } = useSnackbar();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveFromList = async (contactId: string) => {
    if (removingId) return;
    setRemovingId(contactId);
    try {
      await api.delete(`/lists/${listId}/contacts/${contactId}`);
      enqueue("Contact removed from list", { variant: "success" });
      onContactRemoved?.();
    } catch {
      enqueue("Failed to remove contact from list", { variant: "error" });
    } finally {
      setRemovingId(null);
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
        {contacts?.length > 0 ? (
          <List dense>
            {contacts.map((contact: any) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onRemoveFromListClick={(contactId) =>
                  handleRemoveFromList(contactId)
                }
                removeLabel="Remove from list"
                disabled={removingId === contact.id}
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
