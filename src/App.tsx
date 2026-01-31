import React from "react";
import { Box, useTheme } from "@mui/material";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import MyPhotos from "./pages/MyPhotos";
import Admin from "./pages/Admin";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { RequireAdmin } from "./auth/RequireAdmin";

function App() {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const base = theme.palette.background.default;
  const paper = theme.palette.background.paper;

  return (
    <Box
      sx={{
        background:
          `linear-gradient(135deg, ${base} 0%, ${paper} 50%, ${base} 100%)`,
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
            top: "10%",
            right: "10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              isLight
                ? "radial-gradient(circle, rgba(255, 179, 0, 0.18) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(255, 179, 0, 0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
            animation: "float 20s ease-in-out infinite",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "10%",
            left: "10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              isLight
                ? "radial-gradient(circle, rgba(120, 130, 140, 0.14) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(120, 130, 140, 0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
            animation: "float 15s ease-in-out infinite",
            animationDelay: "5s",
          }}
        />
        <style>
          {`
            @keyframes float {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(30px);
              }
            }
          `}
        </style>
      </Box>

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
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
