import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import CloseIcon from '@mui/icons-material/Close';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/HourglassEmpty';
import DoneIcon from '@mui/icons-material/Done';
import ShieldIcon from '@mui/icons-material/Shield';
import GppGoodIcon from '@mui/icons-material/GppGood';
import BlockIcon from '@mui/icons-material/Block';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DataGrid } from '@mui/x-data-grid';
import {
  listShopInvitations,
  createShopInvitation,
  revokeShopInvitation,
  fetchRbacRoles,
  listShopMembers,
  changeShopMemberRole,
  setShopMemberStatus,
  removeShopMember,
} from '../services/api';
import PermissionGate from '../components/rbac/PermissionGate';
import usePermissions from '../hooks/usePermissions';
import { useSubscription } from '../context/SubscriptionContext';

const STATUS_COLOR = { PENDING: 'warning', ACCEPTED: 'success', REVOKED: 'default', EXPIRED: 'error' };
const STATUS_ICON = {
  PENDING: <PendingIcon fontSize="small" />,
  ACCEPTED: <DoneIcon fontSize="small" />,
  REVOKED: <CancelIcon fontSize="small" />,
  EXPIRED: <CancelIcon fontSize="small" />,
};

/**
 * Team management screen — two tabs:
 *
 *   Members     — everyone in this shop with an active membership.
 *                 Role change, activate/deactivate, remove.
 *   Invitations — pending / accepted / expired / revoked invitations.
 *                 Invite by email, revoke pending.
 *
 * Both are gated per-tab: MEMBERS needs TEAM_VIEW; write actions need
 * TEAM_MANAGE. INVITATIONS list needs TEAM_VIEW; sending / revoking
 * needs TEAM_INVITE.
 */
export default function TeamPage() {
  const [tab, setTab] = useState('members');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { has } = usePermissions();

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>Team &amp; access</Typography>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>Team</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage the people in your shop, their roles, and outstanding invitations.
          </Typography>
        </Box>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: { xs: 1, sm: 2 } }}>
          <Tab value="members" label="Members" />
          <Tab value="invitations" label="Invitations" />
        </Tabs>
      </Paper>

      {tab === 'members' && <MembersTab canManage={has('TEAM_MANAGE')} onNotify={setSnackbar} />}
      {tab === 'invitations' && <InvitationsTab canInvite={has('TEAM_INVITE')} onNotify={setSnackbar} />}

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

// ─── Members tab ─────────────────────────────────────────────────────

