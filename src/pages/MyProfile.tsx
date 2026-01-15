// src/pages/MyProfile.tsx
import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  TextField,
  Button,
  Stack,
  InputAdornment,
} from "@mui/material";
import { CalendarToday, Logout } from "@mui/icons-material";
import api from "../utils/axiosInstance";
import { useSnackbar } from "../hooks/useSnackbar";
import { useAuth } from "../contexts/AuthContext";
import { SimpleButton } from "../components/UI/SimpleButton";

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  location?: string;
  calendarLink?: string;
  funFact?: string;
}

export default function MyProfile() {
  const { enqueue } = useSnackbar();
  const { signout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form state
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [calendarLink, setCalendarLink] = useState<string>("");
  const [funFact, setFunFact] = useState<string>("");

  // Initial values to track dirty state
  const [initialValues, setInitialValues] = useState({
    firstName: "",
    lastName: "",
    title: "",
    location: "",
    calendarLink: "",
    funFact: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get<{ user: User }>("/auth/me");
        setUser(data.user);
        const userData = data.user;
        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setTitle(userData.title || "");
        setLocation(userData.location || "");
        setCalendarLink(userData.calendarLink || "");
        setFunFact(userData.funFact || "");
        setInitialValues({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          title: userData.title || "",
          location: userData.location || "",
          calendarLink: userData.calendarLink || "",
          funFact: userData.funFact || "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        enqueue("Failed to load profile", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [enqueue]);

  // Check if form is dirty
  const isDirty =
    firstName !== initialValues.firstName ||
    lastName !== initialValues.lastName ||
    title !== initialValues.title ||
    location !== initialValues.location ||
    calendarLink !== initialValues.calendarLink ||
    funFact !== initialValues.funFact;

  const handleSave = async () => {
    if (!isDirty || saving) return;

    // Validate fun fact length
    if (funFact.length > 180) {
      enqueue("Fun fact must be 180 characters or less", { variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put<{ user: User }>("/auth/me", {
        firstName,
        lastName,
        title,
        location,
        calendarLink,
        funFact,
      });

      setUser(data.user);
      setInitialValues({
        firstName: data.user.firstName || "",
        lastName: data.user.lastName || "",
        title: data.user.title || "",
        location: data.user.location || "",
        calendarLink: data.user.calendarLink || "",
        funFact: data.user.funFact || "",
      });

      enqueue("Profile updated successfully", { variant: "success" });
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      enqueue(err?.response?.data?.message || "Failed to update profile", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signout();
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  const getDisplayName = () => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    return user?.email || "User";
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>Loading profile...</Typography>
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
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: "auto" }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {/* Header with Avatar, Name, Email, and Logout */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 4, gap: 2 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: "primary.main",
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            {getInitials()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight={600}>
              {getDisplayName()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{ minWidth: 120 }}
          >
            Log out
          </Button>
        </Box>

        {/* Editable Fields */}
        <Stack spacing={3}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="First Name"
              fullWidth
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
            />
            <TextField
              label="Last Name"
              fullWidth
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
            />
          </Box>

          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your title"
          />

          <TextField
            label="Location"
            fullWidth
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your location"
          />

          <TextField
            label="Link to Calendar"
            fullWidth
            value={calendarLink}
            onChange={(e) => setCalendarLink(e.target.value)}
            placeholder="https://calendly.com/your-link"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarToday fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Fun Fact"
            fullWidth
            multiline
            rows={4}
            value={funFact}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 180) {
                setFunFact(value);
              }
            }}
            placeholder="Tell us something interesting about yourself..."
            helperText={`${funFact.length}/180 characters`}
            inputProps={{ maxLength: 180 }}
          />

          {/* Save Button - only visible when form is dirty */}
          {isDirty && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 2 }}>
              <SimpleButton
                label="Save"
                onClick={handleSave}
                loading={saving}
                disabled={saving}
              />
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
