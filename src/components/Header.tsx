import React from "react";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useScrollTrigger,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useThemeMode } from "../themeMode";
import { motionHoverLift } from "../utils/motion";

export const Header = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { mode, setMode } = useThemeMode();
  const { status, user, signOut } = useAuth();
  const isSignedIn = status === "signedIn";
  const isAdmin = Boolean(user?.groups.includes("admin"));
  const isHome = location.pathname === "/";
  const isArchive = location.pathname === "/archive";
  const isPrivateSurface = location.pathname === "/my-photos" || location.pathname === "/admin" || location.pathname === "/login";
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 36 });
  const overlayMode = isHome && !scrolled;
  const navItems = isPrivateSurface
    ? [{ label: "Home", to: "/" }, { label: "Archive", to: "/archive" }, { label: "About", to: "/about" }]
    : [{ label: "Home", to: "/" }, { label: "Archive", to: "/archive" }, { label: "About", to: "/about" }];
  const [accountMenuPosition, setAccountMenuPosition] = React.useState<{ top: number; left: number } | null>(null);
  const [navAnchor, setNavAnchor] = React.useState<null | HTMLElement>(null);
  const accountOpen = Boolean(accountMenuPosition);
  const navOpen = Boolean(navAnchor);
  const headerHeight = { xs: 88, md: 96 };

  const navColor = overlayMode ? "#F7F1E3" : theme.palette.text.primary;
  const mutedColor = overlayMode ? alpha("#F7F1E3", 0.72) : theme.palette.text.secondary;
  const appBarBackground = overlayMode
    ? "transparent"
    : alpha(theme.palette.background.default, theme.palette.mode === "light" ? 0.94 : 0.92);
  const appBarBorder = overlayMode
    ? "transparent"
    : alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.06 : 0.12);

  const accountButtonLabel = isSignedIn ? "Account" : "Access";

  const openAccountMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setAccountMenuPosition({ top: rect.bottom + 8, left: rect.right });
  };

  const closeAccountMenu = () => setAccountMenuPosition(null);
  const closeNavMenu = () => setNavAnchor(null);

  return (
    <>
      <AppBar
        position="fixed"
        color="transparent"
        sx={{
          backgroundColor: appBarBackground,
          borderBottom: `1px solid ${appBarBorder}`,
          backdropFilter: overlayMode ? "none" : "blur(18px)",
          transition: "background-color 280ms ease, border-color 280ms ease, backdrop-filter 280ms ease",
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 } }}>
          <Toolbar disableGutters sx={{ minHeight: headerHeight, display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Box
              component={Link}
              to="/"
              sx={{
                display: "inline-flex",
                flexDirection: "column",
                gap: 0.25,
                textDecoration: "none",
                color: navColor,
                ...motionHoverLift,
                "&:hover": {
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: "2rem", sm: "2.3rem", md: "2.5rem" },
                  lineHeight: 0.9,
                }}
              >
                Cameron Mirka
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: mutedColor,
                }}
              >
                Wildlife Photography
              </Typography>
            </Box>

            {isMobile ? (
              <>
                <IconButton
                  onClick={(event) => setNavAnchor(event.currentTarget)}
                  aria-label="Open navigation"
                  sx={{
                    color: navColor,
                    border: `1px solid ${overlayMode ? alpha("#F7F1E3", 0.18) : alpha(theme.palette.text.primary, 0.12)}`,
                    backgroundColor: overlayMode ? alpha("#0F0F0C", 0.18) : alpha(theme.palette.background.paper, 0.5),
                    ...motionHoverLift,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      backgroundColor: overlayMode ? alpha("#0F0F0C", 0.28) : alpha(theme.palette.background.paper, 0.92),
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={navAnchor}
                  open={navOpen}
                  onClose={closeNavMenu}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 220,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                      backgroundColor: alpha(theme.palette.background.paper, 0.98),
                    },
                  }}
                >
                  {navItems.map((item) => (
                    <MenuItem key={item.to} component={Link} to={item.to} onClick={closeNavMenu}>
                      {item.label}
                    </MenuItem>
                  ))}
                  {isSignedIn && (
                    <MenuItem component={Link} to="/my-photos" onClick={closeNavMenu}>
                      My Photos
                    </MenuItem>
                  )}
                  {isAdmin && (
                    <MenuItem component={Link} to="/admin" onClick={closeNavMenu}>
                      Admin
                    </MenuItem>
                  )}
                  <Divider />
                  {!isSignedIn ? (
                    <MenuItem component={Link} to="/login" onClick={closeNavMenu}>
                      Private Access
                    </MenuItem>
                  ) : (
                    <MenuItem
                      onClick={() => {
                        signOut();
                        closeNavMenu();
                      }}
                    >
                      Sign Out
                    </MenuItem>
                  )}
                </Menu>
              </>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: { md: 2.5, lg: 3 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: { md: 2, lg: 2.5 } }}>
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.to || (item.to === "/archive" && isArchive);
                    return (
                      <Button
                        key={item.to}
                        color="inherit"
                        component={Link}
                        to={item.to}
                        sx={{
                          px: 0,
                          minWidth: "auto",
                        color: isActive ? theme.palette.primary.main : navColor,
                        fontSize: "0.82rem",
                        position: "relative",
                        ...motionHoverLift,
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: -6,
                          height: 1.5,
                          backgroundColor: theme.palette.primary.main,
                          transform: isActive ? "scaleX(1)" : "scaleX(0)",
                          transformOrigin: "left center",
                          transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                        },
                        "&:hover": {
                          color: theme.palette.primary.main,
                          transform: "translateY(-2px)",
                        },
                        "&:hover::after": {
                          transform: "scaleX(1)",
                        },
                      }}
                    >
                        {item.label}
                      </Button>
                    );
                  })}
                  {!isSignedIn ? (
                    <Button
                      color="inherit"
                      component={Link}
                      to="/login"
                      sx={{
                        px: 0,
                        minWidth: "auto",
                        color: navColor,
                        fontSize: "0.82rem",
                        position: "relative",
                        ...motionHoverLift,
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: -6,
                          height: 1.5,
                          backgroundColor: theme.palette.primary.main,
                          transform: "scaleX(0)",
                          transformOrigin: "left center",
                          transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                        },
                        "&:hover": {
                          transform: "translateY(-2px)",
                        },
                        "&:hover::after": {
                          transform: "scaleX(1)",
                        },
                      }}
                    >
                      Private Access
                    </Button>
                  ) : (
                    <Button
                      color="inherit"
                      component={Link}
                      to="/my-photos"
                      sx={{
                        px: 0,
                        minWidth: "auto",
                        whiteSpace: "nowrap",
                        color: location.pathname === "/my-photos" ? theme.palette.primary.main : navColor,
                        fontSize: "0.82rem",
                        position: "relative",
                        ...motionHoverLift,
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: -6,
                          height: 1.5,
                          backgroundColor: theme.palette.primary.main,
                          transform: location.pathname === "/my-photos" ? "scaleX(1)" : "scaleX(0)",
                          transformOrigin: "left center",
                          transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                        },
                        "&:hover": {
                          transform: "translateY(-2px)",
                        },
                        "&:hover::after": {
                          transform: "scaleX(1)",
                        },
                      }}
                    >
                      My Photos
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      color="inherit"
                      component={Link}
                      to="/admin"
                      sx={{
                        px: 0,
                        minWidth: "auto",
                        color: location.pathname === "/admin" ? theme.palette.primary.main : navColor,
                        fontSize: "0.82rem",
                        position: "relative",
                        ...motionHoverLift,
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: -6,
                          height: 1.5,
                          backgroundColor: theme.palette.primary.main,
                          transform: location.pathname === "/admin" ? "scaleX(1)" : "scaleX(0)",
                          transformOrigin: "left center",
                          transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                        },
                        "&:hover": {
                          transform: "translateY(-2px)",
                        },
                        "&:hover::after": {
                          transform: "scaleX(1)",
                        },
                      }}
                    >
                      Admin
                    </Button>
                  )}
                </Box>

                <Box
                  sx={{
                    width: 1,
                    height: 18,
                    backgroundColor: overlayMode ? alpha("#F7F1E3", 0.22) : alpha(theme.palette.text.primary, 0.12),
                  }}
                />

                <Button
                  variant={overlayMode ? "outlined" : "text"}
                  color="inherit"
                  onClick={openAccountMenu}
                  sx={{
                    color: navColor,
                    borderColor: overlayMode ? alpha("#F7F1E3", 0.22) : undefined,
                    fontSize: "0.78rem",
                    px: overlayMode ? 1.5 : 0,
                    py: overlayMode ? 0.7 : 0,
                    minWidth: "auto",
                    position: "relative",
                    ...motionHoverLift,
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: overlayMode ? -8 : -6,
                      height: 1.5,
                      backgroundColor: theme.palette.primary.main,
                      transform: "scaleX(0)",
                      transformOrigin: "left center",
                      transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                    },
                    "&:hover": {
                      transform: "translateY(-2px)",
                    },
                    "&:hover::after": {
                      transform: "scaleX(1)",
                    },
                  }}
                >
                  {accountButtonLabel}
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Toolbar sx={{ minHeight: headerHeight, pointerEvents: "none" }} />

      <Menu
        anchorReference="anchorPosition"
        anchorPosition={accountMenuPosition ?? { top: 0, left: 0 }}
        open={accountOpen}
        onClose={closeAccountMenu}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            minWidth: 220,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            backgroundColor: alpha(theme.palette.background.paper, 0.98),
          },
        }}
      >
        <Typography sx={{ px: 2, pt: 1.5, pb: 0.75, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: theme.palette.text.secondary }}>
          Appearance
        </Typography>
        <MenuItem
          selected={mode === "light"}
          onClick={() => {
            setMode("light");
            closeAccountMenu();
          }}
        >
          Light Mode
        </MenuItem>
        <MenuItem
          selected={mode === "dark"}
          onClick={() => {
            setMode("dark");
            closeAccountMenu();
          }}
        >
          Dark Mode
        </MenuItem>
        <Divider />
        {!isSignedIn ? (
          <MenuItem component={Link} to="/login" onClick={closeAccountMenu}>
            Sign In
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              signOut();
              closeAccountMenu();
            }}
          >
            Sign Out
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
