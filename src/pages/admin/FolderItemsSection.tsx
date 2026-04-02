import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Photo } from "../../types/photo";
import { FolderSummary } from "./types";

type FolderItemsSectionProps = {
  selectedFolder: string | null;
  folders: FolderSummary[];
  itemsMoveTarget: string;
  setItemsMoveTarget: (value: string) => void;
  itemsLoading: boolean;
  itemsError: string | null;
  folderItems: Photo[];
  itemsPage: number;
  itemsPerPage: number;
  setItemsPage: (update: (page: number) => number) => void;
  actionKey: string | null;
  mutedText: string;
  onRefresh: () => void;
  onDuplicate: (key: string) => void;
  onMove: (key: string) => void;
  onDelete: (key: string) => void;
};

export function FolderItemsSection({
  selectedFolder,
  folders,
  itemsMoveTarget,
  setItemsMoveTarget,
  itemsLoading,
  itemsError,
  folderItems,
  itemsPage,
  itemsPerPage,
  setItemsPage,
  actionKey,
  mutedText,
  onRefresh,
  onDuplicate,
  onMove,
  onDelete,
}: FolderItemsSectionProps) {
  const getFileName = (key: string) => key.split("/").pop() ?? key;

  return (
    <Box
      sx={{
        mb: 4,
        border: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        borderRadius: 4,
        p: { xs: 2.5, md: 3 },
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.78),
      }}
    >
      <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
        Folder Items
      </Typography>
      <Typography variant="h6" sx={{ mb: 0.75, fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
        Manage current contents
      </Typography>
      <Typography sx={{ mb: 2.5, color: mutedText }}>
        Select a folder on the left to inspect items, refresh the list, and move or duplicate files.
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
        <TextField
          label="Target folder (move/duplicate)"
          select
          value={itemsMoveTarget}
          onChange={(event) => setItemsMoveTarget(event.target.value)}
          sx={{ minWidth: 240 }}
          InputLabelProps={{ sx: { color: "text.secondary" } }}
          InputProps={{ sx: { color: "text.primary" } }}
          disabled={!selectedFolder || folders.length === 0}
        >
          {folders.map((folder) => (
            <MenuItem
              key={folder.folderId}
              value={folder.folderId}
              disabled={folder.folderId === selectedFolder}
            >
              {folder.displayName ?? folder.folderId}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          onClick={onRefresh}
          disabled={!selectedFolder || itemsLoading}
        >
          Refresh
        </Button>
      </Box>

      {!selectedFolder ? (
        <Box sx={{ color: mutedText }}>Select a folder to view items.</Box>
      ) : itemsLoading ? (
        <Box sx={{ color: mutedText }}>Loading items...</Box>
      ) : itemsError ? (
        <Box sx={{ color: mutedText }}>{itemsError}</Box>
      ) : folderItems.length === 0 ? (
        <Box sx={{ color: mutedText }}>No items in this folder yet.</Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {folderItems
            .slice((itemsPage - 1) * itemsPerPage, itemsPage * itemsPerPage)
            .map((item) => (
              <Box
                key={item.key}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  alignItems: "stretch",
                  padding: 2,
                  borderRadius: 3,
                  background: (theme) => alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.03 : 0.06),
                  border: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                  transition: "background-color 180ms ease, border-color 180ms ease",
                  "&:hover": {
                    background: (theme) => alpha(theme.palette.primary.main, 0.06),
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.18),
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-start",
                    minWidth: 0,
                  }}
                >
                  <Box
                    component="img"
                    src={item.thumbnailUrl ?? item.url}
                    alt={getFileName(item.key)}
                    loading="lazy"
                    decoding="async"
                    sx={{
                      width: 90,
                      height: 60,
                      objectFit: "cover",
                      borderRadius: 2,
                      border: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ fontSize: "0.95rem", color: "text.primary" }}>
                      {getFileName(item.key)}
                    </Box>
                    <Box sx={{ fontSize: "0.75rem", color: mutedText, overflowWrap: "anywhere" }}>
                      {item.key}
                    </Box>
                    <Box sx={{ fontSize: "0.7rem", color: mutedText, mt: 0.5 }}>
                      Duplicate keeps the original and copies into the target folder.
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", width: "100%" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onDuplicate(item.storageKey ?? item.key)}
                    disabled={actionKey === (item.storageKey ?? item.key)}
                  >
                    Copy to folder
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onMove(item.storageKey ?? item.key)}
                    disabled={actionKey === (item.storageKey ?? item.key) || !itemsMoveTarget}
                  >
                    Move
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => onDelete(item.storageKey ?? item.key)}
                    disabled={actionKey === (item.storageKey ?? item.key)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ))}
        </Box>
      )}

      {selectedFolder && folderItems.length > itemsPerPage && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: 2,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography sx={{ color: mutedText, fontSize: "0.85rem" }}>
            Showing {(itemsPage - 1) * itemsPerPage + 1}-
            {Math.min(itemsPage * itemsPerPage, folderItems.length)} of{" "}
            {folderItems.length}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setItemsPage((page) => Math.max(1, page - 1))}
              disabled={itemsPage === 1}
            >
              Previous
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                setItemsPage((page) =>
                  Math.min(page + 1, Math.ceil(folderItems.length / itemsPerPage)),
                )
              }
              disabled={itemsPage >= Math.ceil(folderItems.length / itemsPerPage)}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
