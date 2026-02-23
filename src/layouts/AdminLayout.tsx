import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  ListItemButton,
  Avatar,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Search,
  List as ListsIcon,
  Contacts as ContactsIcon,
  BarChart as DashboardIcon,
  Task as TasksIcon,
  MenuBook as CoachingIcon,
  Phone,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ContactPhone as ContactPhoneIcon,
  Summarize as ReportsIcon,
  Extension as IntegrationsIcon,
  ChevronLeft,
  ChevronRight,
  AccountBalance,
} from "@mui/icons-material";
import Logo from "../assets/kalliq_grey.png";
import { useAuth } from "../contexts/AuthContext";
import { useSettingsContext } from "../contexts/SettingsContext";
import { translateToTitleCase } from "../utils/translateToTitle";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import PhoneDialerPopover from "../components/PhoneDialPopover";
import { settingsComponentRegistry } from "../registry/settings-component-registry";
import useAppStore from "../store/useAppStore";
import { initSocket } from "../utils/initSocket";

import api from "../utils/axiosInstance";

type SearchResult = { id: string; label: string };

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

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 80;
const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "Lists", path: "/lists", icon: <ListsIcon /> },
  { label: "Contacts", path: "/contacts", icon: <ContactsIcon /> },
  { label: "Accounts", path: "/accounts", icon: <AccountBalance /> },
  { label: "Tasks", path: "/tasks", icon: <TasksIcon /> },
  { label: "My Numbers", path: "/my-numbers", icon: <ContactPhoneIcon /> },
  { label: "Coaching", path: "/coaching", icon: <CoachingIcon /> },
  { label: "Reports", path: "/reports", icon: <ReportsIcon /> },
  {
    label: "Integrations",
    path: "/integrations",
    icon: <IntegrationsIcon />,
    adminOnly: true,
  },
];

