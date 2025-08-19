// src/pages/MyProfile.tsx
import { useState, useEffect } from "react";
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  TextField,
  Button,
  Stack,
  Snackbar,
} from "@mui/material";
import api from "../utils/axiosInstance";

interface User {
  id: string;
  email: string;
  role: string;
  settings: string | null;
}

export default function MyProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [changing, setChanging] = useState<boolean>(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [snackbar, setSnackbar] = useState<{open:boolean; message:string}>({ open: false, message: "" });

  useEffect(() => {
    api.get<{ user: User }>("/auth/me")
      .then(res => setUser(res.data.user))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(err => ({ ...err, [field]: "" }));
  };

  const handleCancel = () => {
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({});
    setChanging(false);
  };

  const handleSave = async (): Promise<void> => {
    const errs: Record<string,string> = {};
    if (!form.currentPassword) errs.currentPassword = "Required";
    if (form.newPassword.length < 8) errs.newPassword = "Min 8 chars";
    if (form.newPassword !== form.confirmPassword) errs.confirmPassword = "Passwords must match";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await api.put("/auth/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setSnackbar({ open: true, message: "Password updated" });
      handleCancel();
    } catch (err: any) {
        console.log("password‐change error:", err.response?.data);
        const status = err.response?.status;
        if (status === 400) {
          const msg = err.response.data?.message
            || err.response.data?.errors?.[0]?.msg
            || "Current password is incorrect";
          setErrors({ currentPassword: msg });
        } else {
          setSnackbar({
            open: true,
            message: err.response?.data?.message || "Update failed",
          });
        }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">Unable to load your profile.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 600, mx: "auto" }}>
      <Card sx={{ borderLeft: '6px solid darkblue', boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column", mb: 2 }}>
            <Avatar sx={{ width: 80, height: 80, mb: 1, bgcolor: 'gray' }}>
              {user.email.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h5" sx={{ color: 'darkblue' }} gutterBottom>
              {user.email}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {user.role}
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: 'darkblue' }} />

          <List disablePadding>
            <ListItem>
              <ListItemText primary="Email" secondary={user.email} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Role" secondary={user.role} />
            </ListItem>
            <ListItem>
              <ListItemText primary="User ID" secondary={user.id} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Settings ID" secondary={user.settings || '—'} />
            </ListItem>
          </List>

          <Divider sx={{ my: 2, borderColor: 'darkblue' }} />

          {changing ? (
            <Stack spacing={2}>
              <TextField
                label="Current Password"
                type="password"
                size="small"
                fullWidth
                value={form.currentPassword}
                onChange={handleChange('currentPassword')}
                error={!!errors.currentPassword}
                helperText={errors.currentPassword}
              />
              <TextField
                label="New Password"
                type="password"
                size="small"
                fullWidth
                value={form.newPassword}
                onChange={handleChange('newPassword')}
                error={!!errors.newPassword}
                helperText={errors.newPassword}
              />
              <TextField
                label="Confirm Password"
                type="password"
                size="small"
                fullWidth
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />
              <Box sx={{ textAlign: 'right' }}>
                <Button onClick={handleCancel} sx={{ mr: 1 }}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSave}>
                  Save
                </Button>
              </Box>
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Button variant="contained" onClick={() => setChanging(true)}>
                Change Password
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.message}
      />
    </Box>
  );
}
