import React, { useEffect, useState } from "react";
import { 
  Box, Typography, Grid, Paper, Chip, Button, Stack, 
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  IconButton, FormControlLabel, Switch, Divider 
} from "@mui/material";
import { WebhookIcon, HubSpotIcon } from "../../../components/integrations/integrationIcons"; 
import EditIcon from "@mui/icons-material/Edit"; 
import { useNavigate, useLocation } from "react-router-dom"; 
import axios from "axios";
import useAppStore from "../../../store/useAppStore";

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const IntegrationsGrid = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. Connection State
  const [isHubSpotConnected, setIsHubSpotConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 2. Modal States
  const [openDisconnectModal, setOpenDisconnectModal] = useState(false);
  const [openSettingsModal, setOpenSettingsModal] = useState(false);
  
  const [disconnecting, setDisconnecting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // 3. HubSpot Permissions State (Flat Structure)
  const [hubSpotSettings, setHubSpotSettings] = useState({
    read: false,
    write: false,
    update: false
  });

  const { user } = useAppStore();
  // These will now work without crashing the build
  const userId = user?.id; 
  // 🔍 DEBUG LOGS
//console.log("Extracted User:", user);
//console.log("Final User ID:", userId);

  // ---------------------------------------------------------------------------
  // 1. LOAD DATA (Refactored to fetch Settings)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const params = new URLSearchParams(location.search);
        if (params.get("success") === "true") {
           window.history.replaceState({}, document.title, window.location.pathname);
        }

        // ✅ CALL THE NEW SETTINGS ENDPOINT
        // This returns { connected: boolean, permissions: { read, write, update } }
        const res = await axios.get(`${API_BASE_URL}/hubspot/settings?userId=${userId}`);
        
        setIsHubSpotConnected(res.data.connected);
        
        // Load permissions if they exist
        if (res.data.permissions) {
          setHubSpotSettings(res.data.permissions);
        }

      } catch (err) {
        // If 404 or network error, assume disconnected
        setIsHubSpotConnected(false);
      } finally {
        setLoading(false);
      }
    };
    checkConnection();
  }, [userId, location.search]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  const handleConnect = () => {
    window.location.href = `${API_BASE_URL}/hubspot/install?userId=${userId}`;
  };

  const confirmDisconnect = async () => {
    setDisconnecting(true);
    try {
      await axios.post(`${API_BASE_URL}/hubspot/disconnect`, { userId });
      
      // Reset local state on disconnect
      setIsHubSpotConnected(false); 
      setHubSpotSettings({ read: false, write: false, update: false });
      
      setOpenDisconnectModal(false);
    } catch (err) {
      alert("Failed to disconnect.");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSettingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHubSpotSettings({
      ...hubSpotSettings,
      [event.target.name]: event.target.checked,
    });
  };

  // ---------------------------------------------------------------------------
  // 2. SAVE SETTINGS (Refactored to call Backend)
  // ---------------------------------------------------------------------------
  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      // ✅ CALL THE REAL BACKEND ROUTE
      await axios.post(`${API_BASE_URL}/hubspot/settings`, { 
        userId, 
        permissions: hubSpotSettings 
      });
      
      console.log("Settings saved successfully");
      setOpenSettingsModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <Box p={3}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold">Integrations</Typography>
        <Typography color="text.secondary">Connect Kalliq with your existing tools and workflows.</Typography>
      </Box>

      <Grid container spacing={3}>
        
        {/* --- WEBHOOK (Unchanged) --- */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "common.white", color: "primary.main", border: "1px solid #eee" }}>
                <WebhookIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>Webhook</Typography>
                <Chip label="Connected" color="success" size="small" sx={{ mt: 0.5, height: 24 }} />
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Send outbound events from Kalliq to your own webhook endpoint.
            </Typography>
            <Box mt="auto" pt={2}>
              <Button variant="contained" fullWidth onClick={() => navigate("/integrations/webhook")}>Configure</Button>
            </Box>
          </Paper>
        </Grid>

        {/* --- HUBSPOT --- */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
              {/* HubSpot Icon */}
              <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#fff1ee", color: "#ff7a59", flexShrink: 0 }}>
                <HubSpotIcon fontSize="medium" />
              </Box>
              
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                  <Typography variant="subtitle1" fontWeight={600}>HubSpot</Typography>
                  
                  {/* ✏️ EDIT ICON (Only shows when connected) */}
                  {isHubSpotConnected && !loading && (
                    <IconButton 
                      size="small" 
                      onClick={() => setOpenSettingsModal(true)}
                      sx={{ ml: 1, padding: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>

                {loading ? (
                   <Chip label="Checking..." size="small" sx={{ mt: 0.5, height: 24 }} />
                ) : isHubSpotConnected ? (
                   <Chip label="Connected" color="success" size="small" sx={{ mt: 0.5, height: 24 }} />
                ) : (
                   <Chip label="Not Connected" color="default" size="small" sx={{ mt: 0.5, height: 24 }} />
                )}
              </Box>
            </Stack>

            <Typography variant="body2" color="text.secondary" mb={2}>
              Sync contacts, static lists, and segments directly from HubSpot.
            </Typography>

            <Box mt="auto" pt={2}>
              {loading ? (
                <Button variant="outlined" fullWidth disabled>Loading...</Button>
              ) : isHubSpotConnected ? (
                <Button variant="outlined" color="error" fullWidth onClick={() => setOpenDisconnectModal(true)}>
                  Disconnect
                </Button>
              ) : (
                <Button variant="contained" fullWidth onClick={handleConnect} sx={{ bgcolor: "#ff7a59", "&:hover": { bgcolor: "#ff8f73" } }}>
                  Connect HubSpot
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* --- SETTINGS MODAL --- */}
      <Dialog open={openSettingsModal} onClose={() => setOpenSettingsModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>HubSpot Permissions</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: "0.9rem" }}>
            Manage data access permissions for HubSpot.
          </DialogContentText>
          
          <Stack spacing={2}>
            {/* 1. READ */}
            <FormControlLabel
              control={<Switch checked={hubSpotSettings.read} onChange={handleSettingChange} name="read" />}
              label={<Typography fontWeight={500}>Read from HubSpot</Typography>}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1, display: "block", ml: 4 }}>
              Allow importing contacts and lists.
            </Typography>
            <Divider />

            {/* 2. WRITE */}
            <FormControlLabel
              control={<Switch checked={hubSpotSettings.write} onChange={handleSettingChange} name="write" />}
              label={<Typography fontWeight={500}>Write to HubSpot</Typography>}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1, display: "block", ml: 4 }}>
              Allow creating new contacts in HubSpot.
            </Typography>
            <Divider />

            {/* 3. UPDATE */}
            <FormControlLabel
              control={<Switch checked={hubSpotSettings.update} onChange={handleSettingChange} name="update" />}
              label={<Typography fontWeight={500}>Update to HubSpot</Typography>}
            />
             <Typography variant="caption" color="text.secondary" sx={{ mt: -1, display: "block", ml: 4 }}>
              Allow updating existing contact properties.
            </Typography>
          </Stack>

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettingsModal(false)} color="inherit">Cancel</Button>
          <Button onClick={saveSettings} variant="contained" disabled={savingSettings}>
            {savingSettings ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DISCONNECT MODAL --- */}
      <Dialog open={openDisconnectModal} onClose={() => !disconnecting && setOpenDisconnectModal(false)}>
        <DialogTitle>Disconnect HubSpot?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to disconnect? This will stop all active syncs.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDisconnectModal(false)} color="inherit" disabled={disconnecting}>Cancel</Button>
          <Button onClick={confirmDisconnect} color="error" variant="contained" autoFocus disabled={disconnecting}>
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationsGrid;