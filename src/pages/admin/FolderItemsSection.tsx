import { useEffect, useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Photo } from "../../types/photo";
import { TagAutocompleteField } from "./TagAutocompleteField";
import { FolderSummary } from "./types";
import { normalizeTags } from "./tagUtils";

type FolderItemsSectionProps = {
  selectedFolder: string | null;
  folders: FolderSummary[];
  availableTags: string[];
  itemsMoveTarget: string;
  setItemsMoveTarget: (value: string) => void;
  itemsLoading: boolean;
  itemsError: string | null;
  folderItems: Photo[];
  itemsPage: number;
  itemsPerPage: number;
  setItemsPage: (update: (page: number) => number) => void;
  actionKey: string | null;
  tagActionKey: string | null;
  mutedText: string;
  onRefresh: () => void;
  onDuplicate: (key: string) => void;
  onMove: (key: string) => void;
  onDelete: (key: string) => void;
  onSaveTags: (photoKey: string, tags: string[]) => void;
};

type FolderItemRowProps = {
  item: Photo;
  mutedText: string;
  availableTags: string[];
  actionKey: string | null;
  tagActionKey: string | null;
  itemsMoveTarget: string;
  onDuplicate: (key: string) => void;
  onMove: (key: string) => void;
  onDelete: (key: string) => void;
  onSaveTags: (photoKey: string, tags: string[]) => void;
};

