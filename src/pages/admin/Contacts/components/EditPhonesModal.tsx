import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Checkbox,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";

import api from "../../../../utils/axiosInstance";
import { useSnackbar } from "../../../../hooks/useSnackbar";
import { Contact, PhoneField, emptyPhoneField } from "../../../../types/contact";

interface EditPhonesModalProps {
  open: boolean;
  contact: Contact;
  onClose: () => void;
  onSaved: (updated: { phone: PhoneField; mobile: PhoneField; other: PhoneField }) => void;
}

export default function EditPhonesModal({
  open,
  contact,
  onClose,
  onSaved,
}: EditPhonesModalProps) {
  const { enqueue } = useSnackbar();
  const [phone, setPhone] = useState<PhoneField>(emptyPhoneField());
  const [mobile, setMobile] = useState<PhoneField>(emptyPhoneField());
  const [other, setOther] = useState<PhoneField>(emptyPhoneField());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone({ ...emptyPhoneField(), ...contact.phone });
      setMobile({ ...emptyPhoneField(), ...contact.mobile });
      setOther({ ...emptyPhoneField(), ...contact.other });
    }
  }, [open, contact]);

  const handleFavouriteChange = (field: "phone" | "mobile" | "other") => {
    const updaters = {
      phone: setPhone,
      mobile: setMobile,
      other: setOther,
    };
    const states = { phone, mobile, other };

    // If toggling off, just set it to false
    if (states[field].isFavourite) {
      updaters[field]((prev) => ({ ...prev, isFavourite: false }));
      return;
    }

    // Set the selected one to true, others to false
    setPhone((prev) => ({ ...prev, isFavourite: field === "phone" }));
    setMobile((prev) => ({ ...prev, isFavourite: field === "mobile" }));
    setOther((prev) => ({ ...prev, isFavourite: field === "other" }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/contacts/basic/${contact.id}`, {
        phone,
        mobile,
        other,
      });
      enqueue("Phone numbers updated", { variant: "success" });
      onSaved({ phone, mobile, other });
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Failed to update phone numbers";
      enqueue(msg, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const renderPhoneSection = (
    label: string,
    fieldKey: "phone" | "mobile" | "other",
    value: PhoneField,
    setValue: React.Dispatch<React.SetStateAction<PhoneField>>,
  ) => (
    <Stack spacing={1}>
      <Typography variant="subtitle2" fontWeight={600}>
        {label}
      </Typography>
      <TextField
        value={value.number}
        onChange={(e) => setValue((prev) => ({ ...prev, number: e.target.value }))}
        label="Number"
        size="small"
        fullWidth
      />
      <Stack direction="row" spacing={2} alignItems="center">
        <FormControlLabel
          control={
            <Checkbox
              checked={value.isFavourite}
              onChange={() => handleFavouriteChange(fieldKey)}
              size="small"
            />
          }
          label="Favourite"
        />
        <FormControlLabel
          control={
            <Switch
              checked={value.isBad}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, isBad: e.target.checked }))
              }
              size="small"
              color="error"
            />
          }
          label="Bad number"
        />
      </Stack>
    </Stack>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Phone Numbers</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {renderPhoneSection("Phone", "phone", phone, setPhone)}
          <Divider />
          {renderPhoneSection("Mobile", "mobile", mobile, setMobile)}
          <Divider />
          {renderPhoneSection("Other", "other", other, setOther)}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
