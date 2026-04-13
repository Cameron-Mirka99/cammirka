import { Box, Button, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

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
    <Box
      sx={{
        border: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        borderRadius: 4,
        p: 2.5,
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.62),
      }}
    >
      <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
        Structure
      </Typography>
      <Typography variant="h6" sx={{ mb: 0.75 }}>
        Create a new folder
      </Typography>
      <Typography sx={{ mb: 2.5, color: mutedText }}>
        Create the storage container first, then use the selected-folder tools to upload files, assign access, and generate invites.
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr)) auto" }, gap: 1.5 }}>
        <TextField
          label="Folder ID"
          value={folderId}
          onChange={(event) => setFolderId(event.target.value)}
          helperText="Stable internal id, for example client-jones."
          InputLabelProps={{ sx: { color: "text.secondary" } }}
          InputProps={{ sx: { color: "text.primary" } }}
        />
        <TextField
          label="Display name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          helperText="Readable label shown in the admin."
          InputLabelProps={{ sx: { color: "text.secondary" } }}
          InputProps={{ sx: { color: "text.primary" } }}
        />
        <Box sx={{ display: "flex", alignItems: { md: "flex-start" } }}>
          <Button variant="contained" onClick={onCreateFolder} fullWidth>
            Create folder
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
