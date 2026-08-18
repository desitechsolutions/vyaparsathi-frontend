import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import StickyNoteIcon from '@mui/icons-material/StickyNote2';
import {
  fetchCustomerNotes,
  createCustomerNote,
  updateCustomerNote,
  deleteCustomerNote,
  pinCustomerNote,
} from '../../services/api';
import { stringToColor, timeAgo, initialsOf } from '../../utils/customerFormat';

/**
 * Customer notes tab — user-written observations pinned/unpinned by
 * the author, edited/deleted by the author (or OWNER/ADMIN). Distinct
 * from the Activity tab which shows system-generated audit events.
 *
 * <p>Author identity is stamped server-side from the session; the FE
 * never sends author fields, it just renders them.</p>
 */
export default function CustomerNotesPanel({ customerId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState({ open: false, mode: 'create', id: null, body: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchCustomerNotes(customerId);
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load notes.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => setEditor({ open: true, mode: 'create', id: null, body: '' });
  const openEdit = (note) => setEditor({ open: true, mode: 'edit', id: note.id, body: note.body || '' });
  const closeEditor = () => !busy && setEditor({ open: false, mode: 'create', id: null, body: '' });

  const submit = async () => {
    const body = editor.body.trim();
    if (!body) return;
    setBusy(true);
    setError('');
    try {
      if (editor.mode === 'create') {
        await createCustomerNote(customerId, { body });
      } else {
        await updateCustomerNote(customerId, editor.id, { body });
      }
      closeEditor();
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not save the note.');
    } finally {
      setBusy(false);
    }
  };

  const togglePin = async (note) => {
    try {
      await pinCustomerNote(customerId, note.id, !note.pinned);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not update pin.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    setBusy(true);
    try {
      await deleteCustomerNote(customerId, deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not delete the note.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={800}>Notes ({notes.length})</Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ textTransform: 'none' }}
        >
          Add note
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack>
      ) : notes.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', borderRadius: 2.5 }}>
          <StickyNoteIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No notes yet. Add one to record calls, agreements, follow-ups.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {notes.map((n) => {
            const authorName = n.authorName || 'Unknown';
            return (
              <Paper
                key={n.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  borderColor: n.pinned ? 'primary.light' : 'divider',
                  bgcolor: n.pinned ? 'primary.50' : 'background.paper',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: stringToColor(authorName), width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700 }}>
                    {initialsOf(authorName)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={700}>{authorName}</Typography>
                      <Typography variant="caption" color="text.secondary">·</Typography>
                      <Typography variant="caption" color="text.secondary">{timeAgo(n.createdAt)}</Typography>
                      {n.updatedAt && n.createdAt !== n.updatedAt && (
                        <>
                          <Typography variant="caption" color="text.secondary">·</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>edited</Typography>
                        </>
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {n.body}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <Tooltip title={n.pinned ? 'Unpin' : 'Pin to top'}>
                      <IconButton size="small" onClick={() => togglePin(n)} aria-label={n.pinned ? 'Unpin note' : 'Pin note'}>
                        {n.pinned ? <PushPinIcon fontSize="small" color="primary" /> : <PushPinOutlinedIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(n)} aria-label="Edit note"><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeleteDialog({ open: true, id: n.id })} aria-label="Delete note">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Create / edit dialog */}
      <Dialog open={editor.open} onClose={closeEditor} fullWidth maxWidth="sm">
        <DialogTitle>{editor.mode === 'create' ? 'Add note' : 'Edit note'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            maxRows={12}
            placeholder="What happened? Any commitments, blockers, next steps…"
            value={editor.body}
            onChange={(e) => setEditor((s) => ({ ...s, body: e.target.value }))}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={busy || !editor.body.trim()}>
            {editor.mode === 'create' ? 'Add note' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteDialog.open} onClose={() => !busy && setDeleteDialog({ open: false, id: null })} maxWidth="xs">
        <DialogTitle>Delete this note?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Deleted notes can't be recovered. The audit trail keeps a record of the deletion, but the body is gone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} disabled={busy}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={busy}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
