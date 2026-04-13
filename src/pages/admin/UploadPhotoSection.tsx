import { Box, Button, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { TagAutocompleteField } from "./TagAutocompleteField";

type UploadPhotoSectionProps = {
  uploadFolderId: string;
  uploadFiles: File[];
  uploadTags: string[];
  availableTags: string[];
  uploadLoading: boolean;
  mutedText: string;
  setUploadFolderId: (value: string) => void;
  setUploadFiles: (files: File[]) => void;
  setUploadTags: (tags: string[]) => void;
  onUpload: () => void;
};

export function UploadPhotoSection({
  uploadFolderId,
  uploadFiles,
  uploadTags,
  availableTags,
  uploadLoading,
  mutedText,
  setUploadFolderId,
  setUploadFiles,
  setUploadTags,
  onUpload,
}: UploadPhotoSectionProps) {
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
        Intake
      </Typography>
      <Typography variant="h6" sx={{ mb: 0.75 }}>
        Upload new photos
      </Typography>
      <Typography sx={{ mb: 1.5, color: mutedText }}>
        Select a target folder and queue one or more files. Each file is uploaded once as the original plus a browser-generated thumbnail.
      </Typography>
      <Typography sx={{ mb: 2.5, color: mutedText, fontSize: "0.85rem" }}>
        The active folder is mirrored here automatically when you select one from the index.
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) auto auto" }, gap: 1.5, alignItems: "start" }}>
        <TextField
          label="Folder ID"
          value={uploadFolderId}
          onChange={(event) => setUploadFolderId(event.target.value)}
          disabled={uploadLoading}
          helperText="Destination for all selected files."
          InputLabelProps={{ sx: { color: "text.secondary" } }}
          InputProps={{ sx: { color: "text.primary" } }}
        />
        <Button variant="outlined" component="label" disabled={uploadLoading}>
          {uploadLoading ? "Preparing..." : "Choose files"}
          <input
            type="file"
            hidden
            multiple
            disabled={uploadLoading}
            onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))}
          />
        </Button>
        <Button variant="contained" onClick={onUpload} disabled={uploadLoading || uploadFiles.length === 0}>
          {uploadLoading ? "Uploading..." : "Upload"}
        </Button>
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <TagAutocompleteField
          value={uploadTags}
          options={availableTags}
          label="Tags for this upload"
          helperText="Search existing tags or type new ones. These tags will be applied to every selected file."
          placeholder="Add tags"
          disabled={uploadLoading}
          onChange={setUploadTags}
        />
      </Box>

      <Box
        sx={{
          mt: 2,
          minHeight: 52,
          px: 1.5,
          py: 1.25,
          borderRadius: 3,
          backgroundColor: (theme) => alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.035 : 0.06),
          color: mutedText,
          fontSize: "0.9rem",
        }}
      >
        {uploadFiles.length > 0 ? `Queued files: ${uploadFiles.map((file) => file.name).join(", ")}` : "No files selected yet."}
        {uploadTags.length > 0 ? ` Tags: ${uploadTags.join(", ")}` : ""}
      </Box>
    </Box>
  );
}
