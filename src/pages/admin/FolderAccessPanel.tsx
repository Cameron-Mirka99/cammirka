import { Autocomplete, Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { FolderSummary, FolderUser } from "./types";

type FolderAccessPanelProps = {
  selectedFolder: string;
  folderUsers: FolderUser[];
  bannedUsers: FolderUser[];
  usersLoading: boolean;
  usersError: string | null;
  allUsers: FolderUser[];
  allUsersLoading: boolean;
  allUsersError: string | null;
  folders: FolderSummary[];
  assignFolderId: string;
  selectedAssignableUser: FolderUser | null;
  bannedLoading: boolean;
  bannedError: string | null;
  userActionKey: string | null;
  addUserLoading: boolean;
  mutedText: string;
  subtleBorder: string;
  cardBg: string;
  onAssignFolderChange: (folderId: string) => void;
  onAssignableUserChange: (user: FolderUser | null) => void;
  onAddUserToFolder: () => void;
  onRemoveUser: (username: string) => void;
  onUnbanUser: (username: string) => void;
};

export function FolderAccessPanel({
  selectedFolder,
  folderUsers,
  bannedUsers,
  usersLoading,
  usersError,
  allUsers,
  allUsersLoading,
  allUsersError,
  folders,
  assignFolderId,
  selectedAssignableUser,
  bannedLoading,
  bannedError,
  userActionKey,
  addUserLoading,
  mutedText,
  subtleBorder,
  cardBg,
  onAssignFolderChange,
  onAssignableUserChange,
  onAddUserToFolder,
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

  const searchableUsers = allUsers
    .slice()
    .sort((a, b) =>
      (a.email ?? a.username).localeCompare(b.email ?? b.username, undefined, { sensitivity: "base" }),
    );

  const assignableFolders = folders.filter((folder) => folder.folderId !== "public");

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
          Add User To Folder
        </Typography>
        {allUsersError && <Box sx={{ color: mutedText, mb: 1 }}>{allUsersError}</Box>}
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Autocomplete
            options={searchableUsers}
            value={selectedAssignableUser}
            loading={allUsersLoading}
            onChange={(_, value) => onAssignableUserChange(value)}
            isOptionEqualToValue={(option, value) => option.username === value.username}
            getOptionLabel={(option) => option.email ?? option.username}
            filterOptions={(options, state) => {
              const query = state.inputValue.trim().toLowerCase();
              if (!query) return options;
              return options.filter((option) => {
                const haystack = [
                  option.email,
                  option.username,
                  option.name,
                  option.givenName,
                  option.familyName,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();
                return haystack.includes(query);
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search user by email"
                size="small"
                helperText="Type email, name, or username."
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.username}>
                {option.email ?? option.username} ({option.username})
              </li>
            )}
          />

          <TextField
            select
            size="small"
            label="Destination folder"
            value={assignFolderId}
            onChange={(event) => onAssignFolderChange(event.target.value)}
          >
            {assignableFolders.map((folder) => (
              <MenuItem key={folder.folderId} value={folder.folderId}>
                {folder.displayName ?? folder.folderId}
              </MenuItem>
            ))}
          </TextField>

          <Box>
            <Button
              size="small"
              variant="contained"
              onClick={onAddUserToFolder}
              disabled={addUserLoading || !selectedAssignableUser || !assignFolderId}
            >
              Add user to folder
            </Button>
          </Box>
        </Box>
      </Box>

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
