// src/pages/admin/Contacts/ContactDrawer.tsx
import { useEffect } from "react";
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
import { z } from "zod";

import api from "../utils/axiosInstance";

import { schema as validationSchema } from "../schemas/contsct-create/validation-schema";
import { useSnackbar } from "../hooks/useSnackbar";
import { Contact } from "../types/contact";

type FormData = z.infer<typeof validationSchema>;

interface ContactDrawerProps {
  open: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ContactDrawer({
  open,
  contact,
  onClose,
  onSaved,
}: ContactDrawerProps) {
  const { enqueue } = useSnackbar();
  const {
    control,
    handleSubmit,
    reset,
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

  useEffect(() => {
    if (contact) {
      reset({
        ...contact,
      });
    } else {
      reset({});
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
        await api.post("/contacts", {
          ...data,
        });
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
            <Box sx={{ textAlign: "right" }}>
              <Button onClick={onClose} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {contact ? "Save" : "Create"}
              </Button>
            </Box>
          </Stack>
        </form>
      </Box>
    </Drawer>
  );
}
