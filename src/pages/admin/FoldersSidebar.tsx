import { Box, Button, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { FolderSummary } from "./types";

type FoldersSidebarProps = {
  folders: FolderSummary[];
  selectedFolder: string | null;
  folderIdInput: string;
  mutedText: string;
  subtleBorder: string;
  cardBg: string;
  itemBg: string;
  onSelectFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onSeedFolderId: (folderId: string) => void;
};

export function FoldersSidebar({
  folders,
  selectedFolder,
  folderIdInput,
  mutedText,
  subtleBorder,
  cardBg,
  itemBg,
  onSelectFolder,
  onDeleteFolder,
  onSeedFolderId,
}: FoldersSidebarProps) {
  return (
    <Box
      sx={{
        border: `1px solid ${subtleBorder}`,
        borderRadius: 4,
        padding: 2.5,
        background: cardBg,
        backdropFilter: "blur(18px)",
        maxHeight: "78vh",
        overflowY: "auto",
      }}
    >
      <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
        Folder Index
      </Typography>
      <Typography variant="h6" sx={{ mb: 0.75, fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
        Select a folder
      </Typography>
      <Typography sx={{ color: mutedText, mb: 2.5, fontSize: "0.92rem" }}>
        Choose a folder to inspect items, generate invites, and manage access.
      </Typography>
      {folders.length === 0 ? (
        <Box sx={{ color: mutedText }}>No folders yet.</Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {folders.map((folder) => {
            const isDefault = folder.folderId === "public";
            return (
              <Box
                key={folder.folderId}
                onClick={() => {
                  onSelectFolder(folder.folderId);
                  if (!folderIdInput) {
                    onSeedFolderId(folder.folderId);
                  }
                }}
                sx={{
                  padding: "12px 14px",
                  borderRadius: 3,
                  background: isDefault
                    ? alpha("#7F8A78", 0.14)
                    : selectedFolder === folder.folderId
                    ? alpha("#B88A2A", 0.12)
                    : itemBg,
                  cursor: "pointer",
                  border: isDefault
                    ? `1px solid ${alpha("#7F8A78", 0.32)}`
                    : selectedFolder === folder.folderId
                    ? `1px solid ${alpha("#B88A2A", 0.32)}`
                    : `1px solid ${alpha("#FFFFFF", 0.04)}`,
                  transition: "background-color 180ms ease, border-color 180ms ease",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  <Box>
                    <Box sx={{ fontSize: "0.9rem", color: "text.primary" }}>
                      {folder.displayName ?? folder.folderId}
                    </Box>
                    <Box
                      sx={{
                        fontSize: "0.74rem",
                        color: mutedText,
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                        mt: 0.3,
                      }}
                    >
                      <strong>Id:</strong>
                      <span>{folder.folderId}</span>
                    </Box>
                  </Box>
                  {!isDefault && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteFolder(folder.folderId);
                      }}
                      sx={{
                        color: mutedText,
                        minWidth: "auto",
                        padding: "0 4px",
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
