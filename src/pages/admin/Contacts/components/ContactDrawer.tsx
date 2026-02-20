import { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  Autocomplete,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { List } from "voice-javascript-common";
import { z } from "zod";

import api from "../../../../utils/axiosInstance";

import { schema as validationSchema } from "../../../../schemas/contsct-create/validation-schema";
import { useSnackbar } from "../../../../hooks/useSnackbar";
import { Contact, emptyPhoneField } from "../../../../types/contact";
import { Account } from "../../../../types/account";
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
      accountId: "",
      email: "",
      phone: "",
      mobile: "",
      other: "",
      linkedIn: "",
      state: "",
      subject: "",
      city: "",
    },
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | undefined>(
    undefined,
  );
  const [listIdError, setListIdError] = useState<string>("");

  // Watch form values to enable/disable submit button
  const data = watch();

  const loadAccounts = useCallback(async () => {
    try {
      const res = await api.get("/accounts/all", {});
      setAccounts(res.data.accounts);
    } catch (error) {
      enqueue("Failed to load accounts", { variant: "error" });
    }
  }, [open]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const defaults = {
    first_name: "",
    last_name: "",
    accountId: "",
    email: "",
    phone: "",
    mobile: "",
    other: "",
    linkedIn: "",
    state: "",
    subject: "",
    city: "",
  };

  useEffect(() => {
    if (contact) {
      const { account } = contact;
      reset({
        ...defaults,
        first_name: (contact.first_name as string) ?? "",
        last_name: (contact.last_name as string) ?? "",
        email: (contact.email as string) ?? "",
        accountId: account?.id ?? "",
        phone: contact.phone?.number ?? "",
        mobile: contact.mobile?.number ?? "",
        other: contact.other?.number ?? "",
        linkedIn: (contact.linkedIn as string) ?? "",
        state: (contact.state as string) ?? "",
        subject: (contact.subject as string) ?? "",
        city: (contact.city as string) ?? "",
      });
    } else {
      reset(defaults);
      setSelectedListId(undefined);
      setListIdError("");
    }
  }, [contact, reset]);

  const onSubmit = async (formData: FormData) => {
    try {
      const { phone, mobile, other, ...rest } = formData;

      const phoneFields = {
        phone: { ...emptyPhoneField(), ...(contact?.phone ?? {}), number: phone },
        mobile: { ...emptyPhoneField(), ...(contact?.mobile ?? {}), number: mobile || "" },
        other: { ...emptyPhoneField(), ...(contact?.other ?? {}), number: other || "" },
      };

      if (contact) {
        await api.patch(`/contacts/basic/${contact.id}`, {
          ...rest,
          ...phoneFields,
        });
        enqueue("Updated", { variant: "success" });
      } else {
        const contactData: Record<string, any> = Object.fromEntries(
          Object.entries(rest).filter(([, v]) => v !== undefined && v !== ""),
        );
        contactData.phone = phoneFields.phone;
        contactData.mobile = phoneFields.mobile;
        contactData.other = phoneFields.other;

        if (selectedListId && selectedListId.trim() !== "") {
          contactData.listId = selectedListId.trim();
        }

        await api.post("/contacts", contactData);
        enqueue("Created", { variant: "success" });
      }
      onSaved();
    } catch (e: any) {
      const msg =
        e.response?.data?.errors?.[0]?.message ||
        e.response?.data?.message ||
        e.message ||
        "Error!";
      enqueue(msg, { variant: "error" });
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
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="First Name"
                  error={!!errors.first_name}
                  helperText={errors.first_name?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Last Name"
                  error={!!errors.last_name}
                  helperText={errors.last_name?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={accounts}
                  getOptionLabel={(option) => option.companyName}
                  value={accounts.find((a) => a.id === field.value) ?? null}
                  onChange={(_, newValue) => {
                    field.onChange(newValue?.id ?? "");
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Company"
                      error={!!errors.accountId}
                      helperText={errors.accountId?.message}
                    />
                  )}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Phone"
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="mobile"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Mobile"
                  fullWidth
                />
              )}
            />
            <Controller
              name="other"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Other Phone"
                  fullWidth
                />
              )}
            />
            <Controller
              name="linkedIn"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="LinkedIn"
                  error={!!errors.linkedIn}
                  helperText={errors.linkedIn?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Subject"
                  error={!!errors.subject}
                  helperText={errors.subject?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="State"
                  error={!!errors.state}
                  helperText={errors.state?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="City"
                  error={!!errors.city}
                  helperText={errors.city?.message}
                  fullWidth
                />
              )}
            />
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
