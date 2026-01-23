import { AppBar, Button, Slide, Toolbar, Typography, useScrollTrigger, Box } from "@mui/material";
import { Link } from 'react-router-dom';

export const Header = ({...props}) => {

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
        minHeight: '10vh', 
        display: 'flex', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(30, 30, 30, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
    >
      <Toolbar sx={{ minHeight: '10vh', py: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, sm: 4, md: 6 } }}>
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
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontWeight: 500,
              marginTop: '2px'
            }}
          >
            Photography
          </Typography>
        </Box>

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
            background: 'rgba(255, 179, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            borderRadius: '4px',
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
      </Toolbar>
    </AppBar>
  </HideOnScroll>
  <Toolbar sx={{ minHeight: '10vh' }} /></>
}