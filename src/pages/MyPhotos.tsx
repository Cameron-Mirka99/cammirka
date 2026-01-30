import { Box, Button, Container, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(
    undefined,
  );
  const [folders, setFolders] = useState<Array<{ folderId: string; displayName?: string }>>(
    [],
  );

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

  const fetchPhotos = useCallback(
    async (excludeKeys: string[] = [], limit = 200) => {
      if (!photoApiBaseUrl) {
        throw new Error("REACT_APP_PHOTO_API_URL is not configured");
      }

      const body: Record<string, unknown> = { excludeKeys, limit };
      if (isAdmin && activeFolderId) {
        body.folderId = activeFolderId;
      }

      const res = await authFetch(`${photoApiBaseUrl}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch photos: ${res.status}`);
      }

      const data = await res.json();
      const incoming: Photo[] = Array.isArray(data.photos) ? data.photos : [];

      setPhotos((prev) => {
        const existingKeys = new Set(prev.map((p) => p.key));
        const filtered = incoming.filter((p) => !existingKeys.has(p.key));
        return [...prev, ...filtered];
      });
    },
    [activeFolderId, isAdmin],
  );

  useEffect(() => {
    if (status !== "signedIn") return;
    if (!user?.folderId && !isAdmin) {
      setLoading(false);
      return;
    }
    if (isAdmin && !activeFolderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setPhotos([]);
    fetchPhotos([], 200)
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch photos:", err);
      })
      .finally(() => setLoading(false));
  }, [status, user?.folderId, fetchPhotos, isAdmin, activeFolderId]);

  if (status === "loading") {
    return (
      <Container sx={{ mt: 16, color: "text.secondary" }}>
        <Typography>Loading your session...</Typography>
      </Container>
    );
  }

  if (status === "signedOut") {
    return (
      <>
        <Header />
        <Container sx={{ mt: 16, color: "text.secondary" }}>
          <Typography>Please sign in to view your photos.</Typography>
        </Container>
      </>
    );
  }

  if (!user?.folderId && !isAdmin) {
    return (
      <>
        <Header />
        <Container sx={{ mt: 16, color: "text.secondary" }}>
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
      <Container maxWidth="xl" sx={{ mt: { xs: 14, sm: 16, md: 18 } }}>
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Typography variant="h5" sx={{ color: "white" }}>
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

        {isAdmin ? (
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
              <Typography variant="h6" sx={{ mb: 2, color: "white" }}>
                Choose a folder
              </Typography>
              {folders.length === 0 ? (
                <Box sx={{ color: "rgba(255,255,255,0.6)" }}>No folders yet.</Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {folders.map((folder) => (
                    <Box
                      key={folder.folderId}
                      onClick={() => setActiveFolderId(folder.folderId)}
                      sx={{
                        padding: "6px 10px",
                        borderRadius: 1,
                        background:
                          activeFolderId === folder.folderId
                            ? "rgba(255, 179, 0, 0.2)"
                            : "rgba(255,255,255,0.06)",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        border:
                          activeFolderId === folder.folderId
                            ? "1px solid rgba(255, 179, 0, 0.5)"
                            : "1px solid transparent",
                      }}
                    >
                      {folder.displayName ?? folder.folderId}
                      <Box sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
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
                  photos={photos}
                  columnsCount={columnsCount}
                  loading={loading}
                />
              ) : (
                <Box sx={{ color: "rgba(255,255,255,0.7)", mt: 2 }}>
                  Select a folder to view its gallery.
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <MainImageDisplay
            photos={photos}
            columnsCount={columnsCount}
            loading={loading}
          />
        )}
      </Container>
    </>
  );
}
