import { alpha, createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

export const createAppTheme = (mode: PaletteMode) => {
  const isLight = mode === "light";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#B88A2A",
        light: "#D6AA4C",
        dark: "#8F6716",
      },
      secondary: {
        main: "#7F8A78",
        light: "#9AA494",
        dark: "#606A59",
      },
      background: isLight
        ? {
            default: "#F3EEE3",
            paper: "#FBF8F1",
          }
        : {
            default: "#0F0F0C",
            paper: "#171713",
          },
      text: isLight
        ? {
            primary: "#191713",
            secondary: "#615B50",
          }
        : {
            primary: "#EAE4D8",
            secondary: "#A8A18F",
          },
      divider: isLight
        ? "rgba(25, 23, 19, 0.12)"
        : "rgba(234, 228, 216, 0.12)",
      success: {
        main: isLight ? "#47624B" : "#7E987D",
      },
    },
    typography: {
      fontFamily: "'Manrope', 'Segoe UI', sans-serif",
      h1: {
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 600,
        lineHeight: 0.92,
        letterSpacing: "-0.04em",
      },
      h2: {
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 600,
        lineHeight: 0.96,
        letterSpacing: "-0.03em",
      },
      h3: {
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "-0.025em",
      },
      h4: {
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 600,
        lineHeight: 1.02,
        letterSpacing: "-0.02em",
      },
      h5: {
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 600,
        lineHeight: 1.08,
      },
      h6: {
        fontWeight: 700,
        letterSpacing: "0.02em",
      },
      subtitle1: {
        fontSize: "0.88rem",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      },
      body1: {
        lineHeight: 1.8,
        letterSpacing: "0.01em",
      },
      body2: {
        lineHeight: 1.7,
        letterSpacing: "0.01em",
      },
      button: {
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      },
    },
    shape: {
      borderRadius: 18,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isLight ? "#F3EEE3" : "#0F0F0C",
            backgroundImage: isLight
              ? "radial-gradient(circle at top, rgba(184, 138, 42, 0.1), transparent 30%)"
              : "radial-gradient(circle at top, rgba(184, 138, 42, 0.14), transparent 28%)",
          },
          "::selection": {
            backgroundColor: isLight
              ? "rgba(184, 138, 42, 0.22)"
              : "rgba(184, 138, 42, 0.3)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            padding: "0.9rem 1.5rem",
            transition: "transform 180ms ease, background-color 180ms ease, border-color 180ms ease, color 180ms ease",
          },
          containedPrimary: {
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
              transform: "translateY(-1px)",
            },
          },
          outlined: {
            borderColor: isLight
              ? "rgba(25, 23, 19, 0.16)"
              : "rgba(234, 228, 216, 0.18)",
            "&:hover": {
              borderColor: alpha("#B88A2A", 0.7),
              backgroundColor: alpha("#B88A2A", 0.08),
              transform: "translateY(-1px)",
            },
          },
          text: {
            "&:hover": {
              backgroundColor: "transparent",
              color: "#B88A2A",
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: "none",
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
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
};