function MembersTab({ canManage, onNotify }) {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleDialog, setRoleDialog] = useState({ open: false, member: null, newRole: '' });
  const [confirm, setConfirm] = useState({ open: false, member: null, action: null });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [mRes, rRes] = await Promise.all([listShopMembers(), fetchRbacRoles()]);
      setMembers(Array.isArray(mRes.data) ? mRes.data : []);
      setRoles(Array.isArray(rRes.data) ? rRes.data : []);
    } catch (err) {
      onNotify({ open: true, message: 'Failed to load team.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => { load(); }, [load]);

  const initials = (m) => {
    const first = (m.firstName || '').trim();
    const last = (m.lastName || '').trim();
    if (first || last) return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
    return (m.username || '?')[0].toUpperCase();
  };

  const openRoleChange = (m) => setRoleDialog({ open: true, member: m, newRole: m.role });
  const closeRoleChange = () => setRoleDialog({ open: false, member: null, newRole: '' });

  const applyRoleChange = async () => {
    if (!roleDialog.member || !roleDialog.newRole) return;
    try {
      await changeShopMemberRole(roleDialog.member.userId, roleDialog.newRole);
      onNotify({ open: true, message: 'Role updated.', severity: 'success' });
      closeRoleChange();
      load();
    } catch (err) {
      onNotify({ open: true, message: err.response?.data?.message || 'Could not change role.', severity: 'error' });
    }
  };

  const applyStatus = async (member, active) => {
    try {
      await setShopMemberStatus(member.userId, active);
      onNotify({ open: true, message: active ? 'Member reactivated.' : 'Member deactivated.', severity: 'success' });
      load();
    } catch (err) {
      onNotify({ open: true, message: err.response?.data?.message || 'Could not change status.', severity: 'error' });
    }
  };

  const performRemove = async () => {
    if (!confirm.member) return;
    try {
      await removeShopMember(confirm.member.userId);
      onNotify({ open: true, message: 'Team member removed.', severity: 'success' });
      setConfirm({ open: false, member: null, action: null });
      load();
    } catch (err) {
      onNotify({ open: true, message: err.response?.data?.message || 'Could not remove member.', severity: 'error' });
    }
  };

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter((m) => m.membershipActive && m.userActive).length,
    mfaEnabled: members.filter((m) => m.mfaEnabled).length,
    admins: members.filter((m) => m.role === 'OWNER' || m.role === 'ADMIN').length,
  }), [members]);

  const columns = useMemo(() => [
    {
      field: 'name', headerName: 'Member', flex: 1.6, minWidth: 220, sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 700 }}>
            {initials(row)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {`${row.firstName || ''} ${row.lastName || ''}`.trim() || row.username || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">@{row.username}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: 'email', headerName: 'Contact', flex: 1.2, minWidth: 180,
      renderCell: ({ row }) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2">{row.email || '—'}</Typography>
          {row.phone && <Typography variant="caption" color="text.secondary">{row.phone}</Typography>}
        </Box>
      ),
    },
    {
      field: 'role', headerName: 'Role', width: 150,
      renderCell: ({ row }) => (
        <Chip
          icon={<ShieldIcon fontSize="small" />}
          label={row.roleDisplayName || row.role}
          size="small"
          variant="outlined"
          color={row.role === 'OWNER' ? 'secondary' : row.role === 'ADMIN' ? 'primary' : 'default'}
          sx={{ fontWeight: 700 }}
        />
      ),
    },
    {
      field: 'mfaEnabled', headerName: 'MFA', width: 90, sortable: false,
      renderCell: ({ value }) => value ? (
        <Tooltip title="MFA enabled"><GppGoodIcon fontSize="small" color="success" /></Tooltip>
      ) : (
        <Tooltip title="MFA not set up"><GppGoodIcon fontSize="small" sx={{ color: 'action.disabled' }} /></Tooltip>
      ),
    },
    {
      field: 'membershipActive', headerName: 'Status', width: 130,
      renderCell: ({ value, row }) => (
        <Chip
          size="small"
          label={value ? 'Active' : 'Inactive'}
          color={value ? 'success' : 'default'}
          variant={value ? 'filled' : 'outlined'}
          icon={value ? <DoneIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
          sx={{ fontWeight: 700 }}
        />
      ),
    },
    {
      field: 'lastLoginAt', headerName: 'Last sign-in', width: 160,
      renderCell: ({ value }) => (
        <Typography variant="caption" color="text.secondary">
          {value ? new Date(value).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
        </Typography>
      ),
    },
    {
      field: 'actions', headerName: '', width: 130, sortable: false,
      renderCell: ({ row }) => {
        if (!canManage || row.role === 'OWNER') return null;
        return (
          <Stack direction="row" spacing={0.25}>
            <Tooltip title="Change role">
              <IconButton size="small" onClick={() => openRoleChange(row)}><ShieldIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title={row.membershipActive ? 'Deactivate' : 'Reactivate'}>
              <IconButton size="small" onClick={() => applyStatus(row, !row.membershipActive)}>
                {row.membershipActive ? <BlockIcon fontSize="small" /> : <DoneIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove from shop">
              <IconButton size="small" color="error" onClick={() => setConfirm({ open: true, member: row, action: 'remove' })}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ], [canManage]);

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        {[
          { label: 'Total members', value: stats.total, color: 'primary.main' },
          { label: 'Active', value: stats.active, color: 'success.main' },
          { label: 'MFA enabled', value: stats.mfaEnabled, color: 'info.main' },
          { label: 'Admins & owners', value: stats.admins, color: 'secondary.main' },
        ].map((s) => (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }} key={s.label}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{loading ? '—' : s.value}</Typography>
          </Paper>
        ))}
      </Stack>

      <Paper variant="outlined" sx={{ height: '60vh', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={members}
          columns={columns}
          loading={loading}
          getRowId={(r) => r.userId}
          disableRowSelectionOnClick
          getRowHeight={() => 64}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'name', sort: 'asc' }] },
          }}
          pageSizeOptions={[10, 25, 50]}
          slots={{
            noRowsOverlay: () => (
              <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ height: '100%', p: 4 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 56, height: 56 }}>
                  <GroupIcon />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>Nobody else here yet</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, textAlign: 'center' }}>
                  Invite your team from the Invitations tab.
                </Typography>
              </Stack>
            ),
          }}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default', fontWeight: 700 },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
            '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
          }}
        />
      </Paper>

      {/* Change role dialog */}
      <Dialog open={roleDialog.open} onClose={closeRoleChange} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Change role</DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Choose a new role for <strong>{roleDialog.member?.email}</strong>.
            </Typography>
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    label="Role"
                    value={roleDialog.newRole}
                    onChange={(e) => setRoleDialog({ ...roleDialog, newRole: e.target.value })}
                  >
                    {roles.filter((r) => r.name !== 'OWNER').map((r) => (
                      <MenuItem key={r.id} value={r.name}>
                        <Stack>
                          <Typography variant="body2" fontWeight={700}>{r.displayName || r.name}</Typography>
                          {r.description && <Typography variant="caption" color="text.secondary">{r.description}</Typography>}
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
          <Stack
            direction={{ xs: 'column-reverse', sm: 'row' }}
            spacing={1}
            sx={{ width: '100%' }}
            justifyContent="flex-end"
          >
            <Button
              onClick={closeRoleChange}
              sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={applyRoleChange}
              sx={{ textTransform: 'none', fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
            >
              Save
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Confirm remove */}
      <Dialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, member: null, action: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Remove from shop?</DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
            They'll lose access to this shop immediately. Their user account and any other shop memberships they hold are untouched.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Remove <strong>{confirm.member?.email}</strong> from this shop?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
          <Stack
            direction={{ xs: 'column-reverse', sm: 'row' }}
            spacing={1}
            sx={{ width: '100%' }}
            justifyContent="flex-end"
          >
            <Button
              onClick={() => setConfirm({ open: false, member: null, action: null })}
              sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={performRemove}
              sx={{ textTransform: 'none', fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
            >
              Remove
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Invitations tab ─────────────────────────────────────────────────

function InvitationsTab({ canInvite, onNotify }) {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ email: '', phone: '', roleName: 'STAFF', message: '' });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const { subscription } = useSubscription();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [invitesRes, rolesRes] = await Promise.all([listShopInvitations(), fetchRbacRoles()]);
      setRows(Array.isArray(invitesRes.data) ? invitesRes.data : []);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
    } catch (err) {
      onNotify({ open: true, message: 'Failed to load invitations.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => { load(); }, [load]);

  const openInvite = () => {
    setForm({ email: '', phone: '', roleName: roles.find((r) => r.name === 'STAFF') ? 'STAFF' : (roles[0]?.name || 'STAFF'), message: '' });
    setErrors({});
    setInviteOpen(true);
  };

  const submitInvite = async () => {
    const e = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || '')) e.email = 'Enter a valid email.';
    if (!form.roleName) e.roleName = 'Pick a role.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await createShopInvitation(form);
      onNotify({ open: true, message: `Invitation sent to ${form.email}.`, severity: 'success' });
      setInviteOpen(false);
      load();
    } catch (err) {
      onNotify({ open: true, message: err.response?.data?.message || 'Could not send invitation.', severity: 'error' });
    } finally { setBusy(false); }
  };

  const handleRevoke = async (row) => {
    if (!window.confirm(`Revoke the invitation sent to ${row.email}?`)) return;
    try {
      await revokeShopInvitation(row.id);
      onNotify({ open: true, message: 'Invitation revoked.', severity: 'success' });
      load();
    } catch (err) {
      onNotify({ open: true, message: err.response?.data?.message || 'Could not revoke.', severity: 'error' });
    }
  };

  const stats = useMemo(() => ({
    pending: rows.filter((r) => r.status === 'PENDING').length,
    accepted: rows.filter((r) => r.status === 'ACCEPTED').length,
    expired: rows.filter((r) => r.status === 'EXPIRED').length,
    revoked: rows.filter((r) => r.status === 'REVOKED').length,
  }), [rows]);

  const columns = useMemo(() => [
    {
      field: 'contact', headerName: 'Invitee', flex: 1.4, minWidth: 200, sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 700 }}>
            {(row.email?.[0] || '?').toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>{row.email}</Typography>
            {row.phone && <Typography variant="caption" color="text.secondary">{row.phone}</Typography>}
          </Box>
        </Stack>
      ),
    },
    {
      field: 'roleName', headerName: 'Role', width: 140,
      renderCell: ({ value }) => <Chip size="small" label={value} variant="outlined" sx={{ fontWeight: 700 }} />,
    },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: ({ value }) => (
        <Chip size="small" icon={STATUS_ICON[value]} label={value} color={STATUS_COLOR[value] || 'default'} sx={{ fontWeight: 700 }} />
      ),
    },
    { field: 'inviterName', headerName: 'Invited by', flex: 1, minWidth: 140 },
    {
      field: 'createdAt', headerName: 'Sent', width: 140,
      renderCell: ({ value }) => (
        <Typography variant="caption" color="text.secondary">
          {value ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </Typography>
      ),
    },
    {
      field: 'actions', headerName: '', width: 80, sortable: false,
      renderCell: ({ row }) => row.status === 'PENDING' && canInvite ? (
        <Tooltip title="Revoke invitation">
          <IconButton size="small" onClick={() => handleRevoke(row)} aria-label="Revoke invitation">
            <CancelIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null,
    },
  ], [canInvite]);

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems={{ sm: 'stretch' }}>
        {[
          { label: 'Pending', value: stats.pending, color: 'warning.main' },
          { label: 'Accepted', value: stats.accepted, color: 'success.main' },
          { label: 'Expired', value: stats.expired, color: 'error.main' },
          { label: 'Revoked', value: stats.revoked, color: 'text.secondary' },
        ].map((s) => (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }} key={s.label}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{loading ? '—' : s.value}</Typography>
          </Paper>
        ))}
        <PermissionGate code="TEAM_INVITE">
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            {(() => {
              const maxStaff = subscription?.maxStaffUsers ?? null;
              const staffUsed = subscription?.staffUsed ?? null;
              if (maxStaff == null || maxStaff <= 0 || staffUsed == null) return null;
              const pct = staffUsed / maxStaff;
              const color = pct >= 1 ? 'error' : pct >= 0.8 ? 'warning' : 'default';
              return (
                <Chip
                  size="small"
                  label={`${staffUsed} / ${maxStaff} staff`}
                  color={color}
                  variant={color === 'default' ? 'outlined' : 'filled'}
                  sx={{ fontWeight: 600 }}
                />
              );
            })()}
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={openInvite}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 1.15 }}
            >
              Invite team member
            </Button>
          </Paper>
        </PermissionGate>
      </Stack>

      <Paper variant="outlined" sx={{ height: '60vh', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(r) => r.id}
          disableRowSelectionOnClick
          getRowHeight={() => 64}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
          }}
          pageSizeOptions={[10, 25, 50]}
          slots={{
            noRowsOverlay: () => (
              <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ height: '100%', p: 4 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 56, height: 56 }}>
                  <PersonAddIcon />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>No invitations yet</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, textAlign: 'center' }}>
                  Send your first invitation and they'll get a link to join.
                </Typography>
                <PermissionGate code="TEAM_INVITE">
                  <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openInvite} sx={{ textTransform: 'none', mt: 1 }}>
                    Invite team member
                  </Button>
                </PermissionGate>
              </Stack>
            ),
          }}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default', fontWeight: 700 },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
            '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
          }}
        />
      </Paper>

      {/* Invite dialog */}
      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack>
            <Typography variant="h6" fontWeight={800}>Invite a team member</Typography>
            <Typography variant="caption" color="text.secondary">The invite link expires in 72 hours.</Typography>
          </Stack>
          <IconButton onClick={() => setInviteOpen(false)} aria-label="Close" size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}>
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                label="Email address"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
                autoFocus
                fullWidth
                required
                error={!!errors.email}
                helperText={errors.email || 'They must accept using this exact address.'}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                label="Mobile number (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.roleName}>
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  value={form.roleName}
                  onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                >
                  {roles.map((r) => (
                    <MenuItem key={r.id} value={r.name} disabled={r.name === 'OWNER'}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" fontWeight={700}>{r.displayName || r.name}</Typography>
                        {r.system && <Chip size="small" label="Preset" sx={{ height: 18, fontSize: '0.65rem' }} />}
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                {!errors.roleName && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {roles.find((r) => r.name === form.roleName)?.description || 'Pick a role to see its permissions.'}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Personal message (optional)"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value.slice(0, 500) })}
                fullWidth
                multiline
                rows={3}
                placeholder="Welcome to the team!"
                helperText={`${(form.message || '').length}/500`}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          <Stack
            direction={{ xs: 'column-reverse', sm: 'row' }}
            spacing={1}
            sx={{ width: '100%' }}
            justifyContent="flex-end"
          >
            <Button
              onClick={() => setInviteOpen(false)}
              sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={submitInvite}
              disabled={busy || !form.email || !form.roleName}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                minWidth: { xs: 'unset', sm: 160 },
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              {busy ? <CircularProgress size={20} color="inherit" /> : 'Send invitation'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}
