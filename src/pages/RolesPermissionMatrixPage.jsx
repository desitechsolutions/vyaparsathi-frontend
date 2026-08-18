import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import ShieldIcon from '@mui/icons-material/Shield';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import {
  fetchRbacRoles,
  fetchRbacPermissions,
  createRbacRole,
  updateRbacRole,
  deleteRbacRole,
} from '../services/api';
import PermissionGate from '../components/rbac/PermissionGate';
import usePermissions from '../hooks/usePermissions';

/**
 * Roles & permissions screen with full CRUD on custom roles.
 * System-preset roles show a lock badge and can be viewed but not edited.
 */
export default function RolesPermissionMatrixPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editor, setEditor] = useState({ open: false, mode: 'create', role: null });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, role: null });

  const { has } = usePermissions();
  const canManage = has('ROLE_MANAGE');

  const load = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([fetchRbacRoles(), fetchRbacPermissions()]);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
      setPermissions(Array.isArray(permsRes.data) ? permsRes.data : []);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load roles.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    permissions.forEach((p) => {
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module).push(p);
    });
    return Array.from(map.entries());
  }, [permissions]);

  const roleHas = (role, code) =>
    Array.isArray(role.permissions) ? role.permissions.includes(code) : (role.permissions?.[code] === true);

  const openCreate = () => setEditor({ open: true, mode: 'create', role: null });
  const openEdit = (role) => setEditor({ open: true, mode: 'edit', role });
  const closeEditor = () => setEditor({ open: false, mode: 'create', role: null });

  const handleDeleteClick = (role) => setConfirmDelete({ open: true, role });
  const closeDelete = () => setConfirmDelete({ open: false, role: null });

  const performDelete = async () => {
    if (!confirmDelete.role) return;
    try {
      await deleteRbacRole(confirmDelete.role.id);
      setSnackbar({ open: true, message: `Role "${confirmDelete.role.displayName || confirmDelete.role.name}" deleted.`, severity: 'success' });
      closeDelete();
      load();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Could not delete role.', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Loading role catalogue…</Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>Access control</Typography>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>Roles &amp; permissions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            System-preset roles are read-only. Build custom roles with the exact permissions your team needs.
          </Typography>
        </Box>
        <PermissionGate code="ROLE_MANAGE">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ py: 1.15, px: 2.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            Create custom role
          </Button>
        </PermissionGate>
      </Stack>

      {/* Role summary strip */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3} sx={{ overflowX: 'auto', pb: 1 }}>
        {roles.map((r) => (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: '1 1 200px', minWidth: 200 }} key={r.id}>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <ShieldIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={800} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.displayName || r.name}
              </Typography>
              {r.system ? (
                <Tooltip title="System preset — read-only">
                  <LockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                </Tooltip>
              ) : canManage && (
                <Stack direction="row" spacing={0.25} sx={{ ml: 'auto' }}>
                  <Tooltip title="Edit role">
                    <IconButton size="small" onClick={() => openEdit(r)}><EditIcon fontSize="inherit" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete role">
                    <IconButton size="small" onClick={() => handleDeleteClick(r)} color="error"><DeleteIcon fontSize="inherit" /></IconButton>
                  </Tooltip>
                </Stack>
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, minHeight: 32 }}>
              {r.description || `${(r.permissions || []).length} permissions`}
            </Typography>
            <Chip size="small" label={`${(r.permissions || []).length} permissions`} variant="outlined" />
          </Paper>
        ))}
      </Stack>

      {/* Matrix */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: '65vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 260, fontWeight: 800, bgcolor: 'background.default' }}>Permission</TableCell>
                {roles.map((r) => (
                  <TableCell key={r.id} align="center" sx={{ minWidth: 88, fontWeight: 800, bgcolor: 'background.default' }}>
                    <Stack alignItems="center" spacing={0.5}>
                      <span>{r.displayName || r.name}</span>
                      {r.system && <Chip size="small" label="Preset" sx={{ height: 16, fontSize: '0.55rem' }} />}
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {grouped.map(([module, perms]) => (
                <React.Fragment key={module}>
                  <TableRow>
                    <TableCell colSpan={roles.length + 1}
                      sx={{
                        bgcolor: 'action.hover',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: '0.4px',
                        textTransform: 'uppercase',
                        color: 'text.secondary',
                      }}>
                      {module}
                    </TableCell>
                  </TableRow>
                  {perms.map((p) => (
                    <TableRow key={p.code} hover>
                      <TableCell sx={{ py: 0.75 }}>
                        <Typography variant="body2" fontWeight={600}>{p.description}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {p.code}
                        </Typography>
                      </TableCell>
                      {roles.map((r) => (
                        <TableCell key={r.id} align="center" sx={{ py: 0.5 }}>
                          {roleHas(r, p.code) ? (
                            <CheckIcon fontSize="small" color="success" />
                          ) : (
                            <RemoveIcon fontSize="small" sx={{ color: 'action.disabled' }} />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <RoleEditorDialog
        open={editor.open}
        mode={editor.mode}
        role={editor.role}
        permissions={permissions}
        onClose={closeEditor}
        onSaved={(msg) => { closeEditor(); setSnackbar({ open: true, message: msg, severity: 'success' }); load(); }}
        onError={(err) => setSnackbar({ open: true, message: err, severity: 'error' })}
      />

      {/* Confirm delete */}
      <Dialog open={confirmDelete.open} onClose={closeDelete} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete role?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
            This can't be undone. Team members currently using this role must be reassigned first.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{confirmDelete.role?.displayName || confirmDelete.role?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDelete} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={performDelete} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Delete role
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// ─── Role editor dialog ──────────────────────────────────────────────

function RoleEditorDialog({ open, mode, role, permissions, onClose, onSaved, onError }) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && role) {
      setName(role.name || '');
      setDisplayName(role.displayName || role.name || '');
      setDescription(role.description || '');
      setSelected(new Set(Array.isArray(role.permissions) ? role.permissions : []));
    } else {
      setName('');
      setDisplayName('');
      setDescription('');
      setSelected(new Set());
    }
  }, [open, mode, role]);

  const grouped = useMemo(() => {
    const map = new Map();
    permissions.forEach((p) => {
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module).push(p);
    });
    return Array.from(map.entries());
  }, [permissions]);

  const toggle = (code) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(code)) next.delete(code); else next.add(code);
    return next;
  });

  const toggleModule = (moduleCodes) => {
    const allOn = moduleCodes.every((c) => selected.has(c));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) moduleCodes.forEach((c) => next.delete(c));
      else moduleCodes.forEach((c) => next.add(c));
      return next;
    });
  };

  const handleSave = async () => {
    if (mode === 'create' && !name.trim()) { onError('Role name is required.'); return; }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        displayName: displayName.trim() || name.trim(),
        description: description.trim(),
        permissions: Array.from(selected),
      };
      if (mode === 'create') {
        await createRbacRole(payload);
        onSaved(`Role "${payload.displayName}" created.`);
      } else {
        await updateRbacRole(role.id, payload);
        onSaved(`Role "${payload.displayName}" updated.`);
      }
    } catch (err) {
      onError(err.response?.data?.message || 'Could not save role.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Stack>
          <Typography variant="h6" fontWeight={800}>
            {mode === 'create' ? 'Create custom role' : `Edit ${role?.displayName || role?.name}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Pick a name and the permissions this role should grant.
          </Typography>
        </Stack>
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Role name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={mode === 'edit'}
              autoFocus={mode === 'create'}
              helperText={mode === 'edit'
                ? 'Name is immutable to keep audit trails stable.'
                : 'Uppercase, letters, digits or underscores. Example: WAREHOUSE_STAFF.'}
              required
              fullWidth
            />
            <TextField
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              helperText="Shown in dropdowns and role chips."
              fullWidth
            />
          </Stack>
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 255))}
            multiline
            minRows={2}
            fullWidth
            helperText={`${description.length}/255 — briefly describe when this role should be assigned.`}
          />

          <Divider />

          <Typography variant="overline" color="text.secondary" fontWeight={700}>Permissions ({selected.size})</Typography>
          {grouped.map(([module, perms]) => {
            const moduleCodes = perms.map((p) => p.code);
            const allOn = moduleCodes.every((c) => selected.has(c));
            const someOn = moduleCodes.some((c) => selected.has(c));
            return (
              <Paper variant="outlined" key={module} sx={{ p: 2, borderRadius: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allOn}
                      indeterminate={!allOn && someOn}
                      onChange={() => toggleModule(moduleCodes)}
                    />
                  }
                  label={<Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: 'uppercase' }}>{module}</Typography>}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 0.5, pl: 4 }}>
                  {perms.map((p) => (
                    <FormControlLabel
                      key={p.code}
                      control={<Checkbox size="small" checked={selected.has(p.code)} onChange={() => toggle(p.code)} />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{p.description}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{p.code}</Typography>
                        </Box>
                      }
                    />
                  ))}
                </Box>
              </Paper>
            );
          })}
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={busy || (mode === 'create' && !name.trim())}
          sx={{ textTransform: 'none', fontWeight: 700, minWidth: 160 }}
        >
          {busy ? <CircularProgress size={20} color="inherit" /> : (mode === 'create' ? 'Create role' : 'Save changes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
