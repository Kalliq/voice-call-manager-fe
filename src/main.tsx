import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter as Router } from "react-router-dom";

import { ThemeProvider, CssBaseline } from "@mui/material";

import "./index.css";
import App from "./App";
import theme from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import { SnackbarProvider } from "./hooks/useSnackbar";
import { SettingsProvider } from "./contexts/SettingsContext";
import { GoogleCalendarProvider } from './contexts/GoogleCalendarContext';

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <AuthProvider>
          <SettingsProvider>
            <Router>
              <GoogleCalendarProvider>
                <App />
              </GoogleCalendarProvider>
            </Router>
          </SettingsProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>
);