export default function AdminLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { signout, isAdmin, isSuperadmin } = useAuth();
  const { user } = useAppStore();

  // Declare isSettingsPage immediately after location to avoid initialization error
  const isSettingsPage = location.pathname === "/settings";

  const [collapsed, setCollapsed] = useState(false);
  const drawerWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Lock sidebar open when on Settings route
  useEffect(() => {
    if (isSettingsPage && collapsed) {
      setCollapsed(false);
    }
  }, [isSettingsPage, collapsed]);

  const [avatarAnchor, setAvatarAnchor] = useState<null | HTMLElement>(null);
  const openAvatarMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAvatarAnchor(e.currentTarget);
  const closeAvatarMenu = () => setAvatarAnchor(null);

  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const openNotifMenu = (e: React.MouseEvent<HTMLElement>) =>
    setNotifAnchor(e.currentTarget);
  const closeNotifMenu = () => setNotifAnchor(null);

  const handleSignOut = async () => {
    await signout();
    navigate("/");
  };

  const { selected, settings, settingsKeys, handleChildClick, keyMap } =
    useSettingsContext();
  const { options, loading: searchLoading, fetch } = useGlobalSearch();

  // Custom label mapping for settings sub-items
  const getSettingsLabel = (subKey: string): string => {
    const customLabels: Record<string, string> = {
      schedulesManagement: "Timezone & Schedules",
      emailAccount: "Accounts",
      signature: "Signature",
      templates: "Templates",
    };
    return customLabels[subKey] || translateToTitleCase(subKey);
  };

  const onSearchSelect = (_: any, value: { id: string; label: string }) => {
    if (!value) return;
    navigate("/campaign", {
      state: { contactId: value.id, autoStart: false },
    });
  };

  const [phoneAnchorEl, setPhoneAnchorEl] = useState<null | HTMLElement>(null);

  const openPhoneDialer = (e: React.MouseEvent<HTMLElement>) =>
    setPhoneAnchorEl(e.currentTarget);
  const closePhoneDialer = () => setPhoneAnchorEl(null);

  const onCall = async (phone: string) => {
    let contactId: string | null = null;
    try {
      const { data } = await api.get(
        `/contacts/lookup-by-phone?phone=${phone}`
      );
      contactId = data.id;
    } catch (err: any) {
      if (err.response?.status !== 404) {
        // Handle or rethrow unexpected errors
        console.error("Unexpected error:", err);
        return;
      }
    }
    setPhoneAnchorEl(null);

    navigate("/campaign", {
      state: {
        contactId: contactId,
        phone: phone,
        autoStart: false,
      },
    });
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
      closeNotifMenu();
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
    closeNotifMenu();
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
          flexShrink: 0,
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
          "& .MuiDrawer-paper": {
            width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
            boxSizing: "border-box",
            backgroundColor: "#fff",
            borderRight: `1px solid ${theme.palette.divider}`,
            overflowX: "hidden",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.standard,
            }),
          },
        }}
      >
        <Toolbar sx={{ justifyContent: "center" }}>
          <Box
            sx={{ height: 60, cursor: "pointer" }}
            onClick={() =>
              navigate(isSuperadmin ? "/superdashboard" : "/dashboard")
            }
          >
            <img src={Logo} style={{ height: "100%" }} alt="Logo" />
          </Box>
        </Toolbar>
        <Divider />
        <List>
          {!isSettingsPage
            ? navItems
                .filter((item) => {
                  if (!item.adminOnly) return true;
                  return isAdmin;
                })
                .map((item) => (
                  <ListItem
                    key={item.label}
                    component={NavLink}
                    to={item.path}
                    sx={{
                      color: theme.palette.text.primary,
                      "&.active": {
                        backgroundColor: theme.palette.action.selected,
                        fontWeight: "bold",
                      },
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                      justifyContent: collapsed ? "center" : "flex-start",
                      px: collapsed ? 2 : 3,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: "inherit",
                        minWidth: "auto",
                        justifyContent: "center",
                        marginRight: collapsed ? 0 : "10px",
                        transition: theme.transitions.create("margin-right", {
                          easing: theme.transitions.easing.easeInOut,
                          duration: theme.transitions.duration.shorter,
                        }),
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText 
                        primary={item.label}
                        sx={{
                          transition: theme.transitions.create("opacity", {
                            easing: theme.transitions.easing.easeInOut,
                            duration: theme.transitions.duration.shorter,
                          }),
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                        }}
                      />
                    )}
                  </ListItem>
                ))
            : settings && settingsKeys.length > 0
              ? settingsKeys
                  .filter((category) => {
                    // Use original key from keyMap for lookup
                    const originalKey = keyMap?.[category] || category;
                    return settings[originalKey] != null;
                  })
                  .map((category) => {
                    // Get original key for data lookup
                    const originalKey = keyMap?.[category] || category;
                    return { category, originalKey };
                  })
                  .map(({ category, originalKey }) => (
                    <Accordion
                      key={category}
                      square
                      disableGutters
                      elevation={0}
                      defaultExpanded={category === "Phone Settings"}
                      sx={{
                        boxShadow: "none",
                        borderRadius: 0,
                        "&:before": { display: "none" },
                        "&.Mui-expanded": {
                          margin: 0,
                        },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {category}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List disablePadding>
                          {Object.keys(settings[originalKey] ?? {})
                            .filter((subKey) => {
                              // Only show sub-items that have registered components
                              return settingsComponentRegistry[category]?.[subKey] != null;
                            })
                            .map((subKey) => (
                              <ListItemButton
                                key={subKey}
                                selected={
                                  selected?.parent === category &&
                                  selected?.child === subKey
                                }
                                onClick={() => handleChildClick(category, subKey)}
                                sx={{
                                  borderBottom: `1px solid ${theme.palette.divider}`,
                                  pl: 3,
                                  pr: 2,
                                }}
                              >
                                <ListItemText
                                  primary={getSettingsLabel(subKey)}
                                />
                              </ListItemButton>
                            ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))
              : null}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        {/* Bottom toggle button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <IconButton
            onClick={() => {
              if (!isSettingsPage) {
                setCollapsed(!collapsed);
              }
            }}
            disabled={isSettingsPage}
            sx={{
              color: theme.palette.text.secondary,
              transition: theme.transitions.create(["background-color", "transform"], {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.shorter,
              }),
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                transform: "scale(1.1)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
              "&.Mui-disabled": {
                opacity: 0.5,
                transform: "none",
              },
            }}
          >
            {collapsed ? (
              <ChevronRight 
                sx={{
                  transition: theme.transitions.create("transform", {
                    easing: theme.transitions.easing.easeInOut,
                    duration: theme.transitions.duration.shorter,
                  }),
                }}
              />
            ) : (
              <ChevronLeft 
                sx={{
                  transition: theme.transitions.create("transform", {
                    easing: theme.transitions.easing.easeInOut,
                    duration: theme.transitions.duration.shorter,
                  }),
                }}
              />
            )}
          </IconButton>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: `calc(100% - ${drawerWidth}px)`,
            ml: `${drawerWidth}px`,
            backgroundColor: "#fff",
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar>
            <Box sx={{ width: 300 }}>
              <Autocomplete<SearchResult, false, false, false>
                freeSolo={false}
                size="small"
                options={options}
                getOptionLabel={(opt) =>
                  typeof opt === "string" ? opt : opt.label
                }
                loading={searchLoading}
                onInputChange={(_, value) => {
                  if (value.trim()) fetch(value);
                }}
                onChange={(e, v) => v && onSearchSelect(e, v as SearchResult)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search contacts…"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {searchLoading ? (
                            <CircularProgress size={16} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={openPhoneDialer}>
              <Phone />
            </IconButton>
            <IconButton onClick={openNotifMenu}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={notifAnchor}
              open={!!notifAnchor}
              onClose={closeNotifMenu}
              PaperProps={{
                sx: {
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
            <IconButton onClick={() => navigate("/settings")}>
              <SettingsIcon />
            </IconButton>
            <IconButton onClick={openAvatarMenu}>
              <Avatar />
            </IconButton>
            <Menu
              anchorEl={avatarAnchor}
              open={!!avatarAnchor}
              onClose={closeAvatarMenu}
            >
              <MenuItem onClick={() => {closeAvatarMenu(); 
                                        navigate("/auth/me"); 
                                      }}>Profile</MenuItem>
              <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Toolbar />
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
      <PhoneDialerPopover
        anchorEl={phoneAnchorEl}
        onClose={closePhoneDialer}
        onCall={onCall}
      />
    </Box>
  );
}
