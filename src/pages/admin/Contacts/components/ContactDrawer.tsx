import { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { List } from "voice-javascript-common";
import { z } from "zod";

import api from "../../../../utils/axiosInstance";

import { schema as validationSchema } from "../../../../schemas/contsct-create/validation-schema";
import { useSnackbar } from "../../../../hooks/useSnackbar";
import { Contact } from "../../../../types/contact";
import SelectField from "../../../../components/UI/SelectField";

type FormData = z.infer<typeof validationSchema>;

interface ContactDrawerProps {
  open: boolean;
  contact: Contact | null;
  lists: List[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ContactDrawer({
  open,
  contact,
  lists,
  onClose,
  onSaved,
}: ContactDrawerProps) {
  const { enqueue } = useSnackbar();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      company: "",
      email: "",
      phone: "",
    },
  });
  const [selectedListId, setSelectedListId] = useState<string | undefined>(
    undefined,
  );
  const [listIdError, setListIdError] = useState<string>("");

  // Watch form values to enable/disable submit button
  const data = watch();

  useEffect(() => {
    if (contact) {
      reset({
        ...contact,
      });
    } else {
      reset({});
      setSelectedListId(undefined);
      setListIdError("");
    }
  }, [contact, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (contact) {
        await api.patch(`/contacts/basic/${contact.id}`, {
          ...data,
        });
        enqueue("Updated", { variant: "success" });
      } else {
        // SUBMIT GUARD: Ensure listId is valid before sending
        // PAYLOAD GUARANTEE: Filter out empty optional fields (email, company)
        // Backend .optional().isEmail() fails on empty string - must be undefined if not provided
        const contactData: Record<string, any> = {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
        };
        if (selectedListId && selectedListId.trim() !== "") {
          contactData.listId = selectedListId.trim();
        }

        // Only include email if it's not empty
        if (data.email && data.email.trim() !== "") {
          contactData.email = data.email.trim();
        }

        // Only include company if it's not empty
        if (data.company && data.company.trim() !== "") {
          contactData.company = data.company.trim();
        }

        await api.post("/contacts", contactData);
        enqueue("Created", { variant: "success" });
      }
      onSaved();
    } catch (e: any) {
      enqueue(e.message || "Error!", { variant: "error" });
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, p: 3 }}>
        <Typography variant="h6" mb={2}>
          {contact ? "Edit Contact" : "New Contact"}
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            {[
              ["First Name", "first_name"],
              ["Last Name", "last_name"],
              ["Company", "company"],
              ["Email", "email"],
              ["Number", "phone"],
            ].map(([label, name]) => (
              <Controller
                key={name}
                name={name as any}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={label}
                    error={!!errors[name as keyof FormData]}
                    helperText={errors[name as keyof FormData]?.message}
                    fullWidth
                  />
                )}
              />
            ))}
            {!contact && (
              <Box>
                <SelectField
                  items={lists}
                  label="Select List"
                  value={selectedListId}
                  onChange={(val) => {
                    setSelectedListId(val);
                    setListIdError(""); // Clear error on selection
                  }}
                  getValue={(l) => l.id}
                  getLabel={(l) => l.listName}
                  placeholder=""
                />
                {listIdError && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 1.75, display: "block" }}
                  >
                    {listIdError}
                  </Typography>
                )}
              </Box>
            )}
            <Box sx={{ textAlign: "right" }}>
              <Button onClick={onClose} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={
                  isSubmitting ||
                  (!contact &&
                    (!data.first_name?.trim() ||
                      !data.last_name?.trim() ||
                      !data.phone?.trim()))
                }
              >
                {contact ? "Save" : "Create"}
              </Button>
            </Box>
          </Stack>
        </form>
      </Box>
    </Drawer>
  );
}
