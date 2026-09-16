import { ThemeProvider } from '@mui/material/styles';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { theme } from '../../theme/theme';

export function renderWithTheme(element: ReactElement) {
  return render(<ThemeProvider theme={theme}>{element}</ThemeProvider>);
}
