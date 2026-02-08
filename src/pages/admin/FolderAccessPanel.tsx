import { Box, Button, Typography } from "@mui/material";
import { FolderUser } from "./types";

type FolderAccessPanelProps = {
  selectedFolder: string;
  folderUsers: FolderUser[];
  bannedUsers: FolderUser[];
  usersLoading: boolean;
  usersError: string | null;
  bannedLoading: boolean;
  bannedError: string | null;
  userActionKey: string | null;
  mutedText: string;
  subtleBorder: string;
  cardBg: string;
  onRemoveUser: (username: string) => void;
  onUnbanUser: (username: string) => void;
};

export function FolderAccessPanel({
  selectedFolder,
  folderUsers,
  bannedUsers,
  usersLoading,
  usersError,
  bannedLoading,
  bannedError,
  userActionKey,
  mutedText,
  subtleBorder,
  cardBg,
  onRemoveUser,
  onUnbanUser,
}: FolderAccessPanelProps) {
  const formatUserName = (userEntry: FolderUser) => {
    if (userEntry.name) return userEntry.name;
    const combined = [userEntry.givenName, userEntry.familyName].filter(Boolean).join(" ");
    if (combined) return combined;
    return userEntry.email ?? userEntry.username;
  };

  const formatDate = (value?: string) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return value;
    return date.toLocaleString();
  };

  return (
    <Box
      sx={{
        border: `1px solid ${subtleBorder}`,
        borderRadius: 2,
        p: 2,
        background: cardBg,
        maxHeight: { xl: "75vh" },
        overflowY: { xl: "auto" },
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Folder Access
      </Typography>
      <Typography sx={{ mb: 3, color: mutedText }}>
        Users and bans for <strong>{selectedFolder}</strong>.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Folder Users
        </Typography>
        {usersLoading ? (
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
                  flexDirection: "column",
                  gap: 1,
                  padding: 1.5,
                  borderRadius: 1,
                  background: "rgba(0, 217, 255, 0.05)",
                  border: "1px solid rgba(0, 217, 255, 0.2)",
                }}
              >
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
                <Box sx={{ fontSize: "0.75rem", color: mutedText }}>
                  Status: {userEntry.status ?? "UNKNOWN"} -{" "}
                  {userEntry.enabled === false ? "Disabled" : "Enabled"}
                </Box>
                <Box sx={{ fontSize: "0.75rem", color: mutedText }}>
                  Created: {formatDate(userEntry.createdAt)}
                </Box>
                <Box sx={{ fontSize: "0.75rem", color: mutedText }}>
                  Last updated: {formatDate(userEntry.lastModifiedAt)}
                </Box>
                <Box>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => onRemoveUser(userEntry.username)}
                    disabled={userActionKey === userEntry.username}
                  >
                    Remove from folder
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Banned Users
        </Typography>
        {bannedLoading ? (
          <Box sx={{ color: mutedText }}>Loading banned users...</Box>
        ) : bannedError ? (
          <Box sx={{ color: mutedText }}>{bannedError}</Box>
        ) : bannedUsers.length === 0 ? (
          <Box sx={{ color: mutedText }}>No banned users for this folder.</Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {bannedUsers.map((userEntry) => (
              <Box
                key={userEntry.username}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  padding: 1.5,
                  borderRadius: 1,
                  background: "rgba(255, 99, 71, 0.08)",
                  border: "1px solid rgba(255, 99, 71, 0.25)",
                }}
              >
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
                <Box sx={{ fontSize: "0.75rem", color: mutedText }}>
                  Banned: {formatDate(userEntry.bannedAt)}
                </Box>
                <Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onUnbanUser(userEntry.username)}
                    disabled={userActionKey === userEntry.username}
                  >
                    Remove ban
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
