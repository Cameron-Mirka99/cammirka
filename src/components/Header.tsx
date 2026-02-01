import React from "react";
import {
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Slide,
  Toolbar,
  Typography,
  useMediaQuery,
  useScrollTrigger,
  useTheme,
} from "@mui/material";
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from "../auth/AuthProvider";
import { useThemeMode } from "../themeMode";

export const Header = ({...props}) => {
    const location = useLocation();
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("md"));
    const { mode, setMode } = useThemeMode();
    const { status, user, signOut } = useAuth();
    const isSignedIn = status === "signedIn";
    const isAdmin = Boolean(user?.groups.includes("admin"));
    const isActive = (path: string) => location.pathname === path;
    const isLight = theme.palette.mode === "light";
    const [accountMenuPosition, setAccountMenuPosition] = React.useState<{ top: number; left: number } | null>(null);
    const isAccountOpen = Boolean(accountMenuPosition);
    const accountLabel = "Account";
    const [navAnchor, setNavAnchor] = React.useState<null | HTMLElement>(null);
    const isNavOpen = Boolean(navAnchor);
    const headerHeight = { xs: 84, sm: 96, md: 112 };

    function HideOnScroll(props : {children: React.ReactElement, window?: () => Window}) {
        const { children, window } = props;
        const trigger = useScrollTrigger({ target: window ? window() : undefined });
        return (
          <Slide appear={false} direction="down" in={!trigger}>
            {children}
          </Slide>
        );
      }
      
    return <>      
    
    <HideOnScroll {...props}>
    <AppBar 
      sx={{ 
        minHeight: headerHeight,
        display: 'flex', 
        justifyContent: 'center',
        background: isLight
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 245, 245, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(30, 30, 30, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: isLight ? '1px solid rgba(15, 17, 20, 0.08)' : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isLight ? '0 8px 32px rgba(15, 17, 20, 0.08)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar sx={{ minHeight: headerHeight, py: { xs: 1, md: 2 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, sm: 4, md: 6 } }}>
        <Box
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
            }
          }}
        >
          <Typography 
            variant="h4" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: 'clamp(1.2rem, 5vw, 2.5rem)', sm: 'clamp(1.5rem, 5vw, 2.5rem)', md: 'clamp(1.8rem, 5vw, 2.5rem)' },
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #FFB300 0%, #FF6B35 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Cameron Mirka
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: { xs: 'clamp(0.6rem, 2vw, 0.9rem)', sm: 'clamp(0.7rem, 2vw, 0.9rem)', md: 'clamp(0.75rem, 2vw, 0.9rem)' },
              color: theme.palette.text.secondary,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontWeight: 500,
              marginTop: '2px'
            }}
          >
            Photography
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, alignItems: 'center' }}>
          {isSmall ? (
            <>
              <IconButton
                color="inherit"
                onClick={(event) => setNavAnchor(event.currentTarget)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "8px",
                  background: isLight ? "rgba(15, 17, 20, 0.06)" : "rgba(255, 255, 255, 0.08)",
                  "&:hover": {
                    backgroundColor: isLight ? "rgba(15, 17, 20, 0.1)" : "rgba(255, 255, 255, 0.12)",
                  },
                }}
              >
                <Box component="span" sx={{ fontSize: "1.1rem", fontWeight: 700 }}>
                  ≡
                </Box>
              </IconButton>
              <Menu
                anchorEl={navAnchor}
                open={isNavOpen}
                onClose={() => setNavAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                    border: isLight ? "1px solid rgba(15, 17, 20, 0.08)" : "1px solid rgba(255, 255, 255, 0.08)",
                    backgroundColor: theme.palette.background.paper,
                  },
                }}
              >
                <MenuItem component={Link} to="/about" onClick={() => setNavAnchor(null)}>
                  About
                </MenuItem>
                {isSignedIn && (
                  <MenuItem component={Link} to="/my-photos" onClick={() => setNavAnchor(null)}>
                    My Photos
                  </MenuItem>
                )}
                {isAdmin && (
                  <MenuItem component={Link} to="/admin" onClick={() => setNavAnchor(null)}>
                    Admin
                  </MenuItem>
                )}
              </Menu>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                component={Link}
                to="/about"
                sx={{
                  fontSize: { xs: 'clamp(0.9rem, 3vw, 1.3rem)', sm: 'clamp(0.95rem, 3vw, 1.3rem)', md: 'clamp(1rem, 3vw, 1.3rem)' },
                  padding: { xs: '8px 16px', sm: '10px 24px', md: '12px 32px' },
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  position: 'relative',
                  border: 'none',
                  background: isActive('/about') ? 'rgba(255, 179, 0, 0.28)' : (isLight ? 'rgba(255, 179, 0, 0.16)' : 'rgba(255, 179, 0, 0.1)'),
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  borderRadius: '4px',
                  boxShadow: isActive('/about') ? '0 10px 28px rgba(255, 179, 0, 0.2)' : 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '0',
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.2) 0%, transparent 100%)',
                    transition: 'left 0.3s ease',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 179, 0, 0.2)',
                    boxShadow: '0 8px 24px rgba(255, 179, 0, 0.15)',
                    transform: 'translateY(-2px)',
                    '&::before': {
                      left: '100%',
                    }
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                }}
              >
                About
              </Button>

              {isSignedIn && (
                <Button
                  color="inherit"
                  component={Link}
                  to="/my-photos"
                  sx={{
                    fontSize: { xs: 'clamp(0.9rem, 3vw, 1.3rem)', sm: 'clamp(0.95rem, 3vw, 1.3rem)', md: 'clamp(1rem, 3vw, 1.3rem)' },
                    padding: { xs: '8px 16px', sm: '10px 24px', md: '12px 32px' },
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    position: 'relative',
                    border: 'none',
                    whiteSpace: 'nowrap',
                    background: isActive('/my-photos') ? 'rgba(255, 179, 0, 0.28)' : (isLight ? 'rgba(255, 179, 0, 0.16)' : 'rgba(255, 179, 0, 0.1)'),
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    boxShadow: isActive('/my-photos') ? '0 10px 28px rgba(255, 179, 0, 0.2)' : 'none',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '0',
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.2) 0%, transparent 100%)',
                      transition: 'left 0.3s ease',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 179, 0, 0.2)',
                      boxShadow: '0 8px 24px rgba(255, 179, 0, 0.15)',
                      transform: 'translateY(-2px)',
                      '&::before': {
                        left: '100%',
                      }
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    }
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
                    fontSize: { xs: 'clamp(0.9rem, 3vw, 1.3rem)', sm: 'clamp(0.95rem, 3vw, 1.3rem)', md: 'clamp(1rem, 3vw, 1.3rem)' },
                    padding: { xs: '8px 16px', sm: '10px 24px', md: '12px 32px' },
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    position: 'relative',
                    border: 'none',
                    background: isActive('/admin') ? 'rgba(255, 179, 0, 0.28)' : (isLight ? 'rgba(255, 179, 0, 0.16)' : 'rgba(255, 179, 0, 0.1)'),
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    boxShadow: isActive('/admin') ? '0 10px 28px rgba(255, 179, 0, 0.2)' : 'none',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '0',
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.2) 0%, transparent 100%)',
                      transition: 'left 0.3s ease',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 179, 0, 0.2)',
                      boxShadow: '0 8px 24px rgba(255, 179, 0, 0.15)',
                      transform: 'translateY(-2px)',
                      '&::before': {
                        left: '100%',
                      }
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    }
                  }}
                >
                  Admin
                </Button>
              )}
            </>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              pl: { xs: 1, md: 2 },
              borderLeft: isLight ? "1px solid rgba(15, 17, 20, 0.12)" : "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <Button
              color="inherit"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setAccountMenuPosition({ top: rect.bottom, left: rect.right });
              }}
              sx={{
                fontSize: { xs: "clamp(0.85rem, 2.8vw, 1.2rem)", sm: "clamp(0.9rem, 2.8vw, 1.2rem)", md: "clamp(0.95rem, 2.8vw, 1.2rem)" },
                padding: { xs: "8px 14px", sm: "10px 18px", md: "10px 20px" },
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: "0.6px",
                position: "relative",
                border: "none",
                background: isLight ? "rgba(15, 17, 20, 0.06)" : "rgba(255, 255, 255, 0.08)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                overflow: "hidden",
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: isLight ? "rgba(15, 17, 20, 0.1)" : "rgba(255, 255, 255, 0.12)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              {accountLabel}
              <Box component="span" sx={{ ml: 1, fontSize: "0.75em", opacity: 0.7 }}>
                v
              </Box>
            </Button>
            <Menu
              anchorReference="anchorPosition"
              anchorPosition={accountMenuPosition ?? { top: 0, left: 0 }}
              open={isAccountOpen}
              onClose={() => setAccountMenuPosition(null)}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 220,
                  borderRadius: 2,
                  border: isLight ? "1px solid rgba(15, 17, 20, 0.08)" : "1px solid rgba(255, 255, 255, 0.08)",
                  backgroundColor: theme.palette.background.paper,
                },
              }}
            >
              <Typography sx={{ px: 2, pt: 1.5, pb: 1, fontSize: "0.75rem", letterSpacing: "0.8px", textTransform: "uppercase", color: theme.palette.text.secondary }}>
                Appearance
              </Typography>
              <MenuItem
                selected={mode === "light"}
                onClick={() => {
                  setMode("light");
                  setAccountMenuPosition(null);
                }}
              >
                Light mode
              </MenuItem>
              <MenuItem
                selected={mode === "dark"}
                onClick={() => {
                  setMode("dark");
                  setAccountMenuPosition(null);
                }}
              >
                Dark mode
              </MenuItem>
              <Divider />
              {isSignedIn && (
                <>
                  <Typography
                    sx={{
                      px: 2,
                      pt: 1.5,
                      pb: 1,
                      fontSize: "0.75rem",
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    Navigation
                  </Typography>
                  <MenuItem
                    component={Link}
                    to="/my-photos"
                    onClick={() => setAccountMenuPosition(null)}
                  >
                    My Photos
                  </MenuItem>
                  <Divider />
                </>
              )}
              {!isSignedIn ? (
                <MenuItem component={Link} to="/login" onClick={() => setAccountMenuPosition(null)}>
                  Sign in
                </MenuItem>
              ) : (
                <MenuItem
                  onClick={() => {
                    signOut();
                    setAccountMenuPosition(null);
                  }}
                >
                  Sign out
                </MenuItem>
              )}
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  </HideOnScroll>
  <Toolbar sx={{ minHeight: headerHeight }} /></>
}
