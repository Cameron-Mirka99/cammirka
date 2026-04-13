import { SyntheticEvent, useState } from "react";
import { Autocomplete, Box, Button, MenuItem, Tab, Tabs, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
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
  const [activeTab, setActiveTab] = useState<"members" | "banned" | "add-user">("members");

  const formatUserName = (userEntry: FolderUser) => {
    if (userEntry.fullName) return userEntry.fullName;
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

  const handleTabChange = (_event: SyntheticEvent, value: "members" | "banned" | "add-user") => {
    setActiveTab(value);
  };

  return (
    <Box
      sx={{
        position: { xl: "sticky" },
        top: { xl: 108 },
        border: `1px solid ${subtleBorder}`,
        borderRadius: 5,
        p: 2.5,
        background: cardBg,
        maxHeight: { xl: "calc(100vh - 132px)" },
        overflowY: { xl: "auto" },
      }}
    >
      <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
        Access
      </Typography>
      <Typography variant="h6" sx={{ mb: 0.75, fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
        Control who can enter {selectedFolder}
      </Typography>
      <Typography sx={{ mb: 2.5, color: mutedText }}>
        Review active members, add new access, and clear bans without leaving the selected folder context.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 1.25,
          mb: 3,
        }}
      >
        <Box sx={{ borderRadius: 3, px: 1.5, py: 1.25, backgroundColor: alpha("#191713", 0.04) }}>
          <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: mutedText }}>
            Members
          </Typography>
          <Typography sx={{ mt: 0.35, fontWeight: 700 }}>{folderUsers.length}</Typography>
        </Box>
        <Box sx={{ borderRadius: 3, px: 1.5, py: 1.25, backgroundColor: alpha("#191713", 0.04) }}>
          <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: mutedText }}>
            Banned
          </Typography>
          <Typography sx={{ mt: 0.35, fontWeight: 700 }}>{bannedUsers.length}</Typography>
        </Box>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          mb: 2.5,
          minHeight: 0,
          "& .MuiTab-root": {
            minHeight: 0,
            py: 1.1,
            fontSize: "0.76rem",
          },
        }}
      >
        <Tab label={`Members (${folderUsers.length})`} value="members" />
        <Tab label={`Banned (${bannedUsers.length})`} value="banned" />
        <Tab label="Add User" value="add-user" />
      </Tabs>

      {activeTab === "add-user" && (
        <Box>
          {allUsersError && <Box sx={{ color: mutedText, mb: 1.5 }}>{allUsersError}</Box>}
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Autocomplete
              options={searchableUsers}
              value={selectedAssignableUser}
              loading={allUsersLoading}
              onChange={(_, value) => onAssignableUserChange(value)}
              isOptionEqualToValue={(option, value) => option.username === value.username}
              getOptionLabel={(option) => formatUserName(option)}
              filterOptions={(options, state) => {
                const query = state.inputValue.trim().toLowerCase();
                if (!query) return options;
                return options.filter((option) => {
                  const haystack = [
                    option.email,
                    option.username,
                    option.name,
                    option.fullName,
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
                  label="Search user"
                  size="small"
                  helperText="Email, name, or username."
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.username}>
                  {formatUserName(option)} {option.email ? `- ${option.email}` : `(${option.username})`}
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
                Add user
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {activeTab === "members" && (
        <Box>
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
                    display: "grid",
                    gap: 1,
                    padding: 1.5,
                    borderRadius: 3,
                    background: (theme) => alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.03 : 0.06),
                    border: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                  }}
                >
                  <Typography sx={{ fontSize: "0.95rem", color: "text.primary", fontWeight: 700 }}>
                    {formatUserName(userEntry)}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: mutedText }}>
                    {userEntry.email ?? userEntry.username}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: mutedText }}>
                    Status: {userEntry.status ?? "UNKNOWN"} | {userEntry.enabled === false ? "Disabled" : "Enabled"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: mutedText }}>
                    Created: {formatDate(userEntry.createdAt)}
                  </Typography>
                  <Box>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => onRemoveUser(userEntry.username)}
                      disabled={userActionKey === userEntry.username}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {activeTab === "banned" && (
        <Box>
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
                    display: "grid",
                    gap: 1,
                    padding: 1.5,
                    borderRadius: 3,
                    background: (theme) => alpha(theme.palette.primary.main, 0.08),
                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                  }}
                >
                  <Typography sx={{ fontSize: "0.95rem", color: "text.primary", fontWeight: 700 }}>
                    {formatUserName(userEntry)}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: mutedText }}>
                    {userEntry.email ?? userEntry.username}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: mutedText }}>
                    Banned: {formatDate(userEntry.bannedAt)}
                  </Typography>
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
      )}
    </Box>
  );
}
