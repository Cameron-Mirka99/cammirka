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
          "@keyframes appOrbDrift": {
            "0%": {
              transform: "translate3d(0, 0, 0) scale(1)",
            },
            "50%": {
              transform: "translate3d(0, -18px, 0) scale(1.06)",
            },
            "100%": {
              transform: "translate3d(0, 0, 0) scale(1)",
            },
          },
          "@keyframes appGlowSweep": {
            "0%": {
              transform: "translate3d(-8%, 0, 0) scaleX(1)",
              opacity: 0.45,
            },
            "50%": {
              transform: "translate3d(8%, -2%, 0) scaleX(1.08)",
              opacity: 0.8,
            },
            "100%": {
              transform: "translate3d(-8%, 0, 0) scaleX(1)",
              opacity: 0.45,
            },
          },
          "@keyframes appHeroPan": {
            "0%": {
              transform: "scale(1.02) translate3d(0, 0, 0)",
            },
            "50%": {
              transform: "scale(1.08) translate3d(0, -1.5%, 0)",
            },
            "100%": {
              transform: "scale(1.02) translate3d(0, 0, 0)",
            },
          },
          "@keyframes appLinePulse": {
            "0%": {
              transform: "scaleX(0.72)",
              opacity: 0.35,
            },
            "50%": {
              transform: "scaleX(1)",
              opacity: 1,
            },
            "100%": {
              transform: "scaleX(0.72)",
              opacity: 0.35,
            },
          },
          "@keyframes appGridDrift": {
            "0%": {
              transform: "translate3d(0, 0, 0)",
            },
            "50%": {
              transform: "translate3d(24px, 12px, 0)",
            },
            "100%": {
              transform: "translate3d(0, 0, 0)",
            },
          },
          "@keyframes appFloatIn": {
            "0%": {
              opacity: 0,
              transform: "translate3d(0, 26px, 0) scale(0.98)",
              filter: "blur(10px)",
            },
            "100%": {
              opacity: 1,
              transform: "translate3d(0, 0, 0) scale(1)",
              filter: "blur(0)",
            },
          },
          html: {
            scrollBehavior: "smooth",
          },
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
          "@media (prefers-reduced-motion: reduce)": {
            html: {
              scrollBehavior: "auto",
            },
            "*, *::before, *::after": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            padding: "0.9rem 1.5rem",
            transition:
              "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), background-color 220ms ease, border-color 220ms ease, color 220ms ease, box-shadow 260ms ease",
          },
          containedPrimary: {
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
              transform: "translateY(-2px)",
            },
          },
          outlined: {
            borderColor: isLight
              ? "rgba(25, 23, 19, 0.16)"
              : "rgba(234, 228, 216, 0.18)",
            "&:hover": {
              borderColor: alpha("#B88A2A", 0.7),
              backgroundColor: alpha("#B88A2A", 0.08),
              transform: "translateY(-2px)",
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

