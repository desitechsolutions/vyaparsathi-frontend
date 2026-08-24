import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  useTheme,
  Slide,
} from '@mui/material';
import {
  CheckCircleOutline as ActiveIcon,
  CancelOutlined as InactiveIcon,
  DeleteOutline as DeleteIcon,
  Close as CloseIcon,
  FileDownload as ExportIcon,
  Label as TagIcon,
} from '@mui/icons-material';

/**
 * CustomerBulkActionBar
 *
 * Floating action bar for bulk operations on selected customers.
 * Includes: activate, deactivate, bulk tag (opens a dialog), delete, export.
 *
 * Props:
 *   selectedCount     {number}
 *   onClearSelection  {fn}
 *   onBulkActivate    {fn}
 *   onBulkDeactivate  {fn}
 *   onBulkTag         {fn(tags: string)}  — receives comma-separated tag string
 *   onBulkDelete      {fn}
 *   onBulkExport      {fn}
 */
export const CustomerBulkActionBar = ({
  selectedCount,
  onClearSelection,
  onBulkActivate,
  onBulkDeactivate,
  onBulkTag,
  onBulkDelete,
  onBulkExport,
}) => {
  const theme = useTheme();
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!selectedCount) return null;

  const handleTagConfirm = () => {
    if (onBulkTag && tagInput.trim()) {
      onBulkTag(tagInput.trim());
    }
    setTagDialogOpen(false);
    setTagInput('');
  };

  const handleDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    if (onBulkDelete) onBulkDelete();
  };

  return (
    <>
      <Slide direction="up" in={!!selectedCount} mountOnEnter unmountOnExit>
        <Paper
          elevation={10}
          sx={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1300,
            px: 3,
            py: 1.5,
            borderRadius: 4,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[16],
            maxWidth: '92vw',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
          >
            {/* Count + deselect */}
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Chip
                label={`${selectedCount} selected`}
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

            <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {onBulkExport && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ExportIcon />}
                  onClick={onBulkExport}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                >
                  Export
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

              {onBulkTag && (
                <Button
                  size="small"
                  variant="outlined"
                  color="info"
                  startIcon={<TagIcon />}
                  onClick={() => setTagDialogOpen(true)}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                >
                  Add tags
                </Button>
              )}

              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteConfirmOpen(true)}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, boxShadow: 'none' }}
              >
                Delete
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Slide>

      {/* Bulk Tag Dialog */}
      <Dialog
        open={tagDialogOpen}
        onClose={() => { setTagDialogOpen(false); setTagInput(''); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Add tags to {selectedCount} customer{selectedCount !== 1 ? 's' : ''}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter one or more tags separated by commas. Tags will be appended to each
            selected customer's existing tag list.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Tags"
            placeholder="e.g. VIP, Wholesale, Delhi NCR"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTagConfirm(); }}
            helperText="Separate multiple tags with a comma"
          />
          {tagInput.trim() && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: 'wrap' }} useFlexGap>
              {tagInput.split(',').map((t, i) => t.trim() && (
                <Chip key={i} label={t.trim()} size="small" color="info" />
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => { setTagDialogOpen(false); setTagInput(''); }} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={handleTagConfirm}
            disabled={!tagInput.trim()}
          >
            Apply tags
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Delete {selectedCount} customer{selectedCount !== 1 ? 's' : ''}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will attempt to delete all selected customers. Any customer with existing
            invoices or ledger entries will be safely archived instead to preserve audit records.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete {selectedCount}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
