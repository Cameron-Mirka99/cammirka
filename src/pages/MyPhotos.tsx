import { Box, Button, Container, Typography, useMediaQuery, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MainImageDisplay } from "../components/MainImageDisplay";
import { Header } from "../components/Header";
import { useAuth } from "../auth/AuthProvider";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { authFetch } from "../utils/authFetch";
import { Photo } from "../types/photo";

export default function MyPhotos() {
  const { user, status } = useAuth();
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isMd = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));
  const mutedText = theme.palette.text.secondary;
  const panelBorder = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.12 : 0.2);
  const panelBg = alpha(theme.palette.common.black, theme.palette.mode === "light" ? 0.04 : 0.2);
  const itemBg = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.06 : 0.08);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(
    undefined,
  );
  const [folders, setFolders] = useState<Array<{ folderId: string; displayName?: string }>>(
    [],
  );
  const [userFolders, setUserFolders] = useState<Array<{ folderId: string; displayName?: string }>>(
    [],
  );
  const [userFoldersLoading, setUserFoldersLoading] = useState(false);
  const photosRequestSeq = useRef(0);
  const photosAbortRef = useRef<AbortController | null>(null);
  const activeFolderRef = useRef<string | undefined>(undefined);

  let columnsCount = 1;
  if (isLg) {
    columnsCount = 3;
  } else if (isMd || isSm) {
    columnsCount = 2;
  }

  const isAdmin = useMemo(
    () => Boolean(user?.groups.includes("admin")),
    [user?.groups],
  );

  const setActiveFolder = useCallback((folderId: string | undefined) => {
    activeFolderRef.current = folderId;
    setActiveFolderId(folderId);
  }, []);

  const loadFolders = useCallback(async () => {
    if (!photoApiBaseUrl || !isAdmin) return;
    const res = await authFetch(`${photoApiBaseUrl}/folders`, {
      method: "GET",
    });
    if (!res.ok) return;
    const payload = await res.json();
    const items = Array.isArray(payload.folders) ? payload.folders : [];
    setFolders(items);
  }, [isAdmin, photoApiBaseUrl]);

  useEffect(() => {
    if (isAdmin) {
      loadFolders().catch(() => undefined);
    }
  }, [isAdmin, loadFolders]);

  const loadUserFolders = useCallback(async () => {
    if (!photoApiBaseUrl || isAdmin) return;
    setUserFoldersLoading(true);
    try {
      const res = await authFetch(`${photoApiBaseUrl}/user-folders`, {
        method: "GET",
      });
      if (!res.ok) return;
      const payload = await res.json();
      const items = Array.isArray(payload.folders) ? payload.folders : [];
      setUserFolders(items);
    } finally {
      setUserFoldersLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin && status === "signedIn") {
      loadUserFolders().catch(() => undefined);
    }
  }, [isAdmin, status, loadUserFolders]);

  useEffect(() => {
    const selectable = isAdmin ? folders : userFolders;
    if (selectable.length === 0) return;
    if (activeFolderId && selectable.some((folder) => folder.folderId === activeFolderId)) {
      return;
    }
    setActiveFolder(selectable[0].folderId);
  }, [isAdmin, folders, userFolders, activeFolderId, setActiveFolder]);

  useEffect(() => {
    activeFolderRef.current = activeFolderId;
  }, [activeFolderId]);

  const fetchPhotos = useCallback(
    async (excludeKeys: string[] = [], limit = 200) => {
      if (!photoApiBaseUrl) {
        throw new Error("REACT_APP_PHOTO_API_URL is not configured");
      }

      const requestedFolderId = activeFolderId;
      const requestSeq = ++photosRequestSeq.current;
      photosAbortRef.current?.abort();
      const controller = new AbortController();
      photosAbortRef.current = controller;
      const body: Record<string, unknown> = { excludeKeys, limit };
      if (requestedFolderId) {
        body.folderId = requestedFolderId;
      }

      const res = await authFetch(`${photoApiBaseUrl}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch photos: ${res.status}`);
      }

      const data = await res.json();
      const incoming: Photo[] = Array.isArray(data.photos) ? data.photos : [];
      const folderPrefix = requestedFolderId
        ? `${requestedFolderId.replace(/^\/+|\/+$/g, "")}/`
        : null;
      const folderScoped = folderPrefix
        ? incoming.filter(
            (photo) =>
              photo?.key?.startsWith(folderPrefix) &&
              !photo.key.slice(folderPrefix.length).includes("/"),
          )
        : incoming;
      const dedupedIncoming = Array.from(
        new Map(folderScoped.map((photo) => [photo.key, photo])).values(),
      );
      if (requestSeq !== photosRequestSeq.current) return;
      if (activeFolderRef.current !== requestedFolderId) return;

      setPhotos((prev) => {
        if (excludeKeys.length === 0) {
          return dedupedIncoming;
        }
        const existingKeys = new Set(prev.map((p) => p.key));
        const filtered = dedupedIncoming.filter((p) => !existingKeys.has(p.key));
        return [...prev, ...filtered];
      });
    },
    [activeFolderId],
  );

  useEffect(() => {
    if (status !== "signedIn") return;
    const selectable = isAdmin ? folders : userFolders;
    if (!isAdmin && selectable.length === 0 && !userFoldersLoading) {
      setLoading(false);
      return;
    }
    if (!activeFolderId) {
      photosRequestSeq.current += 1;
      photosAbortRef.current?.abort();
      photosAbortRef.current = null;
      setPhotos([]);
      setLoading(false);
      return;
    }

    photosRequestSeq.current += 1;
    setLoading(true);
    setPhotos([]);
    fetchPhotos([], 200)
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        // eslint-disable-next-line no-console
        console.error("Failed to fetch photos:", err);
      })
      .finally(() => setLoading(false));
  }, [status, user?.folderId, fetchPhotos, isAdmin, activeFolderId]);

  useEffect(
    () => () => {
      photosAbortRef.current?.abort();
    },
    [],
  );

  if (status === "loading") {
    return (
      <Container sx={{ color: "text.secondary" }}>
        <Typography>Loading your session...</Typography>
      </Container>
    );
  }

  if (status === "signedOut") {
    return (
      <>
        <Header />
        <Container sx={{ color: "text.secondary" }}>
          <Typography>Please sign in to view your photos.</Typography>
        </Container>
      </>
    );
  }

  if (!isAdmin && userFolders.length === 0 && !userFoldersLoading) {
    return (
      <>
        <Header />
        <Container sx={{ color: "text.secondary" }}>
          <Typography>
            Your account is not yet linked to a folder. Make sure you signed up
            with a valid invite link.
          </Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Typography variant="h5" sx={{ color: "text.primary" }}>
            My Photos
          </Typography>
          <Button
            variant="outlined"
            href="/"
            sx={{
              fontSize: { xs: "clamp(0.9rem, 3vw, 1.3rem)", sm: "clamp(0.95rem, 3vw, 1.3rem)", md: "clamp(1rem, 3vw, 1.3rem)" },
              padding: { xs: "8px 16px", sm: "10px 24px", md: "12px 32px" },
              textTransform: "uppercase",
              fontWeight: 600,
              letterSpacing: "0.5px",
              position: "relative",
              border: "none",
              background: "rgba(255, 179, 0, 0.1)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              borderRadius: "4px",
              "&::before": {
                content: '""',
                position: "absolute",
                top: "0",
                left: "-100%",
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, rgba(255, 179, 0, 0.2) 0%, transparent 100%)",
                transition: "left 0.3s ease",
              },
              "&:hover": {
                backgroundColor: "rgba(255, 179, 0, 0.2)",
                boxShadow: "0 8px 24px rgba(255, 179, 0, 0.15)",
                transform: "translateY(-2px)",
                "&::before": {
                  left: "100%",
                },
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            Back to Home
          </Button>
        </Box>

        {isAdmin || userFolders.length > 1 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
              gap: 4,
            }}
          >
            <Box
              sx={{
                border: `1px solid ${panelBorder}`,
                borderRadius: 2,
                padding: 2,
                background: panelBg,
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
                Choose a folder
              </Typography>
              {(isAdmin ? folders : userFolders).length === 0 ? (
                <Box sx={{ color: mutedText }}>No folders yet.</Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {(isAdmin ? folders : userFolders).map((folder) => (
                    <Box
                      key={folder.folderId}
                      onClick={() => setActiveFolder(folder.folderId)}
                      sx={{
                        padding: "6px 10px",
                        borderRadius: 1,
                        background:
                          activeFolderId === folder.folderId
                            ? "rgba(255, 179, 0, 0.2)"
                            : itemBg,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        border:
                          activeFolderId === folder.folderId
                            ? "1px solid rgba(255, 179, 0, 0.5)"
                            : "1px solid transparent",
                      }}
                    >
                      {folder.displayName ?? folder.folderId}
                      <Box sx={{ fontSize: "0.75rem", color: mutedText }}>
                        {folder.folderId}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Box>
              {activeFolderId ? (
                <MainImageDisplay
                  key={activeFolderId}
                  photos={photos}
                  columnsCount={columnsCount}
                  loading={loading}
                />
              ) : (
                <Box sx={{ color: mutedText, mt: 2 }}>
                  Select a folder to view its gallery.
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <>
            {activeFolderId ? (
              <MainImageDisplay
                key={activeFolderId}
                photos={photos}
                columnsCount={columnsCount}
                loading={loading}
              />
            ) : (
              <Box sx={{ color: mutedText, mt: 2 }}>
                Select a folder to view its gallery.
              </Box>
            )}
          </>
        )}
      </Container>
    </>
  );
}
