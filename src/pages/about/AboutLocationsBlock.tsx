import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import { Box, Container, Divider, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MotionParallax, MotionReveal, motionHoverLift } from "../../utils/motion";

type LocationItem = {
  name: string;
  query: string;
};

type AboutLocationsBlockProps = {
  locations: Array<LocationItem>;
  mapsSearchUrl: (query: string) => string;
};

export function AboutLocationsBlock({ locations, mapsSearchUrl }: AboutLocationsBlockProps) {
  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 7, md: 10 }, width: "100%" }}>
      <Box sx={{ maxWidth: 1040, mx: "auto", width: "100%" }}>
        <Divider sx={{ my: { xs: 6, md: 8 }, borderColor: alpha("#B88A2A", 0.16) }} />
        <MotionParallax offset={62}>
          <MotionReveal
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "0.78fr 1.22fr" },
              gap: { xs: 4, md: 6 },
              alignItems: "start",
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1.5 }}>
                Field Grounds
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: "clamp(2.1rem, 9vw, 3rem)", md: "clamp(3rem, 5vw, 3.9rem)" }, mb: 2 }}>
                The places I come back to most.
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 420 }}>
                These spots shape a lot of the work on this site. Going back again and again is how patterns start to
                show up.
              </Typography>
            </Box>

            <Box>
              {locations.map((location, index) => (
                <Box
                  key={location.name}
                  component="a"
                  href={mapsSearchUrl(location.query)}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 2,
                    alignItems: "center",
                    py: 2.2,
                    textDecoration: "none",
                    borderTop: index === 0 ? (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.1)}` : "none",
                    borderBottom: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                    color: "text.primary",
                    ...motionHoverLift,
                    "&:hover": {
                      color: "primary.main",
                      transform: "translateX(6px)",
                    },
                  }}
                >
                  <LocationOnOutlinedIcon sx={{ color: "primary.main", fontSize: "1.1rem" }} />
                  <Typography variant="body1">{location.name}</Typography>
                  <NorthEastIcon sx={{ fontSize: "1rem" }} />
                </Box>
              ))}
            </Box>
          </MotionReveal>
        </MotionParallax>
      </Box>
    </Container>
  );
}
