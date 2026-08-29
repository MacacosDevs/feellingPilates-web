import { createTheme } from '@mui/material/styles';

// Paleta y tipografía tomadas de feellingPilatesApp/src/theme (la app móvil),
// para que el sitio público comparta identidad visual con la app.
export const publicColors = {
  background: '#fbf7f3',
  backgroundSecondary: '#f5eee6',
  surface: '#ffffff',
  surfaceMuted: '#f7f2ea',
  surfaceElevated: '#ffffff',
  textPrimary: '#2b2420',
  textSecondary: '#6e6155',
  textMuted: '#9e9184',
  border: '#ede6de',
  borderStrong: '#ded4c8',
  borderLight: '#f0eae2',
  accent: '#c46849', // Terracota cálido principal (Luma style)
  accentDark: '#a65337',
  accentSoft: 'rgba(196, 104, 73, 0.12)',
  accentGlow: 'rgba(196, 104, 73, 0.25)',
  sage: '#7a8f6f', // Verde salvia / matcha de bienestar
  sageDark: '#5e7253',
  sageSoft: 'rgba(122, 143, 111, 0.14)',
  gold: '#d29c6b', // Oro cálido / arena
  goldDark: '#b47e4d',
  goldSoft: 'rgba(210, 156, 107, 0.16)',
  goldGlow: 'rgba(210, 156, 107, 0.25)',
  spotsAvailable: '#7a8f6f',
  spotsAvailableSoft: 'rgba(122, 143, 111, 0.14)',
} as const;

export const publicTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: publicColors.accent,
      dark: publicColors.accentDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: publicColors.gold,
      dark: publicColors.goldDark,
      contrastText: publicColors.textPrimary,
    },
    background: {
      default: publicColors.background,
      paper: publicColors.surface,
    },
    text: {
      primary: publicColors.textPrimary,
      secondary: publicColors.textSecondary,
    },
    divider: publicColors.border,
  },
  typography: {
    fontFamily: '"Inter Tight", "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h2: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { lineHeight: 1.6 },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 22,
          paddingRight: 22,
          transition: 'transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease',
        },
        contained: {
          boxShadow: '0 8px 20px -8px rgba(169, 105, 79, 0.5)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 24px -8px rgba(169, 105, 79, 0.65)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderColor: publicColors.borderStrong,
          '&:hover': {
            borderColor: publicColors.accent,
            backgroundColor: publicColors.accentSoft,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: `1px solid ${publicColors.border}`,
          backgroundColor: publicColors.surface,
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '8px 0',
            borderColor: publicColors.accentSoft,
            boxShadow: '0 8px 24px -12px rgba(169, 105, 79, 0.15)',
          },
        },
      },
    },
  },
});
