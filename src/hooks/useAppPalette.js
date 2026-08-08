import { useTheme } from '@mui/material/styles';

/**
 * useAppPalette — Enterprise Theme Palette Hook
 *
 * Returns a shape-compatible palette object derived from the active MUI theme.
 * This is the single source of truth for component-level color tokens.
 *
 * Replaces all scattered `const theme = { primary: '#0f766e', ... }` objects
 * in payment/sales components. All values update live when the user switches
 * between LIGHT / DARK / AUTO modes.
 *
 * Usage:
 *   const palette = useAppPalette();
 *   <Box sx={{ bgcolor: palette.primary }} />
 *
 * The `teal` entry preserves the intentional POS/payment design identity
 * (previously hardcoded as '#0f766e') without losing theme-awareness.
 */
export function useAppPalette() {
  const theme = useTheme();

  return {
    // Brand / Semantic colors from MUI palette
    primary:        theme.palette.primary.main,
    primaryLight:   theme.palette.primary.light,
    primaryDark:    theme.palette.primary.dark,
    secondary:      theme.palette.secondary.main,
    danger:         theme.palette.error.main,
    warning:        theme.palette.warning.main,
    success:        theme.palette.success.main,
    info:           theme.palette.info.main,

    // Surface / Background
    background:     theme.palette.background.default,
    cardBg:         theme.palette.background.paper,
    surface2:       theme.palette.mode === 'dark' ? '#263349' : '#f1f5f9',

    // Text
    textPrimary:    theme.palette.text.primary,
    textSecondary:  theme.palette.text.secondary,
    textDisabled:   theme.palette.text.disabled,

    // Structure
    borderColor:    theme.palette.divider,
    hover:          theme.palette.action.hover,
    selected:       theme.palette.action.selected,

    // Gradient helpers
    headerGradient: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,

    // Custom: Teal — POS/payment section identity color
    // Preserved from original design; now theme-registered, not hardcoded
    teal:           theme.palette.custom?.teal ?? '#0f766e',
    tealLight:      theme.palette.custom?.tealLight ?? '#14b8a6',

    // Expose raw theme for escape-hatch usage
    _theme: theme,
  };
}

export default useAppPalette;
