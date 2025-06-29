import { useState } from "react";
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
  BarChart as ReportsIcon,
  Task as TasksIcon,
  MenuBook as CoachingIcon,
  Phone,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

import logo from "../assets/logo_text.svg";
import { useAuth } from "../contexts/AuthContext";
import { useSettingsContext } from "../contexts/SettingsContext";
import { translateToTitleCase } from "../utils/translateToTitle";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import PhoneDialerPopover from "../components/PhoneDialPopover";

import api from "../utils/axiosInstance";

type SearchResult = { id: string; label: string };

const DRAWER_WIDTH = 240;
const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: <ReportsIcon /> },
  { label: "Lists", path: "/lists", icon: <ListsIcon /> },
  { label: "Contacts", path: "/contacts", icon: <ContactsIcon /> },
  { label: "Tasks", path: "/tasks", icon: <TasksIcon /> },
  { label: "Coaching", path: "/coaching", icon: <CoachingIcon /> },
];

export default function AdminLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { signout, isSuperadmin } = useAuth();

  const [avatarAnchor, setAvatarAnchor] = useState<null | HTMLElement>(null);
  const openAvatarMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAvatarAnchor(e.currentTarget);
  const closeAvatarMenu = () => setAvatarAnchor(null);

  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const openNotifMenu = (e: React.MouseEvent<HTMLElement>) =>
    setNotifAnchor(e.currentTarget);
  const closeNotifMenu = () => setNotifAnchor(null);

  const handleSignOut = () => {
    signout();
    navigate("/");
  };

  const isSettingsPage = location.pathname === "/settings";
  const { selected, settings, settingsKeys, handleChildClick } =
    useSettingsContext();
  const { options, loading: searchLoading, fetch } = useGlobalSearch();

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

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            backgroundColor: "#fff",
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Toolbar sx={{ justifyContent: "center" }}>
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{ height: 60, cursor: "pointer" }}
            onClick={() =>
              navigate(isSuperadmin ? "/superdashboard" : "/dashboard")
            }
          />
        </Toolbar>
        <Divider />
        <List>
          {!isSettingsPage
            ? navItems.map((item) => (
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
                    "&:hover": { backgroundColor: theme.palette.action.hover },
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItem>
              ))
            : settingsKeys.map((category) => (
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
                      {Object.keys(settings![category]).map((subKey) => (
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
                            primary={translateToTitleCase(subKey)}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
      </Drawer>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: `calc(100% - ${DRAWER_WIDTH}px)`,
            ml: `${DRAWER_WIDTH}px`,
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
              <Badge color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={notifAnchor}
              open={!!notifAnchor}
              onClose={closeNotifMenu}
            >
              <MenuItem onClick={closeNotifMenu}>Notification 1</MenuItem>
              <MenuItem onClick={closeNotifMenu}>Notification 2</MenuItem>
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
              <MenuItem onClick={closeAvatarMenu}>Profile</MenuItem>
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
