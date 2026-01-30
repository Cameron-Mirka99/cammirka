import React from "react";
import { Navigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useAuth } from "./AuthProvider";

export const RequireAuth: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <Box sx={{ mt: 16, textAlign: "center", color: "text.secondary" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (status === "signedOut") {
    return <Navigate to="/login" replace />;
  }

  return children;
};
