import { Autocomplete, Checkbox, Chip, ListItemText, TextField } from '@mui/material';

export interface OpcionSelectorMultiple {
  id: string;
  etiqueta: string;
  descripcion?: string | null;
}

interface SelectorMultipleBusquedaProps {
  label: string;
  opciones: OpcionSelectorMultiple[];
  valor: string[];
  onChange: (ids: string[]) => void;
  fullWidth?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  noOptionsText?: string;
}

export function SelectorMultipleBusqueda({
  label,
  opciones,
  valor,
  onChange,
  fullWidth = true,
  required,
  error,
  helperText,
  noOptionsText = 'Sin resultados.',
}: SelectorMultipleBusquedaProps) {
  const seleccionadas = valor
    .map((id) => opciones.find((o) => o.id === id))
    .filter((o): o is OpcionSelectorMultiple => Boolean(o));

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      fullWidth={fullWidth}
      options={opciones}
      value={seleccionadas}
      onChange={(_, seleccion) => onChange(seleccion.map((o) => o.id))}
      isOptionEqualToValue={(opcion, val) => opcion.id === val.id}
      getOptionLabel={(opcion) => opcion.etiqueta}
      noOptionsText={noOptionsText}
      slotProps={{
        popper: {
          placement: 'bottom-start',
          modifiers: [{ name: 'flip', enabled: false }],
        },
        listbox: { sx: { maxHeight: '220px !important' } },
      }}
      renderOption={(props, opcion, { selected }) => {
        const { key, ...resto } = props;
        return (
          <li key={key} {...resto}>
            <Checkbox checked={selected} size="small" />
            <ListItemText
              primary={opcion.etiqueta}
              secondary={opcion.descripcion || undefined}
              slotProps={{
                primary: { sx: { fontSize: '0.8125rem' } },
                secondary: { sx: { fontSize: '0.6875rem' } },
              }}
            />
          </li>
        );
      }}
      renderTags={(seleccion, getTagProps) =>
        seleccion.map((opcion, index) => {
          const { key, ...resto } = getTagProps({ index });
          return <Chip key={key} size="small" label={opcion.etiqueta} {...resto} />;
        })
      }
      renderInput={(params) => (
        <TextField {...params} label={label} required={required && valor.length === 0} error={error} helperText={helperText} />
      )}
    />
  );
}
