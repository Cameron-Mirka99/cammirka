import { Autocomplete, Box, Button, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { FolderUser } from "./types";

type UserDirectorySectionProps = {
  allUsers: FolderUser[];
  allUsersLoading: boolean;
  allUsersError: string | null;
  selectedUser: FolderUser | null;
  givenName: string;
  familyName: string;
  saveLoading: boolean;
  saveMessage: string | null;
  mutedText: string;
  subtleBorder: string;
  cardBg: string;
  onSelectedUserChange: (user: FolderUser | null) => void;
  onGivenNameChange: (value: string) => void;
  onFamilyNameChange: (value: string) => void;
  onSave: () => void;
};

export function UserDirectorySection({
  allUsers,
  allUsersLoading,
  allUsersError,
  selectedUser,
  givenName,
  familyName,
  saveLoading,
  saveMessage,
  mutedText,
  subtleBorder,
  cardBg,
  onSelectedUserChange,
  onGivenNameChange,
  onFamilyNameChange,
  onSave,
}: UserDirectorySectionProps) {
  const formatUserName = (userEntry: FolderUser) =>
    userEntry.fullName ||
    userEntry.name ||
    [userEntry.givenName, userEntry.familyName].filter(Boolean).join(" ") ||
    userEntry.email ||
    userEntry.username;

  const searchableUsers = allUsers
    .slice()
    .sort((a, b) => formatUserName(a).localeCompare(formatUserName(b), undefined, { sensitivity: "base" }));

  return (
    <Box
      sx={{
        border: `1px solid ${subtleBorder}`,
        borderRadius: 4,
        p: 2.5,
        background: cardBg,
      }}
    >
      <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
        User Directory
      </Typography>
      <Typography variant="h6" sx={{ mb: 0.75, fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
        View and update account details
      </Typography>
      <Typography sx={{ mb: 3, color: mutedText }}>
        Names can be edited here. Email is visible for reference but stays read-only.
      </Typography>

      {allUsersError && <Box sx={{ color: mutedText, mb: 2 }}>{allUsersError}</Box>}
      {saveMessage && (
        <Box
          sx={{
            mb: 2,
            px: 2,
            py: 1.5,
            borderRadius: 3,
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
            color: "text.primary",
          }}
        >
          {saveMessage}
        </Box>
      )}

      <Box sx={{ display: "grid", gap: 1.5 }}>
        <Autocomplete
          options={searchableUsers}
          value={selectedUser}
          loading={allUsersLoading}
          onChange={(_, value) => onSelectedUserChange(value)}
          isOptionEqualToValue={(option, value) => option.username === value.username}
          getOptionLabel={(option) => formatUserName(option)}
          filterOptions={(options, state) => {
            const query = state.inputValue.trim().toLowerCase();
            if (!query) return options;
            return options.filter((option) =>
              [
                option.email,
                option.username,
                option.name,
                option.fullName,
                option.givenName,
                option.familyName,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query),
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search user"
              size="small"
              helperText="Search by name, email, or username."
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.username}>
              {formatUserName(option)} {option.email ? `- ${option.email}` : `(${option.username})`}
            </li>
          )}
        />

        <TextField
          label="Email address"
          value={selectedUser?.email ?? ""}
          size="small"
          InputProps={{ readOnly: true }}
          disabled={!selectedUser}
        />
        <TextField
          label="Username"
          value={selectedUser?.username ?? ""}
          size="small"
          InputProps={{ readOnly: true }}
          disabled={!selectedUser}
        />
        <TextField
          label="First name"
          value={givenName}
          size="small"
          onChange={(event) => onGivenNameChange(event.target.value)}
          disabled={!selectedUser}
        />
        <TextField
          label="Last name"
          value={familyName}
          size="small"
          onChange={(event) => onFamilyNameChange(event.target.value)}
          disabled={!selectedUser}
        />

        <Box sx={{ color: mutedText, fontSize: "0.8rem" }}>
          Status: {selectedUser?.status ?? "Unknown"}
          {selectedUser ? ` | ${selectedUser.enabled === false ? "Disabled" : "Enabled"}` : ""}
        </Box>
        <Box sx={{ color: mutedText, fontSize: "0.8rem" }}>
          Folder attribute: {selectedUser?.folderId ?? "Not set"}
        </Box>

        <Box>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={saveLoading || !selectedUser}
          >
            {saveLoading ? "Saving..." : "Save user details"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
