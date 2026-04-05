import { Box, Button, Container, TextField, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { updateUserAttributes } from "aws-amplify/auth";
import { useAuth } from "../auth/AuthProvider";
import { Header } from "../components/Header";
import { MotionReveal } from "../utils/motion";

export default function Account() {
  const theme = useTheme();
  const { status, user, refresh } = useAuth();
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const mutedText = theme.palette.text.secondary;
  const panelBorder = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.08 : 0.16);
  const panelBg = alpha(theme.palette.background.paper, theme.palette.mode === "light" ? 0.82 : 0.78);

  useEffect(() => {
    setGivenName(user?.givenName ?? "");
    setFamilyName(user?.familyName ?? "");
  }, [user?.givenName, user?.familyName]);

  const saveProfile = async () => {
    const nextGivenName = givenName.trim();
    const nextFamilyName = familyName.trim();

    setMessage(null);
    setError(null);

    if (!nextGivenName || !nextFamilyName) {
      setError("First name and last name are required.");
      return;
    }

    setSaving(true);
    try {
      await updateUserAttributes({
        userAttributes: {
          given_name: nextGivenName,
          family_name: nextFamilyName,
          name: `${nextGivenName} ${nextFamilyName}`.trim(),
        },
      });
      await refresh();
      setMessage("Account details updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 3, md: 5 } }}>
        <MotionReveal
          sx={{
            maxWidth: 760,
            mx: "auto",
            border: `1px solid ${panelBorder}`,
            borderRadius: 4,
            background: panelBg,
            p: { xs: 3, md: 4 },
            boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, theme.palette.mode === "light" ? 0.04 : 0.18)}`,
          }}
        >
          <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
            Account
          </Typography>
          <Typography variant="h4" sx={{ mb: 1, fontSize: { xs: "2rem", md: "2.8rem" } }}>
            Manage your profile
          </Typography>
          <Typography sx={{ color: mutedText, mb: 3 }}>
            Update the information stored on your account. Your email address stays fixed here and must not be edited.
          </Typography>

          {status === "loading" ? (
            <Typography sx={{ color: mutedText }}>Loading your account...</Typography>
          ) : (
            <Box sx={{ display: "grid", gap: 2 }}>
              {message && (
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    color: "text.primary",
                  }}
                >
                  {message}
                </Box>
              )}
              {error && (
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.error.main, 0.22)}`,
                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                    color: "text.primary",
                  }}
                >
                  {error}
                </Box>
              )}

              <TextField
                label="Email address"
                value={user?.email ?? ""}
                size="small"
                InputProps={{ readOnly: true }}
                helperText="This email address is fixed for your account."
              />
              <TextField
                label="First name"
                value={givenName}
                size="small"
                onChange={(event) => setGivenName(event.target.value)}
                required
              />
              <TextField
                label="Last name"
                value={familyName}
                size="small"
                onChange={(event) => setFamilyName(event.target.value)}
                required
              />

              <Box sx={{ pt: 1 }}>
                <Button variant="contained" onClick={saveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </Box>
            </Box>
          )}
        </MotionReveal>
      </Container>
    </>
  );
}
