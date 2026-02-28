// src/theme.ts
import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface DashboardPalette {
    infoBg: string;
    infoMain: string;
    pendingBg: string;
    qualityBg: string;
    qualityMain: string;
    durationBg: string;
    durationMain: string;
    completedBg: string;
    completedMain: string;
    neutralBg: string;
    neutralMain: string;
    progressTrack: string;
    starInactive: string;
  }

  interface Palette {
    accent: Palette["primary"];
    sidebar: { background: string };
    navbar: { background: string };
    dashboard: DashboardPalette;
  }
  interface PaletteOptions {
    accent?: PaletteOptions["primary"];
    sidebar?: { background: string };
    navbar?: { background: string };
    dashboard?: DashboardPalette;
  }
}

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#f3a521",
    },
    secondary: {
      main: "#F25F4C",
    },
    background: {
      default: "#F8F9FB",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F0E17",
    },
    success: {
      main: "#2cb67d",
    },
    warning: {
      main: "#facc15",
    },
    error: {
      main: "#ef4444",
    },
    accent: {
      main: "#6246ea",
    },
    sidebar: {
      background: "#192335",
    },
    navbar: {
      background: "#FEFEFE",
    },
    dashboard: {
      infoBg: "#e8f0fe",
      infoMain: "#4285f4",
      pendingBg: "#fef3e2",
      qualityBg: "#fef9e7",
      qualityMain: "#f5c518",
      durationBg: "#f3e8fd",
      durationMain: "#8e44ad",
      completedBg: "#e6f4ea",
      completedMain: "#1e8e3e",
      neutralBg: "#f5f5f5",
      neutralMain: "#666666",
      progressTrack: "#e8eaed",
      starInactive: "#e0e0e0",
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 12,
  },
});

export default theme;
