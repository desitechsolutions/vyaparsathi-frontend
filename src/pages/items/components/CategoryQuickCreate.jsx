import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Stack,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import { createCategory, updateCategory, deleteCategory } from '../../../services/api';

/**
 * Quick-create / edit / delete dialog for categories. Designed to be
 * reachable both from the toolbar (browse existing) and inline from an
 * Autocomplete "no options" CTA (create-and-select).
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {any[]} props.categories — the list from useItemsLogic.apiCategories
 * @param {() => Promise<void>} props.onChanged — parent reloader
 * @param {string} [props.initialName] — prefill when invoked via
 *   Autocomplete no-options CTA
 * @param {(category: any) => void} [props.onCreated] — called after a
 *   successful create so the caller can auto-select the new category
 */
export default function CategoryQuickCreate({
  open,
  onClose,
  categories = [],
  onChanged,
  initialName = '',
  onCreated,
}) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName || '');
      setParentId(null);
      setEditingId(null);
      setError(null);
    }
  }, [open, initialName]);

  const resetForm = () => {
    setName('');
    setParentId(null);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateCategory(editingId, { name: name.trim(), parentId });
      } else {
        const res = await createCategory({ name: name.trim(), parentId });
        if (onCreated && res?.data) onCreated(res.data);
      }
      resetForm();
      if (onChanged) await onChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setParentId(cat.parentId || null);
    setError(null);
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? Items in this category will be unassigned.`)) return;
    try {
      await deleteCategory(cat.id);
      if (onChanged) await onChanged();
      if (editingId === cat.id) resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete. Category may have items.');
    }
  };

  const parentOptions = categories.filter((c) => c.id !== editingId);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
        {editingId ? 'Edit Category' : 'Manage Categories'}
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        <Stack spacing={2}>
          <TextField
            label="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            autoFocus
          />
          <Autocomplete
            options={parentOptions}
            getOptionLabel={(o) => o.name || ''}
            isOptionEqualToValue={(o, v) => o.id === v?.id}
            value={parentOptions.find((c) => c.id === parentId) || null}
            onChange={(_, v) => setParentId(v ? v.id : null)}
            renderInput={(p) => <TextField {...p} label="Parent category (optional)" />}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {editingId && (
              <Button variant="text" onClick={resetForm} disabled={saving}>
                Cancel edit
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={editingId ? <SaveIcon /> : <AddIcon />}
              onClick={handleSubmit}
              disabled={saving}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {editingId ? 'Update' : 'Create'}
            </Button>
          </Stack>

          <Divider>
            <Chip label={`Existing (${categories.length})`} size="small" />
          </Divider>

          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {categories.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No categories yet.
              </Typography>
            ) : (
              <List dense>
                {categories.map((c) => (
                  <ListItem
                    key={c.id}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => handleEdit(c)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(c)}><DeleteIcon fontSize="small" /></IconButton>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={c.name}
                      secondary={c.parentName ? `under ${c.parentName}` : 'root'}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 700 }}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
