import { AppBar, Button, Slide, Toolbar, Typography, useScrollTrigger } from "@mui/material";
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
    <AppBar>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Cameron Mirka Photography
        </Typography>
        <Button color="inherit" component={Link} to="/about">
          About
        </Button>
      </Toolbar>
    </AppBar>
  </HideOnScroll>
  <Toolbar /></>
}