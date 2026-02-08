import { Box, Container, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { Header } from "../components/Header";
import { Photo } from "../types/photo";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { authFetch } from "../utils/authFetch";
import { AdvancedSection } from "./admin/AdvancedSection";
import { CreateFolderSection } from "./admin/CreateFolderSection";
import { CreateInviteSection } from "./admin/CreateInviteSection";
import { FolderAccessPanel } from "./admin/FolderAccessPanel";
import { FolderItemsSection } from "./admin/FolderItemsSection";
import { FoldersSidebar } from "./admin/FoldersSidebar";
import { UploadPhotoSection } from "./admin/UploadPhotoSection";
import { FolderSummary, FolderUser } from "./admin/types";

export default function Admin() {
  const { user } = useAuth();
  const [folderId, setFolderId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteFolderId, setInviteFolderId] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
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
  const [bannedUsers, setBannedUsers] = useState<FolderUser[]>([]);
  const [bannedLoading, setBannedLoading] = useState(false);
  const [bannedError, setBannedError] = useState<string | null>(null);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);
  const [userActionKey, setUserActionKey] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const itemsPerPage = 10;

  const theme = useTheme();
  const isAdmin = Boolean(user?.groups.includes("admin"));
  const mutedText = theme.palette.text.secondary;
  const subtleBorder = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.12 : 0.2);
  const cardBg = alpha(theme.palette.common.black, theme.palette.mode === "light" ? 0.04 : 0.2);
  const itemBg = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.06 : 0.08);

  const apiBase = photoApiBaseUrl;
  const showFolderAccessPanel = Boolean(selectedFolder && selectedFolder !== "public");

  const getFileName = (key: string) => key.split("/").pop() ?? key;

  const loadFolders = async () => {
    if (!apiBase) return;
    const res = await authFetch(`${apiBase}/folders`, { method: "GET" });
    if (!res.ok) return;
    const payload = await res.json();
    const items: FolderSummary[] = Array.isArray(payload.folders) ? payload.folders : [];
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

  const loadFolderItems = async (folderIdToLoad: string) => {
    if (!apiBase) return;
    setItemsLoading(true);
    setItemsError(null);
    try {
      const res = await authFetch(`${apiBase}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: folderIdToLoad, limit: 1000 }),
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

  const loadFolderUsers = async (folderIdToLoad: string) => {
    if (!apiBase) return;
    setUsersLoading(true);
    setUsersError(null);
    setBannedLoading(true);
    setBannedError(null);
    try {
      const res = await authFetch(
        `${apiBase}/folder-users?folderId=${encodeURIComponent(folderIdToLoad)}`,
        { method: "GET" },
      );
      if (!res.ok) {
        throw new Error(`Failed to load users: ${res.status}`);
      }
      const payload = await res.json();
      const users: FolderUser[] = Array.isArray(payload.users) ? payload.users : [];
      const banned: FolderUser[] = Array.isArray(payload.bannedUsers) ? payload.bannedUsers : [];
      setFolderUsers(users);
      setBannedUsers(banned);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users.";
      setUsersError(message);
      setBannedError(message);
    } finally {
      setUsersLoading(false);
      setBannedLoading(false);
    }
  };

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
    setInviteUrl(`${window.location.origin}/login?invite=${inviteCode}`);
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
    if (uploadFiles.length === 0) {
      setStatusMessage("Select one or more files to upload.");
      return;
    }

    const images = await Promise.all(
      uploadFiles.map(async (file) => ({
        imageName: file.name,
        image: await toBase64(file),
      })),
    );
    const res = await authFetch(`${apiBase}/upload-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: uploadFolderId, images }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setStatusMessage(payload?.message ?? "Upload failed.");
      return;
    }
    setStatusMessage(payload.message ?? "Upload complete.");
    setUploadFiles([]);
    if (selectedFolder && uploadFolderId && selectedFolder === uploadFolderId) {
      loadFolderItems(selectedFolder).catch(() => undefined);
    }
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

  const backfillFolderUsers = async () => {
    if (!apiBase) return;
    setBackfillMessage(null);
    setBackfillLoading(true);
    try {
      const res = await authFetch(`${apiBase}/folder-users-backfill`, {
        method: "POST",
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message ?? "Backfill failed.");
      }
      const scanned = payload?.scanned ?? 0;
      const updated = payload?.updated ?? 0;
      setBackfillMessage(`Backfill complete. Scanned ${scanned}, updated ${updated}.`);
      if (showFolderAccessPanel && selectedFolder) {
        loadFolderUsers(selectedFolder).catch(() => undefined);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to backfill.";
      setBackfillMessage(message);
    } finally {
      setBackfillLoading(false);
    }
  };

  const removeFolderUser = async (username: string) => {
    if (!apiBase || !selectedFolder || selectedFolder === "public") return;
    const confirmed = window.confirm(
      `Remove ${username} from ${selectedFolder}? They will no longer have access to this folder.`,
    );
    if (!confirmed) return;
    setUserActionKey(username);
    try {
      const res = await authFetch(`${apiBase}/folder-users-remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: selectedFolder, username }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message ?? "Remove failed.");
      }
      setFolderUsers((prev) => prev.filter((entry) => entry.username !== username));
      loadFolderUsers(selectedFolder).catch(() => undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Remove failed.";
      setUsersError(message);
    } finally {
      setUserActionKey(null);
    }
  };

  const unbanFolderUser = async (username: string) => {
    if (!apiBase || !selectedFolder || selectedFolder === "public") return;
    const confirmed = window.confirm(
      `Unban ${username} for ${selectedFolder}? They can accept invites again.`,
    );
    if (!confirmed) return;
    setUserActionKey(username);
    try {
      const res = await authFetch(`${apiBase}/folder-users-unban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: selectedFolder, username }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message ?? "Unban failed.");
      }
      setBannedUsers((prev) => prev.filter((entry) => entry.username !== username));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unban failed.";
      setBannedError(message);
    } finally {
      setUserActionKey(null);
    }
  };

  useEffect(() => {
    if (!selectedFolder) return;
    loadFolderItems(selectedFolder).catch(() => undefined);
  }, [selectedFolder]);

  useEffect(() => {
    if (!showFolderAccessPanel || !selectedFolder) {
      setFolderUsers([]);
      setBannedUsers([]);
      setUsersError(null);
      setBannedError(null);
      return;
    }
    loadFolderUsers(selectedFolder).catch(() => undefined);
  }, [selectedFolder, showFolderAccessPanel]);

  return (
    <>
      <Header />
      {isAdmin ? (
        <Container maxWidth="lg" sx={{ color: "text.primary", pt: { xs: 2, sm: 3, md: 4 } }}>
          <Typography variant="h4" sx={{ mb: 4 }}>
            Admin
          </Typography>

          {statusMessage && <Box sx={{ mb: 3, color: mutedText }}>{statusMessage}</Box>}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
              gap: 4,
            }}
          >
            <FoldersSidebar
              folders={folders}
              selectedFolder={selectedFolder}
              folderIdInput={folderId}
              mutedText={mutedText}
              subtleBorder={subtleBorder}
              cardBg={cardBg}
              itemBg={itemBg}
              onSelectFolder={(folderIdToSelect) => {
                setSelectedFolder(folderIdToSelect);
                setInviteFolderId(folderIdToSelect);
                setUploadFolderId(folderIdToSelect);
                createInvite(folderIdToSelect, true);
              }}
              onDeleteFolder={deleteFolder}
              onSeedFolderId={setFolderId}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  xl: showFolderAccessPanel ? "minmax(0, 1fr) 340px" : "1fr",
                },
                gap: 3,
                alignItems: "start",
              }}
            >
              <Box>
                <FolderItemsSection
                  selectedFolder={selectedFolder}
                  folders={folders}
                  itemsMoveTarget={itemsMoveTarget}
                  setItemsMoveTarget={setItemsMoveTarget}
                  itemsLoading={itemsLoading}
                  itemsError={itemsError}
                  folderItems={folderItems}
                  itemsPage={itemsPage}
                  itemsPerPage={itemsPerPage}
                  setItemsPage={setItemsPage}
                  actionKey={actionKey}
                  mutedText={mutedText}
                  onRefresh={() => selectedFolder && loadFolderItems(selectedFolder)}
                  onDuplicate={duplicatePhoto}
                  onMove={movePhotoFromList}
                  onDelete={deletePhoto}
                />

                <CreateFolderSection
                  folderId={folderId}
                  displayName={displayName}
                  mutedText={mutedText}
                  setFolderId={setFolderId}
                  setDisplayName={setDisplayName}
                  onCreateFolder={createFolder}
                />

                <CreateInviteSection
                  inviteFolderId={inviteFolderId}
                  inviteLoading={inviteLoading}
                  inviteUrl={inviteUrl}
                  mutedText={mutedText}
                  setInviteFolderId={setInviteFolderId}
                  onCreateInvite={() => createInvite()}
                />

                <UploadPhotoSection
                  uploadFolderId={uploadFolderId}
                  uploadFiles={uploadFiles}
                  mutedText={mutedText}
                  setUploadFolderId={setUploadFolderId}
                  setUploadFiles={setUploadFiles}
                  onUpload={uploadImage}
                />
              </Box>

              {showFolderAccessPanel && selectedFolder && (
                <FolderAccessPanel
                  selectedFolder={selectedFolder}
                  folderUsers={folderUsers}
                  bannedUsers={bannedUsers}
                  usersLoading={usersLoading}
                  usersError={usersError}
                  bannedLoading={bannedLoading}
                  bannedError={bannedError}
                  userActionKey={userActionKey}
                  mutedText={mutedText}
                  subtleBorder={subtleBorder}
                  cardBg={cardBg}
                  onRemoveUser={removeFolderUser}
                  onUnbanUser={unbanFolderUser}
                />
              )}
            </Box>
          </Box>

          <AdvancedSection
            subtleBorder={subtleBorder}
            cardBg={cardBg}
            mutedText={mutedText}
            backfillLoading={backfillLoading}
            backfillMessage={backfillMessage}
            onBackfill={backfillFolderUsers}
          />
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
