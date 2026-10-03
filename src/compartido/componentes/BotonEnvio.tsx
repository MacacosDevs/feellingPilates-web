import type { ReactNode } from 'react';
import { Button, type ButtonProps } from '@mui/material';

export interface BotonEnvioProps {
  children: ReactNode;
  enviando: boolean;
  textoEnviando: ReactNode;
  type: 'submit' | 'button';
  disabled?: boolean;
  onClick?: ButtonProps['onClick'];
}

export function BotonEnvio({ children, enviando, textoEnviando, type, disabled = false, onClick }: BotonEnvioProps) {
  return (
    <Button
      type={type}
      variant="contained"
      disabled={disabled || enviando}
      aria-busy={enviando || undefined}
      onClick={onClick}
    >
      {enviando ? textoEnviando : children}
    </Button>
  );
}
