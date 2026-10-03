import { isAxiosError, isCancel } from 'axios';
import { StrictMode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import App from './App.tsx';
import { useAuthStore } from './auth/authStore';
import { configureSessionBoundary } from './api/client';
import { theme } from './theme/theme';
import { crearRuntimeQuery } from './query/queryClient';

const runtimeQuery = crearRuntimeQuery();
if (import.meta.hot) import.meta.hot.dispose(() => runtimeQuery.dispose());

configureSessionBoundary({
  capture: () => useAuthStore.getState().capturarSesion(),
  unauthorized: (identity) => useAuthStore.getState().expirar(identity),
});
// Bootstrap has no caller UI; store settles its owned loading state on failure.
void useAuthStore.getState().inicializar().catch((error: unknown) => {
  if (isCancel(error) || (isAxiosError(error) && error.response?.status === 401)) return;
  console.warn('No se pudo inicializar la sesión.', {
    status: isAxiosError(error) ? error.response?.status : undefined,
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={runtimeQuery.client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
