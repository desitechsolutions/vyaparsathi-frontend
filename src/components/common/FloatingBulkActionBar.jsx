import React from 'react';
import {
  Paper,
  Stack,
  Chip,
  Button,
  Divider,
  LinearProgress,
  Typography,
  Box,
  useTheme,
  Slide,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * FloatingBulkActionBar
 *
 * A fixed, centred floating toolbar that appears whenever one or more rows are
 * selected on a list page. Accepts an arbitrary `actions` array so each list
 * page can define its own operation set without duplicating the shell.
 *
 * Props:
 *   selectedCount  {number}   — number of currently-selected items
 *   entityLabel    {string}   — singular label used in the count pill, e.g. "customer"
 *   onClearSelection {fn}     — callback to deselect all
 *   actions        {Array}    — array of action descriptors:
 *                               { label, icon, color, variant, onClick, disabled }
 *   progress       {object|null} — if non-null, shows a progress bar:
 *                               { current, total, label }
 *
 * The bar slides in/out via MUI <Slide> — no layout shift.
 */
const FloatingBulkActionBar = ({
  selectedCount = 0,
  entityLabel = 'item',
  onClearSelection,
  actions = [],
  progress = null,
}) => {
  const theme = useTheme();
  const visible = selectedCount > 0;

  const label =
    selectedCount === 1
      ? `1 ${entityLabel} selected`
      : `${selectedCount} ${entityLabel}s selected`;

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Paper
        elevation={10}
        sx={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          px: 3,
          py: progress ? 1.25 : 1.5,
          borderRadius: 4,
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[16],
          maxWidth: '92vw',
          minWidth: 320,
          overflow: 'hidden',
        }}
      >
        {/* Progress overlay */}
        {progress && (
          <Box sx={{ mb: 1.25 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {progress.label || `Processing ${progress.current} of ${progress.total}…`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round((progress.current / progress.total) * 100)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={(progress.current / progress.total) * 100}
              sx={{ borderRadius: 4, height: 5 }}
            />
          </Box>
        )}

        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          flexWrap="wrap"
          useFlexGap
        >
          {/* Count badge + deselect */}
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Chip
              label={label}
              color="primary"
              size="small"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />
            <Button
              size="small"
              onClick={onClearSelection}
              sx={{
                textTransform: 'none',
                color: 'text.secondary',
                minWidth: 'auto',
                p: 0.5,
                fontWeight: 600,
              }}
            >
              <CloseIcon sx={{ fontSize: '1rem', mr: 0.25 }} />
              Deselect
            </Button>
          </Stack>

          {actions.length > 0 && (
            <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
          )}

          {/* Action buttons */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {actions.map((action, idx) => (
              <Button
                key={idx}
                size="small"
                variant={action.variant || 'outlined'}
                color={action.color || 'primary'}
                startIcon={action.icon}
                onClick={action.onClick}
                disabled={action.disabled || !!progress}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Slide>
  );
};

export default FloatingBulkActionBar;
