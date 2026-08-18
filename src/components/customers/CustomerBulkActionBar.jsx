import React from 'react';
import { Box, Paper, Typography, Button, Stack, Chip, Divider, useTheme } from '@mui/material';
import {
  CheckCircleOutline as ActiveIcon,
  CancelOutlined as InactiveIcon,
  DeleteOutline as DeleteIcon,
  Close as CloseIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';

export const CustomerBulkActionBar = ({
  selectedCount,
  onClearSelection,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  onBulkExport,
}) => {
  const theme = useTheme();

  if (!selectedCount) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1200,
        px: 3,
        py: 1.5,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        maxWidth: '90vw',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Chip
          label={`${selectedCount} Selected`}
          color="primary"
          size="small"
          sx={{ fontWeight: 700 }}
        />
        <Button
          size="small"
          onClick={onClearSelection}
          startIcon={<CloseIcon fontSize="small" />}
          sx={{ textTransform: 'none', color: 'text.secondary', minWidth: 'auto' }}
        >
          Deselect
        </Button>
      </Stack>

      <Divider orientation="vertical" flexItem />

      <Stack direction="row" spacing={1}>
        {onBulkExport && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={onBulkExport}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Export selected
          </Button>
        )}

        <Button
          size="small"
          variant="outlined"
          color="success"
          startIcon={<ActiveIcon />}
          onClick={onBulkActivate}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          Activate
        </Button>

        <Button
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<InactiveIcon />}
          onClick={onBulkDeactivate}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          Deactivate
        </Button>

        <Button
          size="small"
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onBulkDelete}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, boxShadow: 'none' }}
        >
          Delete
        </Button>
      </Stack>
    </Paper>
  );
};
