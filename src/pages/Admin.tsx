import { Box, Button, Container, MenuItem, Paper, TextField, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { Header } from "../components/Header";
import { Photo } from "../types/photo";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { authFetch } from "../utils/authFetch";

type FolderUser = {
  username: string;
  email?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  status?: string;
  enabled?: boolean;
  createdAt?: string;
  lastModifiedAt?: string;
};

export default function Admin() {
  const { user } = useAuth();
  const [folderId, setFolderId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteFolderId, setInviteFolderId] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderItems, setFolderItems] = useState<Photo[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [itemsMoveTarget, setItemsMoveTarget] = useState("");
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [itemsPage, setItemsPage] = useState(1);
  const [folderUsers, setFolderUsers] = useState<FolderUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [folders, setFolders] = useState<Array<{ folderId: string; displayName?: string }>>(
    [],
  );
  const itemsPerPage = 10;

  const theme = useTheme();
  const isAdmin = Boolean(user?.groups.includes("admin"));
  const mutedText = theme.palette.text.secondary;
  const subtleBorder = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.12 : 0.2);
  const cardBg = alpha(theme.palette.common.black, theme.palette.mode === "light" ? 0.04 : 0.2);
  const itemBg = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.06 : 0.08);

  const apiBase = photoApiBaseUrl;

  const getFileName = (key: string) => key.split("/").pop() ?? key;
  const formatUserName = (userEntry: FolderUser) => {
    if (userEntry.name) return userEntry.name;
    const combined = [userEntry.givenName, userEntry.familyName]
      .filter(Boolean)
      .join(" ");
    if (combined) return combined;
    return userEntry.email ?? userEntry.username;
  };
  const formatDate = (value?: string) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return value;
    return date.toLocaleString();
  };

  const loadFolders = async () => {
    if (!apiBase) return;
    const res = await authFetch(`${apiBase}/folders`, {
      method: "GET",
    });
    if (!res.ok) return;
    const payload = await res.json();
    const items: Array<{ folderId: string; displayName?: string }> = Array.isArray(
      payload.folders,
    )
      ? payload.folders
      : [];
    const withDefault = [
      { folderId: "public", displayName: "Public Gallery" },
      ...items.filter((item) => item.folderId !== "public"),
    ];
    setFolders(withDefault);
  };

  useEffect(() => {
    loadFolders().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selectedFolder) {
      setFolderItems([]);
      setItemsMoveTarget("");
      setItemsPage(1);
      return;
    }
    const nextTarget = folders.find((folder) => folder.folderId !== selectedFolder)?.folderId ?? "";
    setItemsMoveTarget(nextTarget);
    setItemsPage(1);
  }, [folders, selectedFolder]);

  const loadFolderItems = async (folderId: string) => {
    if (!apiBase) return;
    setItemsLoading(true);
    setItemsError(null);
    try {
      const res = await authFetch(`${apiBase}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, limit: 1000 }),
      });
      if (!res.ok) {
        throw new Error(`Failed to load folder items: ${res.status}`);
      }
      const payload = await res.json();
      const items: Photo[] = Array.isArray(payload.photos) ? payload.photos : [];
      setFolderItems(items);
      setItemsPage(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load items.";
      setItemsError(message);
    } finally {
      setItemsLoading(false);
    }
  };

  const loadFolderUsers = async (folderId: string) => {
    if (!apiBase) return;
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await authFetch(
        `${apiBase}/folder-users?folderId=${encodeURIComponent(folderId)}`,
        { method: "GET" },
      );
      if (!res.ok) {
        throw new Error(`Failed to load users: ${res.status}`);
      }
      const payload = await res.json();
      const users: FolderUser[] = Array.isArray(payload.users) ? payload.users : [];
      setFolderUsers(users);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users.";
      setUsersError(message);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedFolder) return;
    loadFolderItems(selectedFolder).catch(() => undefined);
  }, [selectedFolder]);

  useEffect(() => {
    if (!selectedFolder) {
      setFolderUsers([]);
      return;
    }
    loadFolderUsers(selectedFolder).catch(() => undefined);
  }, [selectedFolder]);

  const createFolder = async () => {
    setStatusMessage(null);
    if (!apiBase) {
      setStatusMessage("REACT_APP_PHOTO_API_URL is not configured.");
      return;
    }
    const res = await authFetch(`${apiBase}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId, displayName }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setStatusMessage(payload?.message ?? "Failed to create folder.");
      return;
    }
    setStatusMessage(`Folder created: ${payload.folderId}`);
    setFolderId("");
    setDisplayName("");
    loadFolders().catch(() => undefined);
  };

  const createInvite = async (folderOverride?: string, silent?: boolean) => {
    if (!apiBase) {
      if (!silent) {
        setStatusMessage("REACT_APP_PHOTO_API_URL is not configured.");
      }
      return;
    }
    const targetFolder = folderOverride ?? inviteFolderId;
    if (!targetFolder) return;

    if (!silent) setStatusMessage(null);
    setInviteLoading(true);
    const res = await authFetch(`${apiBase}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: targetFolder }),
    });
    const payload = await res.json();
    if (!res.ok) {
      if (!silent) {
        setStatusMessage(payload?.message ?? "Failed to create invite.");
      }
      setInviteLoading(false);
      return;
    }
    const inviteCode = payload.inviteCode;
    const url = `${window.location.origin}/login?invite=${inviteCode}`;
    setInviteUrl(url);
    if (!silent) {
      setStatusMessage(`Invite ready for ${payload.folderId}`);
      if (!folderOverride) {
        setInviteFolderId("");
      }
    }
    setInviteLoading(false);
  };

  const uploadImage = async () => {
    setStatusMessage(null);
    if (!apiBase) {
      setStatusMessage("REACT_APP_PHOTO_API_URL is not configured.");
      return;
    }
    if (!uploadFile) {
      setStatusMessage("Select a file to upload.");
      return;
    }

    const base64 = await toBase64(uploadFile);
    const res = await authFetch(`${apiBase}/upload-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folderId: uploadFolderId,
        imageName: uploadFile.name,
        image: base64,
      }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setStatusMessage(payload?.message ?? "Upload failed.");
      return;
    }
    setStatusMessage(payload.message ?? "Upload complete.");
    setUploadFile(null);
  };


  const deleteFolder = async (folderIdToDelete: string) => {
    setStatusMessage(null);
    if (!apiBase) {
      setStatusMessage("REACT_APP_PHOTO_API_URL is not configured.");
      return;
    }
    const confirmed = window.confirm(
      `Delete folder "${folderIdToDelete}" and all its contents? This cannot be undone.`,
    );
    if (!confirmed) return;

    const res = await authFetch(`${apiBase}/folders`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: folderIdToDelete }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setStatusMessage(payload?.message ?? "Delete failed.");
      return;
    }
    setStatusMessage(`Deleted folder ${payload.folderId}`);
    setSelectedFolder(null);
    loadFolders().catch(() => undefined);
  };

  const deletePhoto = async (key: string) => {
    setStatusMessage(null);
    if (!apiBase) {
      setStatusMessage("REACT_APP_PHOTO_API_URL is not configured.");
      return;
    }
    const confirmed = window.confirm(`Delete "${getFileName(key)}"? This cannot be undone.`);
    if (!confirmed) return;
    setActionKey(key);
    const res = await authFetch(`${apiBase}/delete-photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setStatusMessage(payload?.message ?? "Delete failed.");
      setActionKey(null);
      return;
    }
    setFolderItems((prev) => prev.filter((item) => item.key !== key));
    setStatusMessage(`Deleted ${payload.deletedKey ?? key}`);
    setActionKey(null);
  };

  const duplicatePhoto = async (key: string) => {
    setStatusMessage(null);
    if (!apiBase) {
      setStatusMessage("REACT_APP_PHOTO_API_URL is not configured.");
      return;
    }
    if (!itemsMoveTarget) {
      setStatusMessage("Select a destination folder to duplicate this photo.");
      return;
    }
    if (itemsMoveTarget === selectedFolder) {
      setStatusMessage("Choose a different destination folder.");
      return;
    }
    setActionKey(key);
    const res = await authFetch(`${apiBase}/duplicate-photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceKey: key,
        destinationFolderId: itemsMoveTarget,
      }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setStatusMessage(payload?.message ?? "Duplicate failed.");
      setActionKey(null);
      return;
    }
    if (selectedFolder) {
      loadFolderItems(selectedFolder).catch(() => undefined);
    }
    setStatusMessage(`Duplicated to ${payload.destinationKey ?? itemsMoveTarget}`);
    setActionKey(null);
  };

  const movePhotoFromList = async (key: string) => {
    setStatusMessage(null);
    if (!apiBase) {
      setStatusMessage("REACT_APP_PHOTO_API_URL is not configured.");
      return;
    }
    if (!itemsMoveTarget) {
      setStatusMessage("Select a destination folder to move this item.");
      return;
    }
    if (itemsMoveTarget === selectedFolder) {
      setStatusMessage("Choose a different destination folder.");
      return;
    }
    setActionKey(key);
    const res = await authFetch(`${apiBase}/move-photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceKey: key,
        destinationFolderId: itemsMoveTarget,
      }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setStatusMessage(payload?.message ?? "Move failed.");
      setActionKey(null);
      return;
    }
    setFolderItems((prev) => prev.filter((item) => item.key !== key));
    setStatusMessage(`Moved to ${payload.destinationKey ?? itemsMoveTarget}`);
    setActionKey(null);
  };

  return (
    <>
      <Header />
      {isAdmin ? (
        <Container
          maxWidth="lg"
          sx={{ color: "text.primary", pt: { xs: 2, sm: 3, md: 4 } }}
        >
          <Typography variant="h4" sx={{ mb: 4 }}>
            Admin
          </Typography>

          {statusMessage && (
            <Box sx={{ mb: 3, color: mutedText }}>
              {statusMessage}
            </Box>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
              gap: 4,
            }}
          >
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
                <Box sx={{ color: mutedText }}>
                  No folders yet.
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {folders.map((folder) => {
                    const isDefault = folder.folderId === "public";
                    return (
                    <Box
                      key={folder.folderId}
                      onClick={() => {
                        setSelectedFolder(folder.folderId);
                        setInviteFolderId(folder.folderId);
                        setUploadFolderId(folder.folderId);
                        createInvite(folder.folderId, true);
                        if (!folderId) {
                          setFolderId(folder.folderId);
                        }
                      }}
                      sx={{
                        padding: "6px 10px",
                        borderRadius: 1,
                          background:
                            isDefault
                              ? "rgba(0, 217, 255, 0.16)"
                            : selectedFolder === folder.folderId
                            ? "rgba(255, 179, 0, 0.2)"
                            : itemBg,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        border:
                          isDefault
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
                              deleteFolder(folder.folderId);
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

            <Box>
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
                  onClick={() => selectedFolder && loadFolderItems(selectedFolder)}
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
                  .slice(
                    (itemsPage - 1) * itemsPerPage,
                    itemsPage * itemsPerPage,
                  )
                  .map((item) => (
                  <Box
                    key={item.key}
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                        alignItems: { xs: "flex-start", sm: "center" },
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
                        component="img"
                        src={item.url}
                        alt={getFileName(item.key)}
                        sx={{
                          width: 90,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 1,
                          border: "1px solid rgba(255, 179, 0, 0.2)",
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ fontSize: "0.95rem", color: "text.primary" }}>
                          {getFileName(item.key)}
                        </Box>
                        <Box sx={{ fontSize: "0.75rem", color: mutedText }}>
                          {item.key}
                        </Box>
                        <Box sx={{ fontSize: "0.7rem", color: mutedText, mt: 0.5 }}>
                          Duplicate keeps the original and copies into the target folder.
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => duplicatePhoto(item.key)}
                          disabled={actionKey === item.key}
                        >
                          Copy to folder
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => movePhotoFromList(item.key)}
                          disabled={actionKey === item.key || !itemsMoveTarget}
                        >
                          Move
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => deletePhoto(item.key)}
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

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Folder Users
              </Typography>
              <Typography sx={{ mb: 2, color: mutedText }}>
                {selectedFolder
                  ? `Users assigned to ${selectedFolder}.`
                  : "Select a folder to view users."}
              </Typography>
              {!selectedFolder ? (
                <Box sx={{ color: mutedText }}>Select a folder to view users.</Box>
              ) : usersLoading ? (
                <Box sx={{ color: mutedText }}>Loading users...</Box>
              ) : usersError ? (
                <Box sx={{ color: mutedText }}>{usersError}</Box>
              ) : folderUsers.length === 0 ? (
                <Box sx={{ color: mutedText }}>No users assigned to this folder.</Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {folderUsers.map((userEntry) => (
                    <Box
                      key={userEntry.username}
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                        alignItems: { xs: "flex-start", sm: "center" },
                        padding: 2,
                        borderRadius: 1,
                        background: "rgba(0, 217, 255, 0.05)",
                        border: "1px solid rgba(0, 217, 255, 0.2)",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ fontSize: "0.95rem", color: "text.primary" }}>
                          {formatUserName(userEntry)}
                        </Box>
                        <Box sx={{ fontSize: "0.75rem", color: mutedText }}>
                          Username: {userEntry.username}
                        </Box>
                        {userEntry.email && (
                          <Box sx={{ fontSize: "0.75rem", color: mutedText }}>
                            Email: {userEntry.email}
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ fontSize: "0.75rem", color: mutedText }}>
                        <Box>
                          Status: {userEntry.status ?? "UNKNOWN"} ·{" "}
                          {userEntry.enabled === false ? "Disabled" : "Enabled"}
                        </Box>
                        <Box>Created: {formatDate(userEntry.createdAt)}</Box>
                        <Box>Last updated: {formatDate(userEntry.lastModifiedAt)}</Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

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
                  <Button variant="contained" onClick={createFolder}>
                    Create
                  </Button>
                </Box>
              </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Create Invite
              </Typography>
              <Typography sx={{ mb: 2, color: mutedText }}>
                Example: create an invite for <strong>client-jones</strong>
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    label="Folder ID"
                    value={inviteFolderId}
                    onChange={(event) => setInviteFolderId(event.target.value)}
                    sx={{ minWidth: 240 }}
                    InputLabelProps={{ sx: { color: "text.secondary" } }}
                    InputProps={{ sx: { color: "text.primary" } }}
                  />
                  <Button variant="contained" onClick={() => createInvite()}>
                    Create Invite
                  </Button>
                </Box>
                {inviteLoading && (
                  <Box sx={{ mt: 2, color: mutedText }}>
                    Preparing invite...
                  </Box>
                )}
                {inviteUrl && !inviteLoading && (
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 2,
                      p: 2,
                      borderRadius: 2,
                      background: "rgba(255, 179, 0, 0.05)",
                      border: "1px solid rgba(255, 179, 0, 0.2)",
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: mutedText, mb: 1 }}>
                      Invite URL
                    </Typography>
                    <Typography sx={{ color: "text.primary", wordBreak: "break-all" }}>
                      {inviteUrl}
                    </Typography>
                  </Paper>
                )}
              </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Upload Photo (Admin Only)
              </Typography>
              <Typography sx={{ mb: 2, color: mutedText }}>
                Example: folder ID <strong>client-jones</strong>, file{" "}
                <strong>IMG_1234.jpg</strong>
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
                    Choose file
                    <input
                      type="file"
                      hidden
                      onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                    />
                  </Button>
                  <Button variant="contained" onClick={uploadImage}>
                    Upload
                  </Button>
                </Box>
                {uploadFile && (
                  <Box sx={{ mt: 1, color: mutedText }}>
                    Selected: {uploadFile.name}
                  </Box>
                )}
              </Box>

            </Box>
          </Box>
        </Container>
      ) : (
        <Container sx={{ color: "text.secondary" }}>
          <Typography>Admin access required.</Typography>
        </Container>
      )}
    </>
  );
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const [, base64] = result.split(",");
        resolve(base64 ?? "");
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
