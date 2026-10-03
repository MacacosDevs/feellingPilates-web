import { createTheme } from '@mui/material/styles';
import { focoVisible } from './estilos';

export const bordeControl = '#8a8a90';
export const tintaAdvertencia = '#994500';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f0f10',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6c5ce7',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#0f0f10',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f0f10',
      secondary: '#6b6b70',
    },
    divider: '#e8e8ea',
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontSize: '1.5rem',
      lineHeight: 1.334,
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontSize: '1.25rem',
      lineHeight: 1.6,
      fontWeight: 700,
    },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.43 },
    caption: { fontSize: '0.75rem', lineHeight: 1.66 },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-focusVisible:not(.Mui-disabled)': focoVisible(theme),
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          '&.MuiChip-outlined.MuiChip-colorWarning:not(.Mui-disabled)': {
            color: tintaAdvertencia,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: ({ theme }) => ({
          '&:not(.Mui-disabled)::placeholder': {
            color: theme.palette.text.secondary,
            opacity: 1,
          },
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          backgroundColor: theme.palette.grey[50],
          '&:not(.Mui-disabled):not(.Mui-error):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
            borderColor: bordeControl,
          },
          '&:hover:not(.Mui-disabled):not(.Mui-error):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.text.primary,
          },
        }),
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        outlined: ({ theme }) => ({
          '&.MuiInputLabel-shrink': {
            backgroundColor: theme.palette.background.paper,
            paddingLeft: 6,
            paddingRight: 6,
            marginLeft: -6,
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});
