import { Box, Button, Typography } from "@mui/material";
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
        borderRadius: 2,
        padding: 2,
        background: cardBg,
        maxHeight: "70vh",
        overflowY: "auto",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Folders
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
                  padding: "6px 10px",
                  borderRadius: 1,
                  background: isDefault
                    ? "rgba(0, 217, 255, 0.16)"
                    : selectedFolder === folder.folderId
                    ? "rgba(255, 179, 0, 0.2)"
                    : itemBg,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  border: isDefault
                    ? "1px solid rgba(0, 217, 255, 0.5)"
                    : selectedFolder === folder.folderId
                    ? "1px solid rgba(255, 179, 0, 0.5)"
                    : "1px solid transparent",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  <Box>
                    <Box sx={{ fontSize: "0.9rem", color: "text.primary" }}>
                      {folder.displayName ?? folder.folderId}
                    </Box>
                    <Box
                      sx={{
                        fontSize: "0.75rem",
                        color: mutedText,
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
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
                        padding: "0 6px",
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
