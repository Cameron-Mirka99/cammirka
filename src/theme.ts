import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

export const createAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#FFB300", // Marigold
        light: "#FFD700",
        dark: "#FF9500",
      },
      secondary: {
        main: "#FF6B35", // Warm terracotta
        light: "#FF8C5A",
        dark: "#E85A2A",
      },
      background:
        mode === "light"
          ? {
              default: "#F7F5F2", // Warm light
              paper: "#FFFFFF",
            }
          : {
              default: "#0F1114", // Deep graphite
              paper: "#161A1F", // Slightly lighter graphite
            },
      text:
        mode === "light"
          ? {
              primary: "#1D2227",
              secondary: "#5B6470",
            }
          : {
              primary: "#FFFFFF",
              secondary: "#A0AEC0",
            },
      success: {
        main: mode === "light" ? "#2F7D32" : "#6366F1",
      },
    },
    typography: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      h1: {
        fontWeight: 700,
        letterSpacing: "-0.02em",
      },
      h2: {
        fontWeight: 700,
        letterSpacing: "-0.01em",
      },
      h3: {
        fontWeight: 600,
        letterSpacing: "-0.005em",
      },
      h4: {
        fontWeight: 600,
      },
      body1: {
        lineHeight: 1.8,
        letterSpacing: "0.3px",
      },
      body2: {
        lineHeight: 1.6,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            paddingLeft: 0,
            paddingRight: 0,
          },
        },
      },
    },
  });

