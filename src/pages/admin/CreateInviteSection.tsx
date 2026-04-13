import { useState } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type CreateInviteSectionProps = {
  inviteFolderId: string;
  inviteLoading: boolean;
  inviteUrl: string | null;
  mutedText: string;
  setInviteFolderId: (value: string) => void;
  onCreateInvite: () => void;
};

export function CreateInviteSection({
  inviteFolderId,
  inviteLoading,
  inviteUrl,
  mutedText,
  setInviteFolderId,
  onCreateInvite,
}: CreateInviteSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!inviteUrl || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Box
      sx={{
        border: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        borderRadius: 4,
        p: 2.5,
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.62),
      }}
    >
      <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
        Sharing
      </Typography>
      <Typography variant="h6" sx={{ mb: 0.75 }}>
        Generate an invite link
      </Typography>
      <Typography sx={{ mb: 2.5, color: mutedText }}>
        Create a fresh invite for a folder and copy the resulting URL without leaving the workspace.
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" }, gap: 1.5, alignItems: "start" }}>
        <TextField
          label="Folder ID"
          value={inviteFolderId}
          onChange={(event) => setInviteFolderId(event.target.value)}
          helperText="Defaults to the active folder when one is selected."
          InputLabelProps={{ sx: { color: "text.secondary" } }}
          InputProps={{ sx: { color: "text.primary" } }}
        />
        <Button variant="contained" onClick={onCreateInvite} disabled={inviteLoading}>
          {inviteLoading ? "Preparing..." : "Create invite"}
        </Button>
      </Box>

      {inviteLoading && (
        <Box sx={{ mt: 2, color: mutedText }}>
          Preparing invite...
        </Box>
      )}

      {inviteUrl && !inviteLoading && (
        <Paper
          elevation={0}
          sx={{
            mt: 2.25,
            p: 2,
            borderRadius: 3,
            background: "rgba(184, 138, 42, 0.08)",
            border: "1px solid rgba(184, 138, 42, 0.22)",
          }}
        >
          <Typography variant="subtitle2" sx={{ color: mutedText, mb: 1 }}>
            Invite URL
          </Typography>
          <Typography sx={{ color: "text.primary", wordBreak: "break-all", mb: 1.5 }}>
            {inviteUrl}
          </Typography>
          <Button variant="outlined" size="small" onClick={() => void handleCopy()}>
            {copied ? "Copied" : "Copy link"}
          </Button>
        </Paper>
      )}
    </Box>
  );
}
