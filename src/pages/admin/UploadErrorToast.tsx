import { Alert, Snackbar } from "@mui/material";

type UploadErrorToastProps = {
  message: string | null;
  onClose: () => void;
};

export function UploadErrorToast({ message, onClose }: UploadErrorToastProps) {
  return (
    <Snackbar
      open={Boolean(message)}
      autoHideDuration={5000}
      onClose={(_, reason) => {
        if (reason === "clickaway") return;
        onClose();
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert onClose={onClose} severity="error" variant="filled" sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
