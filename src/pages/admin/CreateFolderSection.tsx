import { Box, Button, TextField, Typography } from "@mui/material";

type CreateFolderSectionProps = {
  folderId: string;
  displayName: string;
  mutedText: string;
  setFolderId: (value: string) => void;
  setDisplayName: (value: string) => void;
  onCreateFolder: () => void;
};

export function CreateFolderSection({
  folderId,
  displayName,
  mutedText,
  setFolderId,
  setDisplayName,
  onCreateFolder,
}: CreateFolderSectionProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Create Folder
      </Typography>
      <Typography sx={{ mb: 2, color: mutedText }}>
        Example: folder ID <strong>client-jones</strong>, display name{" "}
        <strong>Jones Family</strong>
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="Folder ID"
          value={folderId}
          onChange={(event) => setFolderId(event.target.value)}
          sx={{ minWidth: 240 }}
          InputLabelProps={{ sx: { color: "text.secondary" } }}
          InputProps={{ sx: { color: "text.primary" } }}
        />
        <TextField
          label="Display name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          sx={{ minWidth: 240 }}
          InputLabelProps={{ sx: { color: "text.secondary" } }}
          InputProps={{ sx: { color: "text.primary" } }}
        />
        <Button variant="contained" onClick={onCreateFolder}>
          Create
        </Button>
      </Box>
    </Box>
  );
}