function FolderItemRow({
  item,
  mutedText,
  availableTags,
  actionKey,
  tagActionKey,
  itemsMoveTarget,
  onDuplicate,
  onMove,
  onDelete,
  onSaveTags,
}: FolderItemRowProps) {
  const [loaded, setLoaded] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>(item.tags ?? []);
  const fileName = item.key.split("/").pop() ?? item.key;
  const actionValue = item.storageKey ?? item.key;
  const normalizedCurrentTags = normalizeTags(item.tags ?? []);
  const normalizedDraftTags = normalizeTags(draftTags);
  const hasTagChanges =
    normalizedCurrentTags.length !== normalizedDraftTags.length ||
    normalizedCurrentTags.some((tag, index) => tag !== normalizedDraftTags[index]);

  useEffect(() => {
    setDraftTags(item.tags ?? []);
  }, [item.tags]);

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.75,
        borderBottom: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        py: 1.75,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "132px minmax(0, 1fr) auto" },
          gap: { xs: 1.5, md: 2 },
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            "@keyframes adminThumbSweep": {
              "0%": { transform: "translateX(-120%)" },
              "100%": { transform: "translateX(120%)" },
            },
            position: "relative",
            width: { xs: "100%", md: 132 },
            maxWidth: { xs: 180, md: "none" },
            aspectRatio: "11 / 8",
            overflow: "hidden",
            borderRadius: 3,
            border: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
            background:
              "linear-gradient(135deg, rgba(184, 138, 42, 0.18), rgba(127, 138, 120, 0.12) 55%, rgba(25, 23, 19, 0.08))",
            flexShrink: 0,
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%)",
              opacity: loaded ? 0 : 1,
              transform: loaded ? "translateX(120%)" : undefined,
              animation: loaded ? "none" : "adminThumbSweep 1.4s ease-in-out infinite",
              transition: "opacity 160ms ease",
            },
          }}
        >
          <Box
            component="img"
            src={item.thumbnailUrl ?? item.url}
            alt={fileName}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            sx={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: loaded ? 1 : 0,
              transition: "opacity 220ms ease",
            }}
          />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "1rem", color: "text.primary", fontWeight: 700 }}>
            {fileName}
          </Typography>
          <Typography sx={{ mt: 0.35, fontSize: "0.78rem", color: mutedText, overflowWrap: "anywhere" }}>
            {item.key}
          </Typography>
          <Typography sx={{ mt: 0.75, fontSize: "0.76rem", color: mutedText }}>
            Duplicate keeps the original in place. Move transfers it into the selected destination folder.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            justifyContent: { md: "flex-end" },
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => onDuplicate(actionValue)}
            disabled={actionKey === actionValue}
          >
            Duplicate
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onMove(actionValue)}
            disabled={actionKey === actionValue || !itemsMoveTarget}
          >
            Move
          </Button>
          <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={() => onDelete(actionValue)}
            disabled={actionKey === actionValue}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) auto" },
          gap: 1.5,
          alignItems: "start",
          px: { md: 0.5 },
        }}
      >
        <TagAutocompleteField
          value={draftTags}
          options={availableTags}
          label="Tags"
          helperText="Search existing tags or type a new one."
          placeholder="Add tags"
          disabled={tagActionKey === item.key}
          onChange={setDraftTags}
        />

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: { xl: "flex-end" } }}>
          <Button
            size="small"
            variant="text"
            onClick={() => setDraftTags(item.tags ?? [])}
            disabled={!hasTagChanges || tagActionKey === item.key}
          >
            Reset
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => onSaveTags(item.key, draftTags)}
            disabled={!hasTagChanges || tagActionKey === item.key}
          >
            {tagActionKey === item.key ? "Saving..." : "Save tags"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export function FolderItemsSection({
  selectedFolder,
  folders,
  availableTags,
  itemsMoveTarget,
  setItemsMoveTarget,
  itemsLoading,
  itemsError,
  folderItems,
  itemsPage,
  itemsPerPage,
  setItemsPage,
  actionKey,
  tagActionKey,
  mutedText,
  onRefresh,
  onDuplicate,
  onMove,
  onDelete,
  onSaveTags,
}: FolderItemsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const selectedFolderLabel =
    folders.find((folder) => folder.folderId === selectedFolder)?.displayName ?? selectedFolder;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? folderItems.filter((item) => {
        const fileName = item.key.split("/").pop() ?? item.key;
        const tagText = (item.tags ?? []).join(" ");
        return [fileName, item.key, tagText].some((value) => value.toLowerCase().includes(normalizedQuery));
      })
    : folderItems;
  const pagedItems = filteredItems.slice((itemsPage - 1) * itemsPerPage, itemsPage * itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  useEffect(() => {
    setSearchQuery("");
  }, [selectedFolder]);

  useEffect(() => {
    setItemsPage(() => 1);
  }, [normalizedQuery, setItemsPage]);

  return (
    <Box
      sx={{
        border: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        borderRadius: 5,
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.82),
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: { xs: 2.25, md: 3 },
          py: { xs: 2.25, md: 2.75 },
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          background:
            "linear-gradient(135deg, rgba(184, 138, 42, 0.13), rgba(184, 138, 42, 0.03) 42%, rgba(127, 138, 120, 0.12) 100%)",
        }}
      >
        <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
          Folder Library
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) auto" },
            gap: 2,
            alignItems: "end",
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ mb: 0.75 }}>
              {selectedFolder ? `Review ${selectedFolderLabel}` : "Choose a folder to start"}
            </Typography>
            <Typography sx={{ color: mutedText, maxWidth: 780 }}>
              This is the working surface for gallery items. Thumbnail frames keep their shape before assets load, tags can be edited inline, and search now matches filenames, storage keys, and assigned tags.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(120px, 1fr))" },
              gap: 1.25,
              minWidth: { lg: 360 },
            }}
          >
            <Box sx={{ px: 1.5, py: 1.25, borderRadius: 3, backgroundColor: alpha("#191713", 0.05) }}>
              <Typography sx={{ fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: mutedText }}>
                Active folder
              </Typography>
              <Typography sx={{ mt: 0.35, fontWeight: 700 }}>
                {selectedFolder ?? "None"}
              </Typography>
            </Box>
            <Box sx={{ px: 1.5, py: 1.25, borderRadius: 3, backgroundColor: alpha("#191713", 0.05) }}>
              <Typography sx={{ fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: mutedText }}>
                Total items
              </Typography>
              <Typography sx={{ mt: 0.35, fontWeight: 700 }}>{folderItems.length}</Typography>
            </Box>
            <Box sx={{ px: 1.5, py: 1.25, borderRadius: 3, backgroundColor: alpha("#191713", 0.05) }}>
              <Typography sx={{ fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: mutedText }}>
                Results
              </Typography>
              <Typography sx={{ mt: 0.35, fontWeight: 700 }}>
                {selectedFolder ? filteredItems.length : 0}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2.25, md: 3 }, py: 2.25 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "minmax(240px, 320px) minmax(280px, 360px) auto" },
            gap: 1.5,
            alignItems: "center",
            mb: 2.5,
          }}
        >
          <TextField
            label="Search images"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            disabled={!selectedFolder || itemsLoading || folderItems.length === 0}
            helperText="Search by filename, storage key, or tag."
            InputLabelProps={{ sx: { color: "text.secondary" } }}
            InputProps={{ sx: { color: "text.primary" } }}
          />

          <TextField
            label="Destination folder"
            select
            value={itemsMoveTarget}
            onChange={(event) => setItemsMoveTarget(event.target.value)}
            InputLabelProps={{ sx: { color: "text.secondary" } }}
            InputProps={{ sx: { color: "text.primary" } }}
            disabled={!selectedFolder || folders.length === 0}
            helperText="Move and duplicate actions use this destination."
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

          <Box sx={{ display: "flex", justifyContent: { xl: "flex-end" }, gap: 1, flexWrap: "wrap" }}>
            {searchQuery && (
              <Button variant="text" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            )}
            <Button variant="outlined" onClick={onRefresh} disabled={!selectedFolder || itemsLoading}>
              {itemsLoading ? "Refreshing..." : "Refresh items"}
            </Button>
          </Box>
        </Box>

        {!selectedFolder ? (
          <Box sx={{ py: 6, color: mutedText }}>Select a folder from the index to load its library.</Box>
        ) : itemsLoading ? (
          <Box sx={{ py: 6, color: mutedText }}>Loading items...</Box>
        ) : itemsError ? (
          <Box sx={{ py: 6, color: mutedText }}>{itemsError}</Box>
        ) : folderItems.length === 0 ? (
          <Box sx={{ py: 6, color: mutedText }}>
            No items are stored in this folder yet. Upload files or duplicate from another folder to populate it.
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box sx={{ py: 6, color: mutedText }}>
            No images match <strong>{searchQuery}</strong>. Try a different filename fragment, tag, or clear the search.
          </Box>
        ) : (
          <Box>
            {pagedItems.map((item) => (
              <FolderItemRow
                key={item.key}
                item={item}
                mutedText={mutedText}
                availableTags={availableTags}
                actionKey={actionKey}
                tagActionKey={tagActionKey}
                itemsMoveTarget={itemsMoveTarget}
                onDuplicate={onDuplicate}
                onMove={onMove}
                onDelete={onDelete}
                onSaveTags={onSaveTags}
              />
            ))}
          </Box>
        )}

        {selectedFolder && filteredItems.length > itemsPerPage && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 2.5,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography sx={{ color: mutedText, fontSize: "0.85rem" }}>
              Showing {(itemsPage - 1) * itemsPerPage + 1}-
              {Math.min(itemsPage * itemsPerPage, filteredItems.length)} of {filteredItems.length}
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
                onClick={() => setItemsPage((page) => Math.min(page + 1, totalPages))}
                disabled={itemsPage >= totalPages}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
