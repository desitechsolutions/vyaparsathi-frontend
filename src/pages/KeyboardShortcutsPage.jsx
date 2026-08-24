import React from 'react';
import {
  Box, Container, Typography, Paper, Grid, Chip, Avatar, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Button,
  useTheme,
} from '@mui/material';
import {
  Keyboard as KeyboardIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const KeyboardShortcutsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const shortcuts = [
    {
      category: 'Navigation & Search',
      shortcuts: [
        { keys: ['⌘', 'K'], windows: ['Ctrl', 'K'], description: 'Open Command Palette' },
        { keys: ['/'], windows: ['/'], description: 'Open Quick Search' },
        { keys: ['?'], windows: ['?'], description: 'Show Keyboard Shortcuts Help' },
        { keys: ['Esc'], windows: ['Esc'], description: 'Close any open menu or dialog' },
      ],
    },
    {
      category: 'Account & Settings',
      keys: ['⌘', 'Shift', 'L'],
      windows: ['Ctrl', 'Shift', 'L'],
      shortcuts: [
        { keys: ['⌘', 'Shift', 'L'], windows: ['Ctrl', 'Shift', 'L'], description: 'Lock Screen / Session' },
        { keys: ['⌘', ','], windows: ['Ctrl', ','], description: 'Open Preferences' },
      ],
    },
    {
      category: 'Navigation in Menus',
      shortcuts: [
        { keys: ['↑', '↓'], windows: ['↑', '↓'], description: 'Navigate menu items up/down' },
        { keys: ['→', '←'], windows: ['→', '←'], description: 'Navigate menu items right/left' },
        { keys: ['Enter'], windows: ['Enter'], description: 'Select highlighted item' },
        { keys: ['Space'], windows: ['Space'], description: 'Toggle menu item' },
      ],
    },
    {
      category: 'Common Actions',
      shortcuts: [
        { keys: ['Tab'], windows: ['Tab'], description: 'Move focus to next element' },
        { keys: ['Shift', 'Tab'], windows: ['Shift', 'Tab'], description: 'Move focus to previous element' },
        { keys: ['Enter'], windows: ['Enter'], description: 'Confirm / Submit' },
        { keys: ['Esc'], windows: ['Esc'], description: 'Cancel / Close' },
      ],
    },
  ];

  const platformShortcuts = [
    {
      name: 'macOS',
      symbol: '⌘',
      description: 'Command key (also shown as Cmd)',
    },
    {
      name: 'Windows/Linux',
      symbol: 'Ctrl',
      description: 'Control key',
    },
    {
      name: 'All Platforms',
      symbol: 'Shift',
      description: 'Shift modifier key',
    },
  ];

  const KeyDisplay = ({ keys, windowsKeys }) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const displayKeys = isMac ? keys : windowsKeys;

    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        {displayKeys.map((key, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <Typography sx={{ opacity: 0.6 }}>+</Typography>}
            <Chip
              label={key}
              size="small"
              variant="outlined"
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                minWidth: 32,
              }}
            />
          </React.Fragment>
        ))}
      </Stack>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, py: { xs: 3, md: 6 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: 'none' }}
          >
            Back
          </Button>
        </Stack>

        {/* Hero */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              mx: 'auto',
              mb: 2,
            }}
          >
            <KeyboardIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={900} gutterBottom>
            Keyboard Shortcuts
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Master these keyboard shortcuts to work faster and more efficiently.
          </Typography>
        </Box>

        {/* Platform Info */}
        <Paper elevation={0} sx={{ p: 3, mb: 6, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Platform Key Symbols
          </Typography>
          <Grid container spacing={2}>
            {platformShortcuts.map((platform, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip
                    label={platform.symbol}
                    sx={{
                      fontWeight: 800,
                      fontSize: '1rem',
                      minWidth: 50,
                      bgcolor: 'primary.light',
                    }}
                  />
                  <Box>
                    <Typography variant="caption" fontWeight={700} display="block">
                      {platform.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {platform.description}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Shortcuts by Category */}
        <Stack spacing={6}>
          {shortcuts.map((section, sectionIdx) => (
            <Box key={sectionIdx}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 4,
                    height: 24,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                  }}
                />
                {section.category}
              </Typography>

              <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 700, width: '35%' }}>Shortcut</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '65%' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {section.shortcuts.map((shortcut, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          '&:not(:last-of-type)': {
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          },
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <TableCell>
                          <KeyDisplay keys={shortcut.keys} windowsKeys={shortcut.windows} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{shortcut.description}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {sectionIdx < shortcuts.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
        </Stack>

        {/* Tips */}
        <Paper elevation={0} sx={{ p: 4, mt: 8, borderRadius: 2, bgcolor: 'info.light', border: '1px solid', borderColor: 'info.main' }}>
          <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: 'info.dark' }}>
            💡 Pro Tips
          </Typography>
          <Stack component="ul" spacing={1} sx={{ ml: 2, '& li': { mb: 1 } }}>
            <Typography component="li" variant="body2" color="text.secondary">
              <strong>Command Palette (⌘K):</strong> Quickly navigate to any feature or perform common actions without using the mouse.
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              <strong>Quick Search (/):</strong> Search across sales, customers, products, and more from anywhere in the app.
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              <strong>Lock Screen (⌘Shift+L):</strong> Instantly lock your session when stepping away from your desk.
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              <strong>Tab Navigation:</strong> Use Tab and Shift+Tab to navigate through form fields and buttons without the mouse.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default KeyboardShortcutsPage;
