import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
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
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Folder Items
      </Typography>
      <Typography sx={{ mb: 2, color: mutedText }}>
        Select a folder on the left to view its contents.
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
                  borderRadius: 1,
                  background: "rgba(255, 179, 0, 0.05)",
                  border: "1px solid rgba(255, 179, 0, 0.2)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: "rgba(255, 179, 0, 0.1)",
                    borderColor: "rgba(255, 179, 0, 0.4)",
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
                    src={item.url}
                    alt={getFileName(item.key)}
                    sx={{
                      width: 90,
                      height: 60,
                      objectFit: "cover",
                      borderRadius: 1,
                      border: "1px solid rgba(255, 179, 0, 0.2)",
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
                    onClick={() => onDuplicate(item.key)}
                    disabled={actionKey === item.key}
                  >
                    Copy to folder
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onMove(item.key)}
                    disabled={actionKey === item.key || !itemsMoveTarget}
                  >
                    Move
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => onDelete(item.key)}
                    disabled={actionKey === item.key}
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
