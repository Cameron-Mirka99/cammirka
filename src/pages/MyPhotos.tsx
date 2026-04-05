import { Box, Button, Container, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { MainImageDisplay } from "../components/MainImageDisplay";
import { Header } from "../components/Header";
import { useAuth } from "../auth/AuthProvider";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { authFetch } from "../utils/authFetch";
import { Photo } from "../types/photo";
import { MotionReveal, motionHoverLift } from "../utils/motion";

export default function MyPhotos() {
  const { user, status } = useAuth();
  const theme = useTheme();
  const mutedText = theme.palette.text.secondary;
  const panelBorder = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.08 : 0.16);
  const panelBg = alpha(theme.palette.background.paper, theme.palette.mode === "light" ? 0.82 : 0.78);
  const itemBg = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.045 : 0.08);
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

  const isAdmin = useMemo(
    () => Boolean(user?.groups.includes("admin")),
    [user?.groups],
  );
  const privateGalleryLabel = useMemo(() => {
    const fullName = [user?.givenName, user?.familyName].filter(Boolean).join(" ").trim();
    if (fullName) {
      return `${fullName}'s Private Gallery`;
    }
    return "Private Gallery";
  }, [user?.familyName, user?.givenName]);

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
  }, [isAdmin]);

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
  }, [status, user?.folderId, fetchPhotos, isAdmin, activeFolderId, folders, userFolders, userFoldersLoading]);

  useEffect(
    () => () => {
      photosAbortRef.current?.abort();
    },
    [],
  );

  if (status === "loading") {
    return (
      <Container sx={{ color: "text.secondary", px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 6, md: 8 } }}>
        <Typography>Loading your session...</Typography>
      </Container>
    );
  }

  if (status === "signedOut") {
    return (
      <>
        <Header />
        <Container sx={{ color: "text.secondary", px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 6, md: 8 } }}>
          <Typography>Please sign in to view your photos.</Typography>
        </Container>
      </>
    );
  }

  if (!isAdmin && userFolders.length === 0 && !userFoldersLoading) {
    return (
      <>
        <Header />
        <Container sx={{ color: "text.secondary", px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 6, md: 8 } }}>
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
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 3, md: 5 } }}>
        <MotionReveal
          sx={{
            mb: { xs: 3, md: 4 },
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "end",
            borderBottom: `1px solid ${panelBorder}`,
            pb: { xs: 2.5, md: 3 },
          }}
        >
          <Box sx={{ maxWidth: 620 }}>
            <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
              {privateGalleryLabel}
            </Typography>
            <Typography variant="h4" sx={{ color: "text.primary", fontSize: { xs: "2rem", md: "2.8rem" }, mb: 1 }}>
              My Photos
            </Typography>
            <Typography sx={{ color: mutedText }}>
              Access the folders assigned to your account and browse your archive without leaving the workspace.
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to="/"
            variant="text"
            sx={{
              px: 0,
              alignSelf: "flex-end",
            }}
          >
            Return to public archive
          </Button>
        </MotionReveal>

        {isAdmin || userFolders.length > 1 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "300px minmax(0, 1fr)" },
              gap: { xs: 3, md: 4 },
            }}
          >
            <MotionReveal
              sx={{
                border: `1px solid ${panelBorder}`,
                borderRadius: 4,
                padding: { xs: 2, md: 2.5 },
                background: panelBg,
                maxHeight: "75vh",
                overflowY: "auto",
                boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, theme.palette.mode === "light" ? 0.04 : 0.18)}`,
              }}
            >
              <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
                Available Folders
              </Typography>
              <Typography variant="h6" sx={{ mb: 0.75, color: "text.primary", fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
                Select a workspace
              </Typography>
              <Typography sx={{ mb: 2.5, color: mutedText, fontSize: "0.92rem" }}>
                Choose a folder to load its private gallery.
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
                        padding: "12px 14px",
                        borderRadius: 3,
                        background:
                          activeFolderId === folder.folderId
                            ? alpha(theme.palette.primary.main, 0.12)
                            : itemBg,
                        cursor: "pointer",
                        border:
                          activeFolderId === folder.folderId
                            ? `1px solid ${alpha(theme.palette.primary.main, 0.32)}`
                            : `1px solid ${alpha(theme.palette.text.primary, 0.05)}`,
                        ...motionHoverLift,
                        "&:hover": {
                          transform: "translateX(6px)",
                        },
                      }}
                    >
                      <Box sx={{ fontSize: "0.95rem", color: "text.primary" }}>
                        {folder.displayName ?? folder.folderId}
                      </Box>
                      <Box sx={{ fontSize: "0.74rem", color: mutedText, mt: 0.3, letterSpacing: "0.04em" }}>
                        {folder.folderId}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </MotionReveal>

            <MotionReveal delay={120}>
              <Box>
              {activeFolderId ? (
                <MainImageDisplay key={activeFolderId} photos={photos} loading={loading} variant="private" />
              ) : (
                <Box sx={{ color: mutedText, mt: 2 }}>
                  Select a folder to view its gallery.
                </Box>
              )}
              </Box>
            </MotionReveal>
          </Box>
        ) : (
          <>
            {activeFolderId ? (
              <MainImageDisplay key={activeFolderId} photos={photos} loading={loading} variant="private" />
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
