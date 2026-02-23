import { createRoot } from "react-dom/client";
import { HashRouter as Router } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider, CssBaseline } from "@mui/material";

import "./index.css";
import App from "./App";
import theme from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import { SnackbarProvider } from "./hooks/useSnackbar";
import { SettingsProvider } from "./contexts/SettingsContext";

const DEFAULT_STALE_AND_CACHE_TIME = 15 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_AND_CACHE_TIME,
      gcTime: DEFAULT_STALE_AND_CACHE_TIME,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <AuthProvider>
          <SettingsProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Router>
                <App />
              </Router>
            </LocalizationProvider>
          </SettingsProvider>
        </AuthProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  </ThemeProvider>,
);
