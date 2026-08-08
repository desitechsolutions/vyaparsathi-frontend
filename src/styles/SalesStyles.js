/**
 * getSalesSelectStyles — react-select theme-aware style factory
 *
 * Accepts the MUI theme object and returns a styles config object for
 * react-select that matches the active application theme (light/dark/auto).
 *
 * Usage in a component:
 *   import { useTheme } from '@mui/material/styles';
 *   import getSalesSelectStyles from '../../styles/SalesStyles';
 *   const muiTheme = useTheme();
 *   const selectStyles = getSalesSelectStyles(muiTheme);
 *   <Select styles={selectStyles} ... />
 */
const getSalesSelectStyles = (muiTheme) => {
  const isDark = muiTheme?.palette?.mode === 'dark';
  const bg      = muiTheme?.palette?.background?.paper  ?? '#ffffff';
  const text     = muiTheme?.palette?.text?.primary      ?? '#111827';
  const textMuted = muiTheme?.palette?.text?.secondary   ?? '#6b7280';
  const primary  = muiTheme?.palette?.primary?.main      ?? '#1976d2';
  const divider  = muiTheme?.palette?.divider            ?? (isDark ? 'rgba(148,163,184,0.12)' : 'rgba(0,0,0,0.08)');
  const hover    = muiTheme?.palette?.action?.hover      ?? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)');

  return {
    control: (provided) => ({
      ...provided,
      fontSize: '0.875rem',
      marginBottom: '1rem',
      backgroundColor: bg,
      borderColor: divider,
      color: text,
      '&:hover': { borderColor: primary },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      backgroundColor: bg,
      border: `1px solid ${divider}`,
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: 200,
      overflowY: 'auto',
      backgroundColor: bg,
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '0.875rem',
      color: state.isSelected ? '#ffffff' : (state.data.value === '' ? textMuted : text),
      backgroundColor: state.isSelected
        ? primary
        : state.isFocused
        ? hover
        : bg,
      '&:active': { backgroundColor: primary },
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: state.data.value === '' ? textMuted : text,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: textMuted,
    }),
    input: (provided) => ({
      ...provided,
      color: text,
    }),
  };
};

export default getSalesSelectStyles;