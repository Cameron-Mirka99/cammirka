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
        borderRadius: 5,
        p: 2.5,
        background: cardBg,
      }}
    >
      <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
        Directory
      </Typography>
      <Typography variant="h6" sx={{ mb: 0.75, fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
        Review and edit account details
      </Typography>
      <Typography sx={{ mb: 3, color: mutedText }}>
        Search the global user directory, confirm identity details, and update names without changing email or username fields.
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

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(280px, 360px) minmax(0, 1fr)" }, gap: 2.5 }}>
        <Box>
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

          <Box
            sx={{
              mt: 2,
              px: 1.75,
              py: 1.5,
              borderRadius: 3,
              backgroundColor: alpha("#191713", 0.04),
            }}
          >
            <Typography sx={{ fontSize: "0.75rem", color: mutedText, textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Current selection
            </Typography>
            <Typography sx={{ mt: 0.5, fontWeight: 700 }}>
              {selectedUser ? formatUserName(selectedUser) : "No user selected"}
            </Typography>
            <Typography sx={{ mt: 0.35, color: mutedText, fontSize: "0.82rem" }}>
              {selectedUser ? `${selectedUser.status ?? "Unknown"} | ${selectedUser.enabled === false ? "Disabled" : "Enabled"}` : "Choose a user to edit details."}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
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
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
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
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
            <Box
              sx={{
                px: 1.75,
                py: 1.4,
                borderRadius: 3,
                backgroundColor: alpha("#191713", 0.04),
                color: mutedText,
                fontSize: "0.85rem",
              }}
            >
              Status: {selectedUser?.status ?? "Unknown"}
            </Box>
            <Box
              sx={{
                px: 1.75,
                py: 1.4,
                borderRadius: 3,
                backgroundColor: alpha("#191713", 0.04),
                color: mutedText,
                fontSize: "0.85rem",
              }}
            >
              Folder attribute: {selectedUser?.folderId ?? "Not set"}
            </Box>
          </Box>

          <Box>
            <Button variant="contained" onClick={onSave} disabled={saveLoading || !selectedUser}>
              {saveLoading ? "Saving..." : "Save user details"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
