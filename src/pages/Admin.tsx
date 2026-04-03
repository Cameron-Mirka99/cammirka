import { Alert, Box, Container, Snackbar, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { MotionReveal } from "../utils/motion";

const MAX_UPLOAD_REQUEST_BYTES = 10 * 1024 * 1024;

export default function Admin() {
  const { user } = useAuth();
  const [folderId, setFolderId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteFolderId, setInviteFolderId] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadErrorToast, setUploadErrorToast] = useState<string | null>(null);
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
  const [allUsers, setAllUsers] = useState<FolderUser[]>([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [allUsersError, setAllUsersError] = useState<string | null>(null);
  const [assignFolderId, setAssignFolderId] = useState("");
  const [selectedAssignableUser, setSelectedAssignableUser] = useState<FolderUser | null>(null);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [bannedUsers, setBannedUsers] = useState<FolderUser[]>([]);
  const [bannedLoading, setBannedLoading] = useState(false);
  const [bannedError, setBannedError] = useState<string | null>(null);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);
  const [userActionKey, setUserActionKey] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const folderItemsRequestSeq = useRef(0);
  const selectedFolderRef = useRef<string | null>(null);
  const itemsPerPage = 10;

  const theme = useTheme();
  const isAdmin = Boolean(user?.groups.includes("admin"));
  const mutedText = theme.palette.text.secondary;
  const subtleBorder = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.08 : 0.16);
  const cardBg = alpha(theme.palette.background.paper, theme.palette.mode === "light" ? 0.82 : 0.78);
  const itemBg = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.06 : 0.08);

  const apiBase = photoApiBaseUrl;
  const showFolderAccessPanel = Boolean(selectedFolder && selectedFolder !== "public");

  const getFileName = (key: string) => key.split("/").pop() ?? key;

  const loadFolders = useCallback(async () => {
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
  }, [apiBase]);

  const loadAllUsers = useCallback(async () => {
    if (!apiBase) return;
    setAllUsersLoading(true);
    setAllUsersError(null);
    try {
      const res = await authFetch(`${apiBase}/users`, { method: "GET" });
      if (!res.ok) {
        throw new Error(`Failed to load users: ${res.status}`);
      }
      const payload = await res.json();
      const users: FolderUser[] = Array.isArray(payload.users) ? payload.users : [];
      setAllUsers(users);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users.";
      setAllUsersError(message);
    } finally {
      setAllUsersLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadFolders().catch(() => undefined);
    loadAllUsers().catch(() => undefined);
  }, [loadAllUsers, loadFolders]);

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

  useEffect(() => {
    if (selectedFolder && selectedFolder !== "public") {
      setAssignFolderId(selectedFolder);
    }
  }, [selectedFolder]);

  const loadFolderItems = useCallback(async (folderIdToLoad: string) => {
    if (!apiBase) return;
    const requestSeq = ++folderItemsRequestSeq.current;
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
      const rawItems: Photo[] = Array.isArray(payload.photos) ? payload.photos : [];
      const folderPrefix = `${folderIdToLoad.replace(/^\/+|\/+$/g, "")}/`;
      const itemsInFolder = rawItems.filter(
        (item) =>
          typeof item?.key === "string" &&
          item.key.startsWith(folderPrefix) &&
          !item.key.slice(folderPrefix.length).includes("/"),
      );
      const uniqueItems = Array.from(
        new Map(itemsInFolder.map((item) => [item.key, item])).values(),
      );
      if (requestSeq !== folderItemsRequestSeq.current) return;
      if (selectedFolderRef.current !== folderIdToLoad) return;
      setFolderItems(uniqueItems);
      setItemsPage(1);
    } catch (err) {
      if (requestSeq !== folderItemsRequestSeq.current) return;
      if (selectedFolderRef.current !== folderIdToLoad) return;
      const message = err instanceof Error ? err.message : "Failed to load items.";
      setItemsError(message);
    } finally {
      if (requestSeq !== folderItemsRequestSeq.current) return;
      if (selectedFolderRef.current !== folderIdToLoad) return;
      setItemsLoading(false);
    }
  }, [apiBase]);

  const loadFolderUsers = useCallback(async (folderIdToLoad: string) => {
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
  }, [apiBase]);

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
      const message = "REACT_APP_PHOTO_API_URL is not configured.";
      setStatusMessage(message);
      setUploadErrorToast(message);
      return;
    }
    if (uploadFiles.length === 0) {
      const message = "Select one or more files to upload.";
      setStatusMessage(message);
      setUploadErrorToast(message);
      return;
    }

    try {
      const images = await Promise.all(
        uploadFiles.map((file) => buildUploadPayload(file)),
      );
      const requestBody = JSON.stringify({ folderId: uploadFolderId, images });
      const requestBytes = new Blob([requestBody]).size;
      if (requestBytes > MAX_UPLOAD_REQUEST_BYTES) {
        const message = `Upload request exceeds 10 MB (${formatBytes(requestBytes)}). Try fewer files or smaller images.`;
        setStatusMessage(message);
        setUploadErrorToast(message);
        return;
      }

      const res = await authFetch(`${apiBase}/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const responseMessage = [
          payload?.message,
          payload?.error,
          typeof payload?.details === "string" ? payload.details : null,
        ]
          .filter(Boolean)
          .join(" ");
        const message = responseMessage || `Upload failed (HTTP ${res.status}).`;
        setStatusMessage(message);
        setUploadErrorToast(message);
        return;
      }
      setStatusMessage(payload.message ?? "Upload complete.");
      setUploadFiles([]);
      if (selectedFolder && uploadFolderId && selectedFolder === uploadFolderId) {
        loadFolderItems(selectedFolder).catch(() => undefined);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setStatusMessage(message);
      setUploadErrorToast(message);
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
    setFolderItems((prev) => prev.filter((item) => (item.storageKey ?? item.key) !== key));
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
    setFolderItems((prev) => prev.filter((item) => (item.storageKey ?? item.key) !== key));
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

  const addUserToFolder = async () => {
    if (!apiBase) {
      setStatusMessage("REACT_APP_PHOTO_API_URL is not configured.");
      return;
    }
    if (!selectedAssignableUser?.username) {
      setStatusMessage("Select a user to add.");
      return;
    }
    if (!assignFolderId) {
      setStatusMessage("Select a destination folder.");
      return;
    }

    setStatusMessage(null);
    setAddUserLoading(true);
    try {
      const res = await authFetch(`${apiBase}/folder-users-add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: assignFolderId,
          username: selectedAssignableUser.username,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message ?? "Failed to add user.");
      }
      setStatusMessage(`Added ${selectedAssignableUser.username} to ${assignFolderId}.`);
      if (selectedFolder === assignFolderId) {
        loadFolderUsers(assignFolderId).catch(() => undefined);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add user.";
      setStatusMessage(message);
    } finally {
      setAddUserLoading(false);
    }
  };

  useEffect(() => {
    selectedFolderRef.current = selectedFolder;
  }, [selectedFolder]);

  useEffect(() => {
    folderItemsRequestSeq.current += 1;
    setFolderItems([]);
    if (!selectedFolder) {
      setItemsLoading(false);
      return;
    }
    loadFolderItems(selectedFolder).catch(() => undefined);
  }, [selectedFolder, loadFolderItems]);

  useEffect(() => {
    if (!showFolderAccessPanel || !selectedFolder) {
      setFolderUsers([]);
      setBannedUsers([]);
      setUsersError(null);
      setBannedError(null);
      return;
    }
    loadFolderUsers(selectedFolder).catch(() => undefined);
  }, [selectedFolder, showFolderAccessPanel, loadFolderUsers]);

  return (
    <>
      <Header />
      <Snackbar
        open={Boolean(uploadErrorToast)}
        autoHideDuration={5000}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setUploadErrorToast(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setUploadErrorToast(null)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {uploadErrorToast}
        </Alert>
      </Snackbar>
      {isAdmin ? (
        <Container maxWidth={false} sx={{ color: "text.primary", px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 3, md: 5 } }}>
          <MotionReveal
            sx={{
              mb: 4,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr auto" },
              gap: 2,
              alignItems: "end",
              borderBottom: `1px solid ${subtleBorder}`,
              pb: { xs: 2.5, md: 3 },
            }}
          >
            <Box sx={{ maxWidth: 720 }}>
              <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
                Admin Workspace
              </Typography>
              <Typography variant="h4" sx={{ mb: 1, fontSize: { xs: "2rem", md: "2.8rem" } }}>
                Manage folders, invites, and access
              </Typography>
              <Typography sx={{ color: mutedText }}>
                Operate the private gallery system from one place: folder structure, uploads, access control, and invite distribution.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(88px, 120px))",
                gap: 1.5,
              }}
            >
              <Box sx={{ border: `1px solid ${subtleBorder}`, borderRadius: 3, px: 1.5, py: 1.25, backgroundColor: cardBg }}>
                <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em", color: mutedText }}>
                  Folders
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
                  {folders.length}
                </Typography>
              </Box>
              <Box sx={{ border: `1px solid ${subtleBorder}`, borderRadius: 3, px: 1.5, py: 1.25, backgroundColor: cardBg }}>
                <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em", color: mutedText }}>
                  Users
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
                  {allUsers.length}
                </Typography>
              </Box>
              <Box sx={{ border: `1px solid ${subtleBorder}`, borderRadius: 3, px: 1.5, py: 1.25, backgroundColor: cardBg }}>
                <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em", color: mutedText }}>
                  Active
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
                  {selectedFolder ?? "None"}
                </Typography>
              </Box>
            </Box>
          </MotionReveal>

          {statusMessage && (
            <MotionReveal
              sx={{
                mb: 3,
                px: 2.25,
                py: 1.75,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: mutedText,
              }}
            >
              {statusMessage}
            </MotionReveal>
          )}

          <MotionReveal delay={80}>
            <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "320px minmax(0, 1fr)" },
              gap: { xs: 3, md: 4 },
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
                setAssignFolderId(folderIdToSelect);
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
                  allUsers={allUsers}
                  allUsersLoading={allUsersLoading}
                  allUsersError={allUsersError}
                  folders={folders}
                  assignFolderId={assignFolderId}
                  selectedAssignableUser={selectedAssignableUser}
                  bannedLoading={bannedLoading}
                  bannedError={bannedError}
                  userActionKey={userActionKey}
                  addUserLoading={addUserLoading}
                  mutedText={mutedText}
                  subtleBorder={subtleBorder}
                  cardBg={cardBg}
                  onAssignFolderChange={setAssignFolderId}
                  onAssignableUserChange={setSelectedAssignableUser}
                  onAddUserToFolder={addUserToFolder}
                  onRemoveUser={removeFolderUser}
                  onUnbanUser={unbanFolderUser}
                />
              )}
            </Box>
            </Box>
          </MotionReveal>

          <MotionReveal delay={140}>
            <AdvancedSection
              subtleBorder={subtleBorder}
              cardBg={cardBg}
              mutedText={mutedText}
              backfillLoading={backfillLoading}
              backfillMessage={backfillMessage}
              onBackfill={backfillFolderUsers}
            />
          </MotionReveal>
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function buildUploadPayload(file: File) {
  const image = await toBase64(file);
  const thumbnail = await createThumbnailFile(file);

  return {
    imageName: file.name,
    image,
    thumbnailImage: await toBase64(thumbnail),
    thumbnailContentType: thumbnail.type || file.type || "image/jpeg",
  };
}

async function createThumbnailFile(file: File) {
  if (file.type === "image/gif") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const maxWidth = 960;
  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not create canvas context for thumbnail.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) {
          resolve(value);
          return;
        }
        reject(new Error("Failed to render thumbnail."));
      },
      outputType,
      outputType === "image/jpeg" ? 0.82 : undefined,
    );
  });

  return new File([blob], file.name, {
    type: outputType,
    lastModified: file.lastModified,
  });
}
