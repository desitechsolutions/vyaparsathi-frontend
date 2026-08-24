/**
 * SavedViewsBar — horizontal strip showing saved filter views as chips.
 *
 * Features:
 *  - Click a chip to load that view's filter state
 *  - X on chip to delete the view
 *  - "Save view" button opens SaveViewDialog
 *  - "Export views" icon to download JSON
 *
 * Props:
 *   savedViews        {Array}    from useSavedViews()
 *   activeViewId      {string|null}
 *   onLoad            {function(view)} — called when chip is clicked
 *   onDelete          {function(id)}
 *   onSave            {function(name, description)} — called by dialog Save
 *   onExport          {function}
 *   hasActiveFilter   {boolean}  — whether current filter is non-empty (controls Save btn)
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearIcon from '@mui/icons-material/Clear';

// ── Save dialog ───────────────────────────────────────────────────────────────
function SaveViewDialog({ open, onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Save current view</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="View name"
            fullWidth
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="e.g. Active high-value, Low stock items"
            inputProps={{ maxLength: 60 }}
            helperText={`${name.length}/60 chars`}
          />
          <TextField
            label="Description (optional)"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this view show?"
            inputProps={{ maxLength: 200 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 2 }}>
        <Button onClick={handleClose} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={!name.trim()}
          onClick={handleSave}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          Save view
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main bar ──────────────────────────────────────────────────────────────────
export default function SavedViewsBar({
  savedViews = [],
  activeViewId = null,
  onLoad,
  onDelete,
  onSave,
  onExport,
  hasActiveFilter = false,
}) {
  const theme = useTheme();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  if (savedViews.length === 0 && !hasActiveFilter) return null;

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          py: 1.5,
          px: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.15),
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 0.5 }}>
          <BookmarkIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="caption" fontWeight={800} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Saved views
          </Typography>
        </Box>

        {/* View chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {savedViews.map((view) => (
            <Chip
              key={view.id}
              label={view.name}
              size="small"
              clickable
              onClick={() => onLoad(view)}
              onDelete={() => onDelete(view.id)}
              deleteIcon={
                <Tooltip title={`Delete "${view.name}"`}>
                  <ClearIcon sx={{ fontSize: '14px !important' }} />
                </Tooltip>
              }
              variant={activeViewId === view.id ? 'filled' : 'outlined'}
              color={activeViewId === view.id ? 'primary' : 'default'}
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                borderRadius: 1.5,
                borderColor: activeViewId === view.id ? 'primary.main' : 'divider',
                '&:hover': {
                  bgcolor: activeViewId === view.id
                    ? 'primary.main'
                    : alpha(theme.palette.primary.main, 0.08),
                },
              }}
            />
          ))}
        </Stack>

        {/* Spacer */}
        <Box flex={1} />

        {/* Actions */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          {savedViews.length > 0 && (
            <Tooltip title="Export all saved views to JSON">
              <IconButton
                size="small"
                onClick={onExport}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
              >
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasActiveFilter && (
            <Tooltip title="Save current filter as a named view">
              <Button
                size="small"
                startIcon={<BookmarkAddIcon fontSize="small" />}
                onClick={() => setSaveDialogOpen(true)}
                variant="outlined"
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: 1.5,
                  py: 0.5,
                  px: 1.5,
                }}
              >
                Save view
              </Button>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <SaveViewDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={onSave}
      />
    </>
  );
}
