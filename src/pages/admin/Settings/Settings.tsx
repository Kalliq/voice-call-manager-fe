import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import { settingsComponentRegistry } from "../../../registry/settings-component-registry";
import SettingsTypeWrapper from "../../../components/SettingsTypeWrapper";

import "react-resizable/css/styles.css";
import "./Settings.css";
import { useSettingsContext } from "../../../contexts/SettingsContext";

const Settings: React.FC = () => {
  const { selected, settings, keyMap } = useSettingsContext();
  const navigate = useNavigate();

  // Get original key for data lookup
  const originalParentKey = selected ? (keyMap?.[selected.parent] || selected.parent) : null;

  useEffect(() => {
    if (!settings || !selected || !originalParentKey || !settings[originalParentKey]) {
      navigate("/dashboard", { replace: true, state: { from: "settings" } });
    }
  }, [settings, selected, navigate, originalParentKey]);

  if (!settings || !selected || !originalParentKey || !settings[originalParentKey]) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 120px)",
        p: 0,
        flex: 1,
        overflow: "hidden",
      }}
    >
      {/* Drawer-aware content */}
      <Box
        className="hide-scrollbar"
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 4,
          py: 3,
        }}
      >
        {settings &&
          selected &&
          (() => {
            const Component =
              settingsComponentRegistry[selected.parent]?.[selected.child];
            if (!Component) return <Typography>{"Nothing found"}</Typography>;
            return (
              <SettingsTypeWrapper
                settingsName={selected.child}
                data={settings[originalParentKey]?.[selected.child]}
                Component={Component}
              />
            );
          })()}
      </Box>
    </Box>
  );
};

export default Settings;
