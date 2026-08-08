import { createTheme } from '@mui/material/styles';

/**
 * Returns a MUI theme for the given color mode ('light' | 'dark').
 * All component overrides live here so individual page files don't need to change.
 *
 * Design tokens:
 *  Light background:  #F8FAFC  (slate-50)
 *  Light surface:     #ffffff
 *  Dark background:   #0f172a  (slate-900)
 *  Dark surface:      #1e293b  (slate-800)
 *  Dark surface-2:    #263349  (slightly lighter — for nested cards)
 */
export const getAppTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,

      primary: {
        main:         isDark ? '#60a5fa' : '#1976d2',
        light:        isDark ? '#93c5fd' : '#42a5f5',
        dark:         isDark ? '#2563eb' : '#1565c0',
        contrastText: '#ffffff',
      },
      secondary: {
        main:         isDark ? '#a78bfa' : '#7c3aed',
        light:        isDark ? '#c4b5fd' : '#9333ea',
        dark:         isDark ? '#7c3aed' : '#6b21a8',
        contrastText: '#ffffff',
      },

      background: {
        default: isDark ? '#0f172a' : '#F8FAFC',
        paper:   isDark ? '#1e293b' : '#ffffff',
      },

      text: {
        primary:   isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#cbd5e1' : '#475569',
        disabled:  isDark ? '#64748b' : '#94a3b8',
      },

      divider: isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(0, 0, 0, 0.08)',

      action: {
        active:             isDark ? '#f8fafc'              : 'rgba(0,0,0,0.54)',
        hover:              isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        selected:           isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        disabled:           isDark ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.26)',
        disabledBackground: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        focus:              isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
      },

      // Semantic colours — high contrast in both modes
      success: {
        main:  isDark ? '#4ade80' : '#16a34a',
        light: isDark ? '#86efac' : '#22c55e',
        dark:  isDark ? '#16a34a' : '#15803d',
      },
      warning: {
        main:  isDark ? '#fbbf24' : '#d97706',
        light: isDark ? '#fde047' : '#f59e0b',
        dark:  isDark ? '#d97706' : '#b45309',
      },
      error: {
        main:  isDark ? '#f87171' : '#dc2626',
        light: isDark ? '#fca5a5' : '#ef4444',
        dark:  isDark ? '#dc2626' : '#b91c1c',
      },
      info: {
        main:  isDark ? '#38bdf8' : '#0284c7',
        light: isDark ? '#7dd3fc' : '#38bdf8',
        dark:  isDark ? '#0284c7' : '#0369a1',
      },

      // Custom tokens — extend MUI palette for domain-specific design intent
      // `teal` is the identity color for the POS/Payments section.
      custom: {
        teal:      isDark ? '#2dd4bf' : '#0f766e',
        tealLight: isDark ? '#5eead4' : '#14b8a6',
      },
    },

    typography: {
      fontFamily: "'Roboto', 'Segoe UI', sans-serif",
    },

    shape: {
      borderRadius: 8,
    },

    // ─── Component overrides ────────────────────────────────────────────────
    components: {

      // ── AppBar ─────────────────────────────────────────────────────────────
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            // Intentional brand override: AppBar is ALWAYS brand-blue
            // regardless of light/dark mode — consistent with SAP Fiori / Dynamics 365
            backgroundColor: '#1976d2',
            color: '#ffffff',
          },
        },
      },

      // ── CssBaseline — set body bg + smooth scrollbar in dark ──────────────
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          html: {
            scrollBehavior: 'smooth',
          },
          body: {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            transition: 'background-color 0.2s ease, color 0.2s ease',
          },
          // Webkit scrollbar (Chrome/Safari)
          '::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '::-webkit-scrollbar-track': {
            background: isDark ? '#1e293b' : '#f1f5f9',
          },
          '::-webkit-scrollbar-thumb': {
            background: isDark ? '#334155' : '#cbd5e1',
            borderRadius: 4,
          },
          '::-webkit-scrollbar-thumb:hover': {
            background: isDark ? '#475569' : '#94a3b8',
          },
          // Force light mode for print
          '@media print': {
            body: {
              backgroundColor: '#ffffff !important',
              color: '#000000 !important',
            },
          },
        }),
      },

      // ── Paper — no gradient bleed, smooth transition ───────────────────────
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            backgroundColor: theme.palette.background.paper,
            transition: 'background-color 0.2s ease',
          }),
          outlined: ({ theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },

      // ── Card ────────────────────────────────────────────────────────────────
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            maxWidth: '100%',
          }),
        },
      },

      // ── Drawer / Sidebar ────────────────────────────────────────────────────
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundImage: 'none',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          }),
        },
      },

      // ── Dialog ──────────────────────────────────────────────────────────────
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundImage: 'none',
            backgroundColor: theme.palette.background.paper,
          }),
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.primary,
          }),
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.primary,
          }),
        },
      },

      // ── Table ───────────────────────────────────────────────────────────────
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.action.hover,
          }),
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary,
          }),
          head: ({ theme }) => ({
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.primary,
            fontWeight: 700,
          }),
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }),
        },
      },

      // ── DataGrid ─────────────────────────────────────────────────────────────
      MuiDataGrid: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.primary,
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.text.primary,
              borderBottom: `1px solid ${theme.palette.divider}`,
              fontWeight: 700,
            },
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: theme.palette.action.hover,
            },
            '& .MuiDataGrid-columnSeparator': {
              color: theme.palette.divider,
            },
            '& .MuiDataGrid-footerContainer': {
              backgroundColor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`,
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: theme.palette.action.hover,
            },
            '& .MuiDataGrid-row.Mui-selected': {
              backgroundColor: theme.palette.action.selected,
            },
            '& .MuiDataGrid-overlay': {
              backgroundColor: theme.palette.background.paper,
            },
            '& .MuiDataGrid-toolbarContainer': {
              backgroundColor: theme.palette.background.paper,
              borderBottom: `1px solid ${theme.palette.divider}`,
              padding: '8px 16px',
            },
          }),
        },
      },

      // ── TextField / Input ─────────────────────────────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(148,163,184,0.3)' : 'rgba(0,0,0,0.23)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(148,163,184,0.6)' : 'rgba(0,0,0,0.6)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
          }),
          input: ({ theme }) => ({
            color: theme.palette.text.primary,
            '&::placeholder': {
              color: theme.palette.text.secondary,
              opacity: 1,
            },
          }),
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.secondary,
          }),
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
            },
          }),
        },
      },

      // ── Autocomplete ──────────────────────────────────────────────────────
      MuiAutocomplete: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundImage: 'none',
            backgroundColor: theme.palette.background.paper,
          }),
          option: ({ theme }) => ({
            color: theme.palette.text.primary,
            '&[aria-selected="true"]': {
              backgroundColor: isDark ? 'rgba(25,118,210,0.2)' : 'rgba(25,118,210,0.08)',
            },
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }),
        },
      },

      // ── Menu / MenuItem ───────────────────────────────────────────────────
      MuiMenu: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundImage: 'none',
            backgroundColor: theme.palette.background.paper,
            boxShadow: isDark
              ? '0 10px 40px rgba(0,0,0,0.6)'
              : '0 4px 20px rgba(0,0,0,0.08)',
          }),
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(25,118,210,0.2)' : 'rgba(25,118,210,0.08)',
            },
          }),
        },
      },

      // ── Select ─────────────────────────────────────────────────────────────
      MuiSelect: {
        styleOverrides: {
          icon: ({ theme }) => ({
            color: theme.palette.text.secondary,
          }),
        },
      },

      // ── Chip ───────────────────────────────────────────────────────────────
      MuiChip: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...(isDark && {
              '&.MuiChip-filled:not(.MuiChip-colorPrimary):not(.MuiChip-colorSecondary):not(.MuiChip-colorError):not(.MuiChip-colorWarning):not(.MuiChip-colorSuccess):not(.MuiChip-colorInfo)': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: theme.palette.text.primary,
              },
            }),
          }),
          label: ({ theme }) => ({
            color: 'inherit',
          }),
        },
      },

      // ── Tooltip ────────────────────────────────────────────────────────────
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#334155' : '#1e293b',
            color: '#f1f5f9',
            fontSize: '0.75rem',
          },
          arrow: {
            color: isDark ? '#334155' : '#1e293b',
          },
        },
      },

      // ── Stepper ────────────────────────────────────────────────────────────
      MuiStepLabel: {
        styleOverrides: {
          label: ({ theme }) => ({
            color: theme.palette.text.secondary,
            '&.Mui-active': { color: theme.palette.primary.main },
            '&.Mui-completed': { color: theme.palette.success.main },
          }),
        },
      },
      MuiStepConnector: {
        styleOverrides: {
          line: ({ theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },

      // ── Tabs ────────────────────────────────────────────────────────────────
      MuiTab: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.secondary,
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          }),
        },
      },

      // ── List / ListItem ────────────────────────────────────────────────────
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(25,118,210,0.18)' : 'rgba(25,118,210,0.08)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(25,118,210,0.24)' : 'rgba(25,118,210,0.12)',
              },
            },
          }),
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: ({ theme }) => ({
            color: theme.palette.text.primary,
          }),
          secondary: ({ theme }) => ({
            color: theme.palette.text.secondary,
          }),
        },
      },

      // ── Divider ─────────────────────────────────────────────────────────────
      MuiDivider: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },

      // ── LinearProgress ─────────────────────────────────────────────────────
      MuiLinearProgress: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
          }),
        },
      },

      // ── Avatar ──────────────────────────────────────────────────────────────
      MuiAvatar: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...(isDark && {
              // Only override if no explicit bgcolor is set (default grey avatar)
              '&.MuiAvatar-colorDefault': {
                backgroundColor: '#334155',
                color: '#f1f5f9',
              },
            }),
          }),
        },
      },

      // ── Accordion ───────────────────────────────────────────────────────────
      MuiAccordion: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            backgroundImage: 'none',
            '&:before': {
              backgroundColor: theme.palette.divider,
            },
          }),
        },
      },

      // ── Alert ────────────────────────────────────────────────────────────────
      // MuiAlert already uses semantic colors — just ensure text contrast
      MuiAlert: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...(isDark && {
              '&.MuiAlert-outlined': {
                borderColor: 'currentColor',
              },
            }),
          }),
        },
      },

      // ── Skeleton ────────────────────────────────────────────────────────────
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          },
        },
      },

      // ── Switch ──────────────────────────────────────────────────────────────
      MuiSwitch: {
        styleOverrides: {
          track: {
            backgroundColor: isDark ? '#475569' : '#94a3b8',
          },
        },
      },

      // ── Breadcrumbs ─────────────────────────────────────────────────────────
      MuiBreadcrumbs: {
        styleOverrides: {
          separator: ({ theme }) => ({
            color: theme.palette.text.secondary,
          }),
        },
      },

      // ── Badge ─────────────────────────────────────────────────────────────
      // Already uses semantic colors — no override needed.

      // ── IconButton ───────────────────────────────────────────────────────
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.primary,
          }),
        },
      },

      // ── Button ────────────────────────────────────────────────────────────
      MuiButton: {
        styleOverrides: {
          text: ({ theme }) => ({
            color: theme.palette.text.primary,
          }),
        },
      },

      // ── Popover ───────────────────────────────────────────────────────────
      MuiPopover: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundImage: 'none',
            backgroundColor: theme.palette.background.paper,
          }),
        },
      },
    },
  });
};

// Default light export for any legacy imports
export default getAppTheme('light');