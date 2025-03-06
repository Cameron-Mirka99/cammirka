import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark', // Enable dark mode for overall darkness
    primary: {
      main: '#121212', // A deep, neutral dark grey for the primary color
    },
    secondary: {
      main: '#0B3D0B', // Dark green as a subtle accent
    },
    background: {
      default: '#121212', // Dark background for the entire page
      paper: '#1E1E1E',   // Slightly lighter surfaces for cards, modals, etc.
    },
    text: {
      primary: '#FFFFFF', // White text for readability on dark backgrounds
      secondary: '#B0B0B0',
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
  },
});

export default theme;

