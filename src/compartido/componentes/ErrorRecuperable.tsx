import type { ReactNode } from 'react';
import { Alert, Button, type ButtonProps, type SxProps, type Theme } from '@mui/material';

export interface ErrorRecuperableProps {
  children: ReactNode;
  onReintentar: () => void;
  disabled?: boolean;
  textoReintentar?: ReactNode;
  size?: ButtonProps['size'];
  sx?: SxProps<Theme>;
}

export function ErrorRecuperable({
  children,
  onReintentar,
  disabled = false,
  textoReintentar = 'Reintentar',
  size = 'small',
  sx,
}: ErrorRecuperableProps) {
  return (
    <Alert
      severity="error"
      sx={sx}
      action={
        <Button type="button" color="inherit" size={size} onClick={onReintentar} disabled={disabled}>
          {textoReintentar}
        </Button>
      }
    >
      {children}
    </Alert>
  );
}
