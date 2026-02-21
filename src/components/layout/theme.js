import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  typography: {
    // This sets the base logic
    h1: {
      fontSize: '3rem',
      '@media (max-width:600px)': {
        fontSize: '2rem', // Automatically shrinks on mobile
      },
    },
    h2: {
      fontSize: '2.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          // Standardize horizontal padding for all pages
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (min-width:600px)': {
            paddingLeft: '24px',
            paddingRight: '24px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          // Ensure cards never overflow their parents on small screens
          maxWidth: '100%',
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme); // This magic function automates most of it
export default theme;