import { Box, Button, Container, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
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
  const [adminFolderId, setAdminFolderId] = useState("");
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(
    undefined,
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

  useEffect(() => {
    if (!isAdmin) {
      setActiveFolderId(undefined);
      return;
    }
    if (adminFolderId.trim().length === 0) {
      setActiveFolderId(undefined);
      return;
    }
    setActiveFolderId(adminFolderId.trim());
  }, [adminFolderId, isAdmin]);

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
      <Container sx={{ mt: 16, color: "text.secondary" }}>
        <Typography>Please sign in to view your photos.</Typography>
      </Container>
    );
  }

  if (!user?.folderId && !isAdmin) {
    return (
      <Container sx={{ mt: 16, color: "text.secondary" }}>
        <Typography>
          Your account is not yet linked to a folder. Make sure you signed up
          with a valid invite link.
        </Typography>
      </Container>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="xl" sx={{ mt: { xs: 10, sm: 12, md: 14 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ color: "white", mb: 2 }}>
            My Photos
          </Typography>

        {isAdmin && (
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="View folder as admin"
              size="small"
              value={adminFolderId}
              onChange={(event) => setAdminFolderId(event.target.value)}
              sx={{ minWidth: 280 }}
              InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
              InputProps={{ sx: { color: "white" } }}
            />
            <Button
              variant="outlined"
              onClick={() => setAdminFolderId("")}
              sx={{ borderColor: "rgba(255,255,255,0.2)", color: "white" }}
            >
              View my folder
            </Button>
          </Box>
        )}
      </Box>

        <MainImageDisplay
          photos={photos}
          columnsCount={columnsCount}
          loading={loading}
        />
      </Container>
    </>
  );
}
