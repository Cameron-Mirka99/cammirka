import { Box, Button, Container, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { MotionReveal } from "../../utils/motion";

export function AboutNextBlock() {
  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 7, md: 10 }, width: "100%" }}>
      <Box sx={{ maxWidth: 1040, mx: "auto", width: "100%" }}>
        <Divider sx={{ my: { xs: 6, md: 8 }, borderColor: alpha("#B88A2A", 0.16) }} />
        <MotionReveal sx={{ maxWidth: 760 }}>
          <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1.5 }}>
            Next
          </Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: "clamp(2.1rem, 9vw, 3rem)", md: "clamp(3rem, 5vw, 3.9rem)" }, mb: 2 }}>
            The archive is still growing, a little at a time.
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 620 }}>
            New mornings, repeated routes, and small seasonal shifts keep changing the work. The best way to get a
            feel for it is still to spend some time with the photos themselves.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
            <Button component={RouterLink} to="/" variant="contained" color="primary" sx={{ color: "#0F0F0C", alignSelf: "flex-start" }}>
              View the Archive
            </Button>
            <Button component={RouterLink} to="/login" variant="text" color="inherit" sx={{ px: 0, alignSelf: "flex-start" }}>
              Private gallery access
            </Button>
          </Stack>
        </MotionReveal>
      </Box>
    </Container>
  );
}
