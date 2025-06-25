import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";

import "./index.css";
import App from "./App";
import theme from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import { TwilioProvider } from "./contexts/TwilioContext";
import { SnackbarProvider } from "./hooks/useSnackbar";
import { SettingsProvider } from "./contexts/SettingsContext";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <AuthProvider>
          <TwilioProvider>
            <SettingsProvider>
              <App />
            </SettingsProvider>
          </TwilioProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>
);
