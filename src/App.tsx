import React from "react";
import { Box, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Archive from "./pages/Archive";
import About from "./pages/About";
import Login from "./pages/Login";
import MyPhotos from "./pages/MyPhotos";
import Admin from "./pages/Admin";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { RequireAdmin } from "./auth/RequireAdmin";

function App() {
  const location = useLocation();
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const base = theme.palette.background.default;
  const paper = theme.palette.background.paper;

  return (
    <Box
      sx={{
        background: `linear-gradient(180deg, ${base} 0%, ${paper} 100%)`,
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "-8%",
            right: "-4%",
            width: "42vw",
            height: "42vw",
            minWidth: 280,
            minHeight: 280,
            borderRadius: "50%",
            background:
              isLight
                ? `radial-gradient(circle, ${alpha("#B88A2A", 0.12)} 0%, transparent 70%)`
                : `radial-gradient(circle, ${alpha("#B88A2A", 0.14)} 0%, transparent 70%)`,
            opacity: 0.9,
            animation: "appOrbDrift 18s ease-in-out infinite",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "-18%",
            left: "-6%",
            width: "36vw",
            height: "36vw",
            minWidth: 240,
            minHeight: 240,
            borderRadius: "50%",
            background:
              isLight
                ? `radial-gradient(circle, ${alpha("#7F8A78", 0.12)} 0%, transparent 70%)`
                : `radial-gradient(circle, ${alpha("#7F8A78", 0.1)} 0%, transparent 70%)`,
            opacity: 0.85,
            animation: "appOrbDrift 24s ease-in-out infinite reverse",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: "18%",
            left: "-10%",
            width: "72vw",
            height: 1,
            background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, isLight ? 0.18 : 0.22)} 35%, transparent 100%)`,
            transformOrigin: "left center",
            animation: "appLinePulse 12s ease-in-out infinite",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: "-12%",
            backgroundImage: `linear-gradient(${alpha(theme.palette.text.primary, 0.035)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.palette.text.primary, 0.035)} 1px, transparent 1px)`,
            backgroundSize: "120px 120px",
            maskImage: "radial-gradient(circle at center, rgba(0,0,0,0.9), transparent 78%)",
            animation: "appGridDrift 28s ease-in-out infinite",
            opacity: isLight ? 0.3 : 0.22,
          }}
        />
      </Box>

      <Box
        key={location.pathname}
        sx={{
          position: "relative",
          zIndex: 1,
          animation: "appFloatIn 720ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <AuthProvider>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/my-photos"
              element={
                <RequireAuth>
                  <MyPhotos />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <Admin />
                </RequireAdmin>
              }
            />
          </Routes>
        </AuthProvider>
      </Box>
    </Box>
  );
}

export default App;
