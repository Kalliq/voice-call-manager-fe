import { useState, MouseEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Container,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
  TextField,
  InputAdornment,
  Badge,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Settings,
  Menu as MenuIcon,
  Add,
  Phone,
  PersonAdd,
  PlaylistAdd,
} from "@mui/icons-material";

import { useAuth } from "../contexts/AuthContext";
import useAppStore from "../store/useAppStore";
import Logo from "../assets/kalliq_grey.png";
import cfg from "../config";
import api from "../utils/axiosInstance";
import { initSocket } from "../utils/initSocket";

const version = import.meta.env.VITE_APP_VERSION;

export const colors = {
  background: "#16161a",
  headline: "#ffffff",
  buttonText: "#ffffff",
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  meta?: {
    threadId?: string;
    messageId?: string;
    contactId?: string;
    from?: string;
    subject?: string;
  };
}

const Header = () => {
  const { signout, isSuperadmin } = useAuth();
  const { user } = useAppStore();
  const navigate = useNavigate();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [notificationsAnchorEl, setNotificationsAnchorEl] =
    useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const toggleDrawer = (open: boolean) => () => setDrawerOpen(open);
  const handleMenuOpen = (event: MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleAddMenuOpen = (event: MouseEvent<HTMLElement>) =>
    setAddMenuAnchorEl(event.currentTarget);
  const handleAddMenuClose = () => setAddMenuAnchorEl(null);

  const handleNotificationsOpen = (event: MouseEvent<HTMLElement>) =>
    setNotificationsAnchorEl(event.currentTarget);
  const handleNotificationsClose = () => setNotificationsAnchorEl(null);

  const onClickProfileHandler = () => {};

  const onClickSignOutHandler = async () => {
    try {
      handleMenuClose();
      await signout();
      navigate("/");
    } catch (error) {
      console.error("Signout failed: ", error);
    }
  };

  const handleDialerClick = () => {
    // Implement dialer functionality
    console.log("Opening dialer pad");
    // Or window.location.href = "tel:+1234567890";
  };

  const handleAddContact = () => {
    handleAddMenuClose();
    navigate("/contacts/add");
  };

  const handleAddList = () => {
    handleAddMenuClose();
    navigate("/lists/add");
  };

  // Fetch notifications on mount
  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const response = await api.get<Notification[]>("/notifications?limit=50");
        setNotifications(response.data || []);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();

    // Subscribe to socket events for realtime updates
    const socket = initSocket(user.id);
    socket.on("notification:new", (newNotification: Notification) => {
      // Check if notification already exists (dedupe by id or meta.messageId)
      setNotifications((prev) => {
        const exists = prev.some(
          (n) =>
            n.id === newNotification.id ||
            (n.meta?.messageId &&
              newNotification.meta?.messageId &&
              n.meta.messageId === newNotification.meta.messageId)
        );
        if (exists) return prev;
        // Prepend new notification
        return [newNotification, ...prev].slice(0, 50);
      });
    });

    return () => {
      socket.off("notification:new");
    };
  }, [user?.id]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  // Mark notification as read
  const handleNotificationClick = async (notification: Notification) => {
    if (notification.isRead) {
      handleNotificationsClose();
      return;
    }

    try {
      await api.patch(`/notifications/${notification.id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
    handleNotificationsClose();
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={2}
        sx={{
          backgroundColor: colors.background,
          color: colors.headline,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Left side - Logo and mobile menu */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                edge="start"
                sx={{
                  color: colors.headline,
                  display: { xs: "block", md: "none" },
                }}
                onClick={toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
              <Box
                sx={{
                  height: 80,
                  cursor: "pointer",
                  filter: "brightness(0) invert(1)",
                }}
                onClick={() =>
                  isSuperadmin
                    ? navigate("/superdashboard")
                    : navigate("/dashboard")
                }
              >
                <img src={Logo} style={{ height: "100%" }} alt="Logo" />
              </Box>
            </Box>

            {/* Right side - Action icons */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* Add Button with Dropdown */}
              <IconButton
                sx={{ color: colors.headline }}
                onClick={handleAddMenuOpen}
              >
                <Add />
              </IconButton>
              <Menu
                anchorEl={addMenuAnchorEl}
                open={Boolean(addMenuAnchorEl)}
                onClose={handleAddMenuClose}
                PaperProps={{
                  sx: {
                    backgroundColor: colors.background,
                    color: colors.headline,
                  },
                }}
              >
                <MenuItem onClick={handleAddContact}>
                  <ListItemIcon>
                    <PersonAdd sx={{ color: theme.palette.info.main }} />
                  </ListItemIcon>
                  <ListItemText>Add Contact</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleAddList}>
                  <ListItemIcon>
                    <PlaylistAdd sx={{ color: theme.palette.info.main }} />
                  </ListItemIcon>
                  <ListItemText>Add List</ListItemText>
                </MenuItem>
              </Menu>

              {/* Phone Button */}
              <IconButton
                sx={{ color: colors.headline }}
                onClick={handleDialerClick}
              >
                <Phone />
              </IconButton>

              {/* Notifications with Dropdown */}
              <IconButton
                sx={{ color: colors.headline }}
                onClick={handleNotificationsOpen}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <Menu
                anchorEl={notificationsAnchorEl}
                open={Boolean(notificationsAnchorEl)}
                onClose={handleNotificationsClose}
                PaperProps={{
                  sx: {
                    backgroundColor: colors.background,
                    color: colors.headline,
                    width: 320,
                    maxHeight: 400,
                  },
                }}
              >
                <Typography variant="h6" sx={{ p: 2 }}>
                  Notifications
                </Typography>
                <Divider />
                {loadingNotifications ? (
                  <Typography variant="body2" sx={{ p: 2 }}>
                    Loading...
                  </Typography>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <MenuItem
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        backgroundColor: notification.isRead
                          ? "transparent"
                          : "rgba(25, 118, 210, 0.08)",
                      }}
                    >
                      <ListItemText
                        primary={notification.title || notification.message}
                        secondary={formatTimeAgo(notification.createdAt)}
                        sx={{
                          "& .MuiListItemText-primary": {
                            fontSize: "0.875rem",
                            fontWeight: notification.isRead ? "normal" : 600,
                          },
                          "& .MuiListItemText-secondary": {
                            fontSize: "0.75rem",
                          },
                        }}
                      />
                    </MenuItem>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ p: 2 }}>
                    No new notifications
                  </Typography>
                )}
              </Menu>

              <IconButton
                sx={{ color: colors.headline }}
                onClick={handleMenuOpen}
              >
                <Avatar />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    backgroundColor: colors.background,
                    color: colors.headline,
                  },
                }}
              >
                <MenuItem onClick={onClickProfileHandler}>Profile</MenuItem>
                <MenuItem onClick={onClickSignOutHandler}>Sign Out</MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Typography variant="caption" color="black" sx={{ ml: 1 }}>
        {!cfg.isDevMode ? `Version: v${version}` : null}
      </Typography>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{
            width: 260,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: colors.background,
            color: colors.headline,
          }}
        >
          <Box
            sx={{
              p: 2,
              backgroundColor: theme.palette.info.main,
              color: colors.buttonText,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Box component="img" alt="Kalliq" sx={{ height: 40 }}>
              <img src={Logo} style={{ height: "100%" }} alt="Logo" />
            </Box>
          </Box>
          <Divider />

          <List>
            {/* Add Actions - Mobile */}
            <ListItem
              onClick={handleAddList}
              sx={{
                color: colors.headline,
                "&:hover": {
                  backgroundColor: theme.palette.info.main,
                  color: colors.buttonText,
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.info.main }}>
                <PlaylistAdd />
              </ListItemIcon>
              <ListItemText primary="Add List" />
            </ListItem>

            {/* Phone Action - Mobile */}
            <ListItem
              onClick={handleDialerClick}
              sx={{
                color: colors.headline,
                "&:hover": {
                  backgroundColor: theme.palette.info.main,
                  color: colors.buttonText,
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.info.main }}>
                <Phone />
              </ListItemIcon>
              <ListItemText primary="Dialer" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
