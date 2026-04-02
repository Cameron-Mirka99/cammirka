import { Authenticator } from "@aws-amplify/ui-react";
import { Box, Container, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
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
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 5, md: 8 } }}>
        <Box
          sx={{
            maxWidth: 1120,
            mx: "auto",
            minHeight: { xs: "auto", md: "calc(100vh - 220px)" },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "0.88fr 1.12fr" },
            border: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            borderRadius: { xs: 4, md: 6 },
            overflow: "hidden",
            backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.76),
            backdropFilter: "blur(20px)",
          }}
        >
          <Box
            sx={{
              px: { xs: 3, sm: 4, md: 5 },
              py: { xs: 4, md: 5 },
              background:
                "linear-gradient(180deg, rgba(18, 18, 14, 0.18) 0%, rgba(18, 18, 14, 0.64) 100%), radial-gradient(circle at 78% 22%, rgba(184, 138, 42, 0.24), transparent 22%), linear-gradient(135deg, #171713 0%, #0F0F0C 100%)",
              color: "#F7F1E3",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 4,
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ color: alpha("#F7F1E3", 0.7), mb: 2 }}>
                Private Gallery Access
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "clamp(2.4rem, 12vw, 3.5rem)", md: "clamp(3.4rem, 5vw, 4.7rem)" },
                  color: "#F7F1E3",
                  maxWidth: 420,
                }}
              >
                Sign in to enter your private archive.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mt: 3,
                  maxWidth: 420,
                  color: alpha("#F7F1E3", 0.72),
                }}
              >
                Use your invite to unlock access to your gallery. Once signed in, you&apos;ll be taken directly to the
                images available to your account.
              </Typography>
            </Box>

            <Box sx={{ maxWidth: 420 }}>
              <Typography sx={{ fontSize: "0.76rem", letterSpacing: "0.14em", textTransform: "uppercase", color: alpha("#F7F1E3", 0.62), mb: 1.25 }}>
                Access Notes
              </Typography>
              <Typography variant="body2" sx={{ color: alpha("#F7F1E3", 0.68) }}>
                Invite links connect your account to the correct gallery folder. If you reached this page from an
                invite, keep going through sign-in and the access will be applied automatically.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 4, md: 5 }, color: "text.primary" }}>
            <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1.5 }}>
              Account Access
            </Typography>
            <Typography variant="h4" sx={{ mb: 1.25, fontSize: { xs: "2rem", md: "2.6rem" } }}>
              Continue to sign in
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 520, mb: 3 }}>
              Enter with your email and password, or create your account if this is your first time using an invite.
            </Typography>

            {message && (
              <Box
                sx={{
                  mb: 3,
                  px: 2.25,
                  py: 1.75,
                  borderRadius: 3,
                  border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  color: "text.primary",
                }}
              >
                <Typography sx={{ fontSize: "0.76rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "primary.main", mb: 0.75 }}>
                  Invite Status
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {message}
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                "& [data-amplify-authenticator]": {
                  border: "none",
                  backgroundColor: "transparent",
                  boxShadow: "none",
                },
                "& [data-amplify-container]": {
                  backgroundColor: "transparent",
                },
                "& .amplify-tabs": {
                  borderColor: (theme) => alpha(theme.palette.text.primary, 0.08),
                },
                "& .amplify-tabs-item": {
                  color: "text.secondary",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                },
                "& .amplify-tabs-item[data-state='active']": {
                  color: "primary.main",
                  borderColor: "primary.main",
                },
                "& .amplify-field-group__control, & .amplify-select": {
                  borderRadius: "16px",
                  borderColor: (theme) => alpha(theme.palette.text.primary, 0.12),
                  backgroundColor: (theme) => alpha(theme.palette.background.default, 0.72),
                },
                "& .amplify-button--primary": {
                  borderRadius: "999px",
                  backgroundColor: "primary.main",
                  color: "#0F0F0C",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                },
                "& .amplify-button--link, & .amplify-text": {
                  color: "text.secondary",
                },
              }}
            >
              <Authenticator />
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
}
