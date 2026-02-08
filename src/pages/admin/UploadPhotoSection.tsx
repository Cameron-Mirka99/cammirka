import { Box, Button, TextField, Typography } from "@mui/material";

type UploadPhotoSectionProps = {
  uploadFolderId: string;
  uploadFiles: File[];
  mutedText: string;
  setUploadFolderId: (value: string) => void;
  setUploadFiles: (files: File[]) => void;
  onUpload: () => void;
};

export function UploadPhotoSection({
  uploadFolderId,
  uploadFiles,
  mutedText,
  setUploadFolderId,
  setUploadFiles,
  onUpload,
}: UploadPhotoSectionProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Upload Photo (Admin Only)
      </Typography>
      <Typography sx={{ mb: 2, color: mutedText }}>
        Example: folder ID <strong>client-jones</strong>, file <strong>IMG_1234.jpg</strong>
      </Typography>
      <Box
        sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}
      >
        <TextField
          label="Folder ID"
          value={uploadFolderId}
          onChange={(event) => setUploadFolderId(event.target.value)}
          sx={{ minWidth: 240 }}
          InputLabelProps={{ sx: { color: "text.secondary" } }}
          InputProps={{ sx: { color: "text.primary" } }}
        />
        <Button variant="outlined" component="label">
          Choose files
          <input
            type="file"
            hidden
            multiple
            onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))}
          />
        </Button>
        <Button variant="contained" onClick={onUpload}>
          Upload
        </Button>
      </Box>
      {uploadFiles.length > 0 && (
        <Box sx={{ mt: 1, color: mutedText }}>
          Selected: {uploadFiles.map((file) => file.name).join(", ")}
        </Box>
      )}
    </Box>
  );
}
