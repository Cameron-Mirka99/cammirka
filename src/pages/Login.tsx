import { Authenticator } from "@aws-amplify/ui-react";
import { Box, Container, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { authFetch } from "../utils/authFetch";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { Header } from "../components/Header";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { status, refresh } = useAuth();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const invite = params.get("invite");
    if (invite) {
      localStorage.setItem("inviteCode", invite);
      setMessage("Invite detected. Complete sign-in to activate access.");
    }
  }, [location.search]);

  useEffect(() => {
    const handleInvite = async () => {
      if (status !== "signedIn") return;
      const inviteCode = localStorage.getItem("inviteCode");
      if (!inviteCode) {
        navigate("/my-photos");
        return;
      }
      if (!photoApiBaseUrl) {
        setMessage("REACT_APP_PHOTO_API_URL is not configured.");
        return;
      }

      const res = await authFetch(`${photoApiBaseUrl}/accept-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setMessage(payload?.message ?? "Invite could not be accepted.");
        return;
      }
      localStorage.removeItem("inviteCode");
      await refresh();
      navigate("/my-photos");
    };

    handleInvite().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Invite error");
    });
  }, [status, refresh, navigate]);

  return (
    <>
      <Header />
      <Container maxWidth="sm" sx={{ mt: { xs: 10, sm: 12, md: 14 }, color: "white" }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Sign in
        </Typography>
        {message && (
          <Box sx={{ mb: 2, color: "rgba(255,255,255,0.7)" }}>{message}</Box>
        )}
        <Authenticator />
      </Container>
    </>
  );
}
