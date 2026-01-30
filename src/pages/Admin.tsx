import { Box, Button, Container, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { Header } from "../components/Header";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { authFetch } from "../utils/authFetch";

export default function Admin() {
  const { user } = useAuth();
  const [folderId, setFolderId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteFolderId, setInviteFolderId] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [moveSourceKey, setMoveSourceKey] = useState("");
  const [moveDestination, setMoveDestination] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<Array<{ folderId: string; displayName?: string }>>(
    [],
  );

  const isAdmin = Boolean(user?.groups.includes("admin"));

  const apiBase = photoApiBaseUrl;

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

  const createInvite = async () => {
    setStatusMessage(null);
    if (!apiBase) {
      setStatusMessage("REACT_APP_PHOTO_API_URL is not configured.");
      return;
    }
    const res = await authFetch(`${apiBase}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: inviteFolderId }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setStatusMessage(payload?.message ?? "Failed to create invite.");
      return;
    }
    const inviteCode = payload.inviteCode;
    const url = `${window.location.origin}/login?invite=${inviteCode}`;
    setInviteUrl(url);
    setStatusMessage(`Invite created for ${payload.folderId}`);
    setInviteFolderId("");
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

  const movePhoto = async () => {
    setStatusMessage(null);
    if (!apiBase) {
      setStatusMessage("REACT_APP_PHOTO_API_URL is not configured.");
      return;
    }
    const res = await authFetch(`${apiBase}/move-photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceKey: moveSourceKey,
        destinationFolderId: moveDestination,
      }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setStatusMessage(payload?.message ?? "Move failed.");
      return;
    }
    setStatusMessage(`Moved to ${payload.destinationKey}`);
    setMoveSourceKey("");
    setMoveDestination("");
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

  return (
    <>
      <Header />
      {isAdmin ? (
        <Container
          maxWidth="lg"
          sx={{ mt: { xs: 12, sm: 14, md: 16 }, color: "white" }}
        >
          <Typography variant="h4" sx={{ mb: 4 }}>
            Admin
          </Typography>

          {statusMessage && (
            <Box sx={{ mb: 3, color: "rgba(255,255,255,0.7)" }}>
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
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 2,
                padding: 2,
                background: "rgba(0,0,0,0.2)",
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Folders
              </Typography>
              {folders.length === 0 ? (
                <Box sx={{ color: "rgba(255,255,255,0.6)" }}>
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
                        setMoveDestination(folder.folderId);
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
                            : "rgba(255,255,255,0.06)",
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
                          <Box sx={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.9)" }}>
                            {folder.displayName ?? folder.folderId}
                          </Box>
                          <Box
                            sx={{
                              fontSize: "0.75rem",
                              color: "rgba(255,255,255,0.6)",
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
                              color: "rgba(255,255,255,0.7)",
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
                Create Folder
              </Typography>
              <Typography sx={{ mb: 2, color: "rgba(255,255,255,0.6)" }}>
                Example: folder ID <strong>client-jones</strong>, display name{" "}
                <strong>Jones Family</strong>
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    label="Folder ID"
                    value={folderId}
                    onChange={(event) => setFolderId(event.target.value)}
                    sx={{ minWidth: 240 }}
                    InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                    InputProps={{ sx: { color: "white" } }}
                  />
                  <TextField
                    label="Display name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    sx={{ minWidth: 240 }}
                    InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                    InputProps={{ sx: { color: "white" } }}
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
              <Typography sx={{ mb: 2, color: "rgba(255,255,255,0.6)" }}>
                Example: create an invite for <strong>client-jones</strong>
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    label="Folder ID"
                    value={inviteFolderId}
                    onChange={(event) => setInviteFolderId(event.target.value)}
                    sx={{ minWidth: 240 }}
                    InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                    InputProps={{ sx: { color: "white" } }}
                  />
                  <Button variant="contained" onClick={createInvite}>
                    Create Invite
                  </Button>
                </Box>
                {inviteUrl && (
                  <Box sx={{ mt: 2, color: "rgba(255,255,255,0.7)" }}>
                    Invite URL: {inviteUrl}
                  </Box>
                )}
              </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Upload Photo (Admin Only)
              </Typography>
              <Typography sx={{ mb: 2, color: "rgba(255,255,255,0.6)" }}>
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
                    InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                    InputProps={{ sx: { color: "white" } }}
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
                  <Box sx={{ mt: 1, color: "rgba(255,255,255,0.7)" }}>
                    Selected: {uploadFile.name}
                  </Box>
                )}
              </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Move Photo
              </Typography>
              <Typography sx={{ mb: 2, color: "rgba(255,255,255,0.6)" }}>
                Example: move <strong>client-jones/IMG_1234.jpg</strong> to{" "}
                <strong>client-smith</strong>
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    label="Source key"
                    value={moveSourceKey}
                    onChange={(event) => setMoveSourceKey(event.target.value)}
                    sx={{ minWidth: 280 }}
                    InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                    InputProps={{ sx: { color: "white" } }}
                  />
                  <TextField
                    label="Destination folder"
                    value={moveDestination}
                    onChange={(event) => setMoveDestination(event.target.value)}
                    sx={{ minWidth: 240 }}
                    InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                    InputProps={{ sx: { color: "white" } }}
                  />
                  <Button variant="contained" onClick={movePhoto}>
                    Move
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      ) : (
        <Container sx={{ mt: { xs: 12, sm: 14, md: 16 }, color: "text.secondary" }}>
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
