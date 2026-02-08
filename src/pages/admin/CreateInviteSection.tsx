import { Box, Button, Paper, TextField, Typography } from "@mui/material";

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
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Create Invite
      </Typography>
      <Typography sx={{ mb: 2, color: mutedText }}>
        Example: create an invite for <strong>client-jones</strong>
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="Folder ID"
          value={inviteFolderId}
          onChange={(event) => setInviteFolderId(event.target.value)}
          sx={{ minWidth: 240 }}
          InputLabelProps={{ sx: { color: "text.secondary" } }}
          InputProps={{ sx: { color: "text.primary" } }}
        />
        <Button variant="contained" onClick={onCreateInvite}>
          Create Invite
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
            mt: 2,
            p: 2,
            borderRadius: 2,
            background: "rgba(255, 179, 0, 0.05)",
            border: "1px solid rgba(255, 179, 0, 0.2)",
          }}
        >
          <Typography variant="subtitle2" sx={{ color: mutedText, mb: 1 }}>
            Invite URL
          </Typography>
          <Typography sx={{ color: "text.primary", wordBreak: "break-all" }}>
            {inviteUrl}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
