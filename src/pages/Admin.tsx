import { Box, Button, Container, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { SyntheticEvent, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { Header } from "../components/Header";
import { Photo } from "../types/photo";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { authFetch } from "../utils/authFetch";
import { MotionReveal } from "../utils/motion";
import { AdvancedSection } from "./admin/AdvancedSection";
import { CreateFolderSection } from "./admin/CreateFolderSection";
import { CreateInviteSection } from "./admin/CreateInviteSection";
import { FolderAccessPanel } from "./admin/FolderAccessPanel";
import { FolderItemsSection } from "./admin/FolderItemsSection";
import { FoldersSidebar } from "./admin/FoldersSidebar";
import { UserDirectorySection } from "./admin/UserDirectorySection";
import { UploadPhotoSection } from "./admin/UploadPhotoSection";
import { UploadErrorToast } from "./admin/UploadErrorToast";
import { buildTagKey, normalizeTags } from "./admin/tagUtils";
import { buildSingleUploadRequestBody, exceedsUploadLimit, formatBytes, getUploadLimitBytes } from "./admin/uploadUtils";
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
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
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
  const [selectedDirectoryUser, setSelectedDirectoryUser] = useState<FolderUser | null>(null);
  const [directoryGivenName, setDirectoryGivenName] = useState("");
  const [directoryFamilyName, setDirectoryFamilyName] = useState("");
  const [saveUserLoading, setSaveUserLoading] = useState(false);
  const [saveUserMessage, setSaveUserMessage] = useState<string | null>(null);
  const [bannedUsers, setBannedUsers] = useState<FolderUser[]>([]);
  const [bannedLoading, setBannedLoading] = useState(false);
  const [bannedError, setBannedError] = useState<string | null>(null);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);
  const [userActionKey, setUserActionKey] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagActionKey, setTagActionKey] = useState<string | null>(null);
  const [operationsTab, setOperationsTab] = useState<"upload" | "invite" | "folder">("upload");
  const [globalTab, setGlobalTab] = useState<"directory" | "advanced">("directory");
  const folderItemsRequestSeq = useRef(0);
  const selectedFolderRef = useRef<string | null>(null);
  const uploadSectionRef = useRef<HTMLDivElement | null>(null);
  const inviteSectionRef = useRef<HTMLDivElement | null>(null);
  const accessSectionRef = useRef<HTMLDivElement | null>(null);
  const directorySectionRef = useRef<HTMLDivElement | null>(null);
  const itemsPerPage = 10;

  const theme = useTheme();
  const isAdmin = Boolean(user?.groups.includes("admin"));
  const mutedText = theme.palette.text.secondary;
  const subtleBorder = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.08 : 0.16);
  const cardBg = alpha(theme.palette.background.paper, theme.palette.mode === "light" ? 0.82 : 0.78);
  const itemBg = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.06 : 0.08);

  const apiBase = photoApiBaseUrl;
  const showFolderAccessPanel = Boolean(selectedFolder && selectedFolder !== "public");
  const selectedFolderSummary = folders.find((folder) => folder.folderId === selectedFolder) ?? null;
  const selectedFolderLabel = selectedFolderSummary?.displayName ?? selectedFolder ?? "No folder selected";

  const getFileName = (key: string) => key.split("/").pop() ?? key;
  const getDisplayUserName = (entry: FolderUser) =>
    entry.fullName ||
    entry.name ||
    [entry.givenName, entry.familyName].filter(Boolean).join(" ") ||
    entry.email ||
    entry.username;

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleOperationsTabChange = (_event: SyntheticEvent, value: "upload" | "invite" | "folder") => {
    setOperationsTab(value);
  };

  const handleGlobalTabChange = (_event: SyntheticEvent, value: "directory" | "advanced") => {
    setGlobalTab(value);
  };

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
      const users: FolderUser[] = Array.isArray(payload.users)
        ? payload.users.map((entry: FolderUser) => ({
            ...entry,
            fullName:
              [entry.givenName, entry.familyName].filter(Boolean).join(" ") ||
              entry.name,
          }))
        : [];
      setAllUsers(users);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users.";
      setAllUsersError(message);
    } finally {
      setAllUsersLoading(false);
    }
  }, [apiBase]);

  const loadTags = useCallback(async () => {
    if (!apiBase) return;
    try {
      const res = await authFetch(`${apiBase}/tags`, { method: "GET" });
      if (!res.ok) {
        throw new Error(`Failed to load tags: ${res.status}`);
      }
      const payload = await res.json();
      const tags = Array.isArray(payload.tags)
        ? payload.tags
            .map((entry: { label?: string }) => (typeof entry?.label === "string" ? entry.label : ""))
            .filter(Boolean)
        : [];
      setAvailableTags(normalizeTags(tags));
    } catch (err) {
      console.error(err);
    }
  }, [apiBase]);

  const confirmNewTags = useCallback((tags: string[]) => {
    const normalized = normalizeTags(tags);
    const knownTagKeys = new Set(availableTags.map(buildTagKey));
    const newTags = normalized.filter((tag) => !knownTagKeys.has(buildTagKey(tag)));

    if (newTags.length === 0) {
      return normalized;
    }

    const confirmed = window.confirm(
      `Create ${newTags.length === 1 ? "new tag" : "new tags"}: ${newTags.join(", ")}?`,
    );

    return confirmed ? normalized : null;
  }, [availableTags]);

  useEffect(() => {
    loadFolders().catch(() => undefined);
    loadAllUsers().catch(() => undefined);
    loadTags().catch(() => undefined);
  }, [loadAllUsers, loadFolders, loadTags]);

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
      const users: FolderUser[] = Array.isArray(payload.users)
        ? payload.users.map((entry: FolderUser) => ({
            ...entry,
            fullName:
              [entry.givenName, entry.familyName].filter(Boolean).join(" ") ||
              entry.name,
          }))
        : [];
      const banned: FolderUser[] = Array.isArray(payload.bannedUsers)
        ? payload.bannedUsers.map((entry: FolderUser) => ({
            ...entry,
            fullName:
              [entry.givenName, entry.familyName].filter(Boolean).join(" ") ||
              entry.name,
          }))
        : [];
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
    if (uploadLoading) {
      return;
    }

    const confirmedTags = confirmNewTags(uploadTags);
    if (confirmedTags === null) {
      setStatusMessage("Upload cancelled.");
      return;
    }

    setUploadLoading(true);
    try {
      const totalFiles = uploadFiles.length;
      const uploadedFiles: string[] = [];
      const failedFiles: string[] = [];

        for (const [index, file] of uploadFiles.entries()) {
          setStatusMessage(`Uploading ${index + 1} of ${totalFiles}: ${file.name}`);

          const { requestBody, requestBytes } = await buildSingleUploadRequestBody(uploadFolderId, file, confirmedTags);
        if (exceedsUploadLimit(requestBytes)) {
          failedFiles.push(
            `${file.name} (request size ${formatBytes(requestBytes)} exceeds ${formatBytes(getUploadLimitBytes())})`,
          );
          continue;
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
          failedFiles.push(`${file.name} (${responseMessage || `HTTP ${res.status}`})`);
          continue;
        }

        uploadedFiles.push(file.name);
      }

      if (uploadedFiles.length > 0) {
        setUploadFiles([]);
        setUploadTags([]);
        setAvailableTags((prev) => normalizeTags([...prev, ...confirmedTags]));
        loadTags().catch(() => undefined);
      }

      if (uploadedFiles.length > 0 && selectedFolder && uploadFolderId && selectedFolder === uploadFolderId) {
        loadFolderItems(selectedFolder).catch(() => undefined);
      }

      if (failedFiles.length === 0) {
        setStatusMessage(
          uploadedFiles.length === 1 ? `Uploaded ${uploadedFiles[0]}.` : `Uploaded ${uploadedFiles.length} files.`,
        );
        return;
      }

      const summary = [
        uploadedFiles.length > 0 ? `Uploaded ${uploadedFiles.length} of ${totalFiles} files.` : "No files were uploaded.",
        `Failed: ${failedFiles.join("; ")}`,
      ].join(" ");
      setStatusMessage(summary);
      setUploadErrorToast(summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setStatusMessage(message);
      setUploadErrorToast(message);
    } finally {
      setUploadLoading(false);
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

  const savePhotoTags = async (photoKey: string, tags: string[]) => {
    if (!apiBase) {
      setStatusMessage("REACT_APP_PHOTO_API_URL is not configured.");
      return;
    }

    const confirmedTags = confirmNewTags(tags);
    if (confirmedTags === null) {
      setStatusMessage("Tag update cancelled.");
      return;
    }

    setStatusMessage(null);
    setTagActionKey(photoKey);
    try {
      const res = await authFetch(`${apiBase}/photo-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoKey, tags: confirmedTags }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message ?? "Failed to update tags.");
      }

      setFolderItems((prev) =>
        prev.map((item) =>
          item.key === photoKey
            ? {
                ...item,
                tags: Array.isArray(payload.tags) ? payload.tags : confirmedTags,
              }
            : item,
        ),
      );
      setAvailableTags((prev) => normalizeTags([...prev, ...confirmedTags]));
      setStatusMessage(
        confirmedTags.length > 0
          ? `Saved tags for ${getFileName(photoKey)}.`
          : `Removed all tags from ${getFileName(photoKey)}.`,
      );
      loadTags().catch(() => undefined);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to update tags.");
    } finally {
      setTagActionKey(null);
    }
  };

  useEffect(() => {
    setDirectoryGivenName(selectedDirectoryUser?.givenName ?? "");
    setDirectoryFamilyName(selectedDirectoryUser?.familyName ?? "");
    setSaveUserMessage(null);
  }, [selectedDirectoryUser]);

  const applyUpdatedUser = useCallback((updatedUser: FolderUser) => {
    const normalize = (entry: FolderUser) =>
      entry.username === updatedUser.username
        ? {
            ...entry,
            ...updatedUser,
            fullName:
              [updatedUser.givenName, updatedUser.familyName].filter(Boolean).join(" ") ||
              updatedUser.name,
          }
        : entry;

    setAllUsers((prev) => prev.map(normalize));
    setFolderUsers((prev) => prev.map(normalize));
    setBannedUsers((prev) => prev.map(normalize));
    setSelectedDirectoryUser((prev) =>
      prev?.username === updatedUser.username
        ? {
            ...prev,
            ...updatedUser,
            fullName:
              [updatedUser.givenName, updatedUser.familyName].filter(Boolean).join(" ") ||
              updatedUser.name,
          }
        : prev,
    );
  }, []);

  const saveDirectoryUser = async () => {
    if (!apiBase || !selectedDirectoryUser) {
      return;
    }

    const nextGivenName = directoryGivenName.trim();
    const nextFamilyName = directoryFamilyName.trim();

    setSaveUserMessage(null);
    if (!nextGivenName || !nextFamilyName) {
      setSaveUserMessage("First name and last name are required.");
      return;
    }

    setSaveUserLoading(true);
    try {
      const res = await authFetch(`${apiBase}/users/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: selectedDirectoryUser.username,
          givenName: nextGivenName,
          familyName: nextFamilyName,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message ?? "Failed to update user.");
      }

      const updatedUser: FolderUser = {
        ...selectedDirectoryUser,
        givenName: payload.givenName,
        familyName: payload.familyName,
        name: payload.name,
        fullName: payload.name,
      };
      applyUpdatedUser(updatedUser);
      setSaveUserMessage(`Updated ${getDisplayUserName(updatedUser)}.`);
      loadAllUsers().catch(() => undefined);
      if (selectedFolder && selectedFolder !== "public") {
        loadFolderUsers(selectedFolder).catch(() => undefined);
      }
    } catch (err) {
      setSaveUserMessage(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setSaveUserLoading(false);
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
      <UploadErrorToast message={uploadErrorToast} onClose={() => setUploadErrorToast(null)} />
      {isAdmin ? (
        <Container
          maxWidth={false}
          sx={{ color: "text.primary", px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 3, md: 5 } }}
        >
          <MotionReveal
            sx={{
              mb: 4,
              border: `1px solid ${subtleBorder}`,
              borderRadius: 6,
              overflow: "hidden",
              background:
                "linear-gradient(135deg, rgba(184, 138, 42, 0.16), rgba(184, 138, 42, 0.04) 34%, rgba(127, 138, 120, 0.14) 100%)",
            }}
          >
            <Box
              sx={{
                px: { xs: 2.5, md: 4 },
                py: { xs: 3, md: 4 },
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) auto" },
                gap: 3,
                alignItems: "end",
              }}
            >
              <Box sx={{ maxWidth: 760 }}>
                <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
                  Admin Workspace
                </Typography>
                <Typography variant="h3" sx={{ mb: 1.25, fontSize: { xs: "2.3rem", md: "3.35rem" } }}>
                  Run folders, uploads, sharing, and access from one clear surface
                </Typography>
                <Typography sx={{ color: mutedText, maxWidth: 700 }}>
                  The page now centers the selected folder first, keeps media rows visually stable while thumbnails load, and separates day-to-day operations from global maintenance.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(110px, 1fr))" },
                  gap: 1.25,
                  minWidth: { lg: 480 },
                }}
              >
                <Box sx={{ border: `1px solid ${subtleBorder}`, borderRadius: 3.5, px: 1.5, py: 1.4, backgroundColor: cardBg }}>
                  <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: mutedText }}>
                    Folders
                  </Typography>
                  <Typography variant="h6">{folders.length}</Typography>
                </Box>
                <Box sx={{ border: `1px solid ${subtleBorder}`, borderRadius: 3.5, px: 1.5, py: 1.4, backgroundColor: cardBg }}>
                  <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: mutedText }}>
                    Users
                  </Typography>
                  <Typography variant="h6">{allUsers.length}</Typography>
                </Box>
                <Box sx={{ border: `1px solid ${subtleBorder}`, borderRadius: 3.5, px: 1.5, py: 1.4, backgroundColor: cardBg }}>
                  <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: mutedText }}>
                    Active items
                  </Typography>
                  <Typography variant="h6">{selectedFolder ? folderItems.length : 0}</Typography>
                </Box>
                <Box sx={{ border: `1px solid ${subtleBorder}`, borderRadius: 3.5, px: 1.5, py: 1.4, backgroundColor: cardBg }}>
                  <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: mutedText }}>
                    Selected
                  </Typography>
                  <Typography variant="h6" sx={{ overflowWrap: "anywhere" }}>
                    {selectedFolder ?? "None"}
                  </Typography>
                </Box>
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
                gridTemplateColumns: { xs: "1fr", lg: "300px minmax(0, 1fr)" },
                gap: { xs: 3, lg: 4 },
                alignItems: "start",
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

              <Box sx={{ display: "grid", gap: 3 }}>
                <Box
                  sx={{
                    border: `1px solid ${subtleBorder}`,
                    borderRadius: 5,
                    p: { xs: 2.5, md: 3 },
                    background: cardBg,
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) auto" },
                      gap: 2.5,
                      alignItems: "end",
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
                        Current Focus
                      </Typography>
                      <Typography variant="h4" sx={{ mb: 0.75, fontSize: { xs: "2rem", md: "2.6rem" } }}>
                        {selectedFolderLabel}
                      </Typography>
                      <Typography sx={{ color: mutedText, maxWidth: 760 }}>
                        {selectedFolder
                          ? "This command deck keeps the active folder visible while you jump directly to uploads, invite creation, or access control."
                          : "Pick a folder from the index to activate the full workspace. The selected folder automatically feeds the item manager and folder-specific tools."}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(120px, 1fr))" },
                        gap: 1.25,
                        minWidth: { xl: 420 },
                      }}
                    >
                      <Box sx={{ px: 1.5, py: 1.25, borderRadius: 3, backgroundColor: alpha("#191713", 0.04) }}>
                        <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: mutedText }}>
                          Items
                        </Typography>
                        <Typography sx={{ mt: 0.35, fontWeight: 700 }}>{selectedFolder ? folderItems.length : 0}</Typography>
                      </Box>
                      <Box sx={{ px: 1.5, py: 1.25, borderRadius: 3, backgroundColor: alpha("#191713", 0.04) }}>
                        <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: mutedText }}>
                          Members
                        </Typography>
                        <Typography sx={{ mt: 0.35, fontWeight: 700 }}>{showFolderAccessPanel ? folderUsers.length : 0}</Typography>
                      </Box>
                      <Box sx={{ px: 1.5, py: 1.25, borderRadius: 3, backgroundColor: alpha("#191713", 0.04) }}>
                        <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: mutedText }}>
                          Bans
                        </Typography>
                        <Typography sx={{ mt: 0.35, fontWeight: 700 }}>{showFolderAccessPanel ? bannedUsers.length : 0}</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", mt: 2.5 }}>
                    <Button
                      variant="outlined"
                      onClick={() => selectedFolder && loadFolderItems(selectedFolder).catch(() => undefined)}
                      disabled={!selectedFolder || itemsLoading}
                    >
                      {itemsLoading ? "Refreshing..." : "Refresh library"}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setOperationsTab("upload");
                        scrollToSection(uploadSectionRef);
                      }}
                    >
                      Jump to upload
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setOperationsTab("invite");
                        scrollToSection(inviteSectionRef);
                      }}
                    >
                      Jump to invite
                    </Button>
                    {showFolderAccessPanel && (
                      <Button variant="outlined" onClick={() => scrollToSection(accessSectionRef)}>
                        Jump to access
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setGlobalTab("directory");
                        scrollToSection(directorySectionRef);
                      }}
                    >
                      User directory
                    </Button>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      xl: showFolderAccessPanel ? "minmax(0, 1fr) 360px" : "1fr",
                    },
                    gap: 3,
                    alignItems: "start",
                  }}
                >
                  <Box sx={{ display: "grid", gap: 3 }}>
                    <FolderItemsSection
                      selectedFolder={selectedFolder}
                      folders={folders}
                      availableTags={availableTags}
                      itemsMoveTarget={itemsMoveTarget}
                      setItemsMoveTarget={setItemsMoveTarget}
                      itemsLoading={itemsLoading}
                      itemsError={itemsError}
                      folderItems={folderItems}
                      itemsPage={itemsPage}
                      itemsPerPage={itemsPerPage}
                      setItemsPage={setItemsPage}
                      actionKey={actionKey}
                      tagActionKey={tagActionKey}
                      mutedText={mutedText}
                      onRefresh={() => {
                        if (selectedFolder) {
                          loadFolderItems(selectedFolder).catch(() => undefined);
                        }
                      }}
                      onDuplicate={duplicatePhoto}
                      onMove={movePhotoFromList}
                      onDelete={deletePhoto}
                      onSaveTags={savePhotoTags}
                    />

                    <Box>
                      <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
                        Operations
                      </Typography>
                      <Typography variant="h5" sx={{ mb: 0.75 }}>
                        Execute the next action without losing context
                      </Typography>
                      <Typography sx={{ mb: 2.5, color: mutedText, maxWidth: 760 }}>
                        Folder-specific actions sit together here so the workspace reads as a flow: upload assets, create sharing links, then create new folders when the structure needs to expand.
                      </Typography>

                      <Tabs
                        value={operationsTab}
                        onChange={handleOperationsTabChange}
                        variant="fullWidth"
                        sx={{
                          mb: 2.5,
                          "& .MuiTab-root": {
                            fontSize: "0.76rem",
                            py: 1.1,
                          },
                        }}
                      >
                        <Tab label="Upload" value="upload" />
                        <Tab label="Invite" value="invite" />
                        <Tab label="Create Folder" value="folder" />
                      </Tabs>

                      {operationsTab === "upload" && (
                        <Box ref={uploadSectionRef}>
                          <UploadPhotoSection
                            uploadFolderId={uploadFolderId}
                            uploadFiles={uploadFiles}
                            uploadTags={uploadTags}
                            availableTags={availableTags}
                            uploadLoading={uploadLoading}
                            mutedText={mutedText}
                            setUploadFolderId={setUploadFolderId}
                            setUploadFiles={setUploadFiles}
                            setUploadTags={setUploadTags}
                            onUpload={uploadImage}
                          />
                        </Box>
                      )}

                      {operationsTab === "invite" && (
                        <Box ref={inviteSectionRef}>
                          <CreateInviteSection
                            inviteFolderId={inviteFolderId}
                            inviteLoading={inviteLoading}
                            inviteUrl={inviteUrl}
                            mutedText={mutedText}
                            setInviteFolderId={setInviteFolderId}
                            onCreateInvite={() => createInvite()}
                          />
                        </Box>
                      )}

                      {operationsTab === "folder" && (
                        <Box>
                          <CreateFolderSection
                            folderId={folderId}
                            displayName={displayName}
                            mutedText={mutedText}
                            setFolderId={setFolderId}
                            setDisplayName={setDisplayName}
                            onCreateFolder={createFolder}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {showFolderAccessPanel && selectedFolder && (
                    <Box ref={accessSectionRef}>
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
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </MotionReveal>

          <MotionReveal delay={140}>
            <Box sx={{ mt: 3 }}>
              <Box
                sx={{
                  border: `1px solid ${subtleBorder}`,
                  borderRadius: 5,
                  p: { xs: 2.5, md: 3 },
                  background: cardBg,
                }}
              >
                <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
                  Global Admin
                </Typography>
                <Typography variant="h5" sx={{ mb: 0.75 }}>
                  Work across the full system
                </Typography>
                <Typography sx={{ mb: 2.5, color: mutedText, maxWidth: 760 }}>
                  These tools are not tied to the active folder. Use the directory for account detail updates and advanced for maintenance tasks.
                </Typography>

                <Tabs
                  value={globalTab}
                  onChange={handleGlobalTabChange}
                  variant="fullWidth"
                  sx={{
                    mb: 2.5,
                    "& .MuiTab-root": {
                      fontSize: "0.76rem",
                      py: 1.1,
                    },
                  }}
                >
                  <Tab label="User Directory" value="directory" />
                  <Tab label="Advanced" value="advanced" />
                </Tabs>

                {globalTab === "directory" && (
                  <Box ref={directorySectionRef}>
                    <UserDirectorySection
                      allUsers={allUsers}
                      allUsersLoading={allUsersLoading}
                      allUsersError={allUsersError}
                      selectedUser={selectedDirectoryUser}
                      givenName={directoryGivenName}
                      familyName={directoryFamilyName}
                      saveLoading={saveUserLoading}
                      saveMessage={saveUserMessage}
                      mutedText={mutedText}
                      subtleBorder={subtleBorder}
                      cardBg={cardBg}
                      onSelectedUserChange={setSelectedDirectoryUser}
                      onGivenNameChange={setDirectoryGivenName}
                      onFamilyNameChange={setDirectoryFamilyName}
                      onSave={saveDirectoryUser}
                    />
                  </Box>
                )}

                {globalTab === "advanced" && (
                  <AdvancedSection
                    subtleBorder={subtleBorder}
                    cardBg={cardBg}
                    mutedText={mutedText}
                    backfillLoading={backfillLoading}
                    backfillMessage={backfillMessage}
                    onBackfill={backfillFolderUsers}
                  />
                )}
              </Box>
            </Box>
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
