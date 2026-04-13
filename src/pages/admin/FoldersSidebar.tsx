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
        position: { lg: "sticky" },
        top: { lg: 108 },
        alignSelf: "start",
      }}
    >
      <Box
        sx={{
          border: `1px solid ${subtleBorder}`,
          borderRadius: 5,
          padding: 2.5,
          background: cardBg,
          overflow: "hidden",
        }}
      >
        <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
          Folder Index
        </Typography>
        <Typography variant="h6" sx={{ mb: 0.75, fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
          Select the working folder
        </Typography>
        <Typography sx={{ color: mutedText, mb: 2.5, fontSize: "0.92rem" }}>
          Start here. Choosing a folder updates the item manager, invite tools, upload target, and access panel together.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 1.25,
            mb: 2.5,
          }}
        >
          <Box sx={{ borderRadius: 3, px: 1.5, py: 1.25, backgroundColor: alpha("#191713", 0.04) }}>
            <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: mutedText }}>
              Total folders
            </Typography>
            <Typography sx={{ mt: 0.35, fontWeight: 700 }}>{folders.length}</Typography>
          </Box>
          <Box sx={{ borderRadius: 3, px: 1.5, py: 1.25, backgroundColor: alpha("#191713", 0.04) }}>
            <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: mutedText }}>
              Active
            </Typography>
            <Typography sx={{ mt: 0.35, fontWeight: 700, overflowWrap: "anywhere" }}>
              {selectedFolder ?? "None"}
            </Typography>
          </Box>
        </Box>

        {folders.length === 0 ? (
          <Box sx={{ color: mutedText }}>No folders yet.</Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {folders.map((folder) => {
              const isDefault = folder.folderId === "public";
              const isSelected = selectedFolder === folder.folderId;

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
                    padding: "14px 16px",
                    borderRadius: 3.5,
                    background: isDefault
                      ? alpha("#7F8A78", 0.16)
                      : isSelected
                      ? "linear-gradient(135deg, rgba(184, 138, 42, 0.18), rgba(184, 138, 42, 0.08) 60%, rgba(25, 23, 19, 0.02))"
                      : itemBg,
                    cursor: "pointer",
                    border: isDefault
                      ? `1px solid ${alpha("#7F8A78", 0.28)}`
                      : isSelected
                      ? `1px solid ${alpha("#B88A2A", 0.3)}`
                      : `1px solid ${alpha("#191713", 0.08)}`,
                    transition: "transform 220ms ease, background-color 180ms ease, border-color 180ms ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      borderColor: isDefault ? alpha("#7F8A78", 0.4) : alpha("#B88A2A", 0.28),
                    },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, alignItems: "flex-start" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: "0.98rem", color: "text.primary", fontWeight: 700 }}>
                        {folder.displayName ?? folder.folderId}
                      </Typography>
                      <Typography sx={{ mt: 0.35, fontSize: "0.75rem", color: mutedText, overflowWrap: "anywhere" }}>
                        {folder.folderId}
                      </Typography>
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
                          px: 0.5,
                          py: 0.25,
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
    </Box>
  );
}
