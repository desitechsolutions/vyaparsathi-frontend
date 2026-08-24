import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Grid,
  Stack,
  Avatar,
  Divider,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useTranslation } from 'react-i18next';
import {
  fetchUsers,
  adminCreateUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
  fetchShop,
} from '../services/api';
import PasswordField from '../components/auth/PasswordField';
import PasswordStrengthMeter, { evaluatePassword } from '../components/auth/PasswordStrengthMeter';

const ROLES = ['STAFF', 'ADMIN'];

const ROLE_META = {
  OWNER: {
    color: 'secondary',
    icon: <AdminPanelSettingsIcon fontSize="small" />,
    description: 'Owner of the shop. Full access to every setting, billing, and team.',
  },
  ADMIN: {
    color: 'primary',
    icon: <SecurityIcon fontSize="small" />,
    description: 'Can invite staff, manage inventory & financials, and change most settings.',
  },
  STAFF: {
    color: 'default',
    icon: <VpnKeyIcon fontSize="small" />,
    description: 'Day-to-day operations: create sales, manage stock. No access to billing or roles.',
  },
  SUPER_ADMIN: {
    color: 'error',
    icon: <AdminPanelSettingsIcon fontSize="small" />,
    description: 'Platform-level administrator (across all shops).',
  },
  PENDING_OWNER: {
    color: 'warning',
    icon: <InfoOutlinedIcon fontSize="small" />,
    description: 'Registered but has not completed shop setup.',
  },
};

const initialsOf = (user) => {
  const first = (user.firstName || '').trim();
  const last = (user.lastName || '').trim();
  if (first || last) return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
  const uname = (user.username || '').trim();
  return uname ? uname[0].toUpperCase() : '?';
};

const fmtDate = (v) => {
  if (!v) return '—';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

const fmtDateTime = (v) => {
  if (!v) return 'Never signed in';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
};

const UserManagementPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [dialogMode, setDialogMode] = useState(null); // 'create' | 'edit' | 'role'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Toolbar filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL | OWNER | ADMIN | STAFF
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, shopsResponse] = await Promise.all([fetchUsers(), fetchShop()]);
      setUsers(usersData);
      const shopData = shopsResponse.data;
      setShops(Array.isArray(shopData) ? shopData : shopData ? [shopData] : []);
    } catch (error) {
      console.error('User load error:', error);
      setSnackbar({
        open: true,
        message: t('userManagementPage.errorLoad', 'Failed to load users.'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDialogClose = () => {
    setDialogMode(null);
    setSelectedUser(null);
    setFormData({});
    setFormErrors({});
  };

  const validateForm = () => {
    let errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    if (dialogMode === 'create') {
      if (!formData.username) errors.username = t('userManagementPage.errorUsername', 'Username is required.');
      const pw = formData.password || '';
      if (!pw) {
        errors.password = t('userManagementPage.errorPassword', 'Password is required.');
      } else {
        const { rules } = evaluatePassword(pw);
        if (!(rules.length && rules.upper && rules.lower && rules.digit && rules.special)) {
          errors.password =
            'Password must be at least 8 characters and include an uppercase letter, lowercase letter, digit and special character.';
        }
      }
      if (!formData.phone || !phoneRegex.test(formData.phone)) {
        errors.phone = t('userManagementPage.errorPhone', 'Enter a valid phone number.');
      }
    }

    if (!formData.firstName) errors.firstName = t('userManagementPage.errorFirstName', 'First name is required.');
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = t('userManagementPage.errorEmail', 'Enter a valid email.');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateDialog = () => {
    setFormData({
      username: '',
      password: '',
      role: 'STAFF',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      shopId: shops[0]?.id || '',
    });
    setDialogMode('create');
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      shopId: user.shopId || '',
    });
    setDialogMode('edit');
  };

  const openRoleDialog = (user) => {
    setSelectedUser(user);
    setFormData({ role: user.role });
    setDialogMode('role');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;
    try {
      setActionLoading(true);
      const createdUser = await adminCreateUser(formData);
      setUsers((prev) => [...prev, createdUser]);
      setSnackbar({
        open: true,
        message: t('userManagementPage.successCreate', 'User created.'),
        severity: 'success',
      });
      handleDialogClose();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Could not create the user.',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !validateForm()) return;
    try {
      setActionLoading(true);
      const updatedUser = await updateUser(selectedUser.id, formData);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      setSnackbar({
        open: true,
        message: t('userManagementPage.successUpdate', 'User updated.'),
        severity: 'success',
      });
      handleDialogClose();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Could not update user.',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const updatedUser = await updateUserRole(selectedUser.id, formData.role);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      setSnackbar({
        open: true,
        message: t('userManagementPage.successRole', 'Role updated.'),
        severity: 'success',
      });
      handleDialogClose();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Could not change role.',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = useCallback(async (userId, currentStatus) => {
    try {
      const updatedUser = await updateUserStatus(userId, !currentStatus);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      setSnackbar({
        open: true,
        message: t('userManagementPage.successStatus', 'Status updated.'),
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Could not change status.',
        severity: 'error',
      });
    }
  }, [t]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.active).length,
    inactive: users.filter((u) => !u.active).length,
    admins: users.filter((u) => u.role === 'OWNER' || u.role === 'ADMIN').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchQ =
        !q ||
        (u.firstName && u.firstName.toLowerCase().includes(q)) ||
        (u.lastName && u.lastName.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.active) ||
        (statusFilter === 'INACTIVE' && !u.active);
      return matchQ && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const columns = useMemo(() => [
    {
      field: 'name',
      headerName: t('userManagementPage.columns.name', 'User'),
      flex: 1.6,
      minWidth: 220,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 700 }}>
            {initialsOf(row)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {`${row.firstName || ''} ${row.lastName || ''}`.trim() || row.username || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{row.username}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: 'contact',
      headerName: t('userManagementPage.columns.contact', 'Contact'),
      flex: 1.4,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2">{row.email || <em style={{ opacity: 0.6 }}>No email</em>}</Typography>
          <Typography variant="caption" color="text.secondary">{row.phone || '—'}</Typography>
        </Box>
      ),
      sortable: false,
    },
    {
      field: 'role',
      headerName: t('userManagementPage.columns.role', 'Role'),
      flex: 0.9,
      minWidth: 130,
      renderCell: ({ value }) => {
        const meta = ROLE_META[value] || ROLE_META.STAFF;
        return (
          <Chip
            icon={meta.icon}
            label={value}
            color={meta.color}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        );
      },
    },
    {
      field: 'lastLoginAt',
      headerName: 'Last sign-in',
      flex: 1.1,
      minWidth: 150,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ py: 1, color: 'text.secondary' }}>
          <HistoryIcon fontSize="small" />
          <Typography variant="caption">{fmtDateTime(row.lastLoginAt)}</Typography>
        </Stack>
      ),
      sortable: false,
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ value }) => <Typography variant="body2" color="text.secondary">{fmtDate(value)}</Typography>,
    },
    {
      field: 'active',
      headerName: t('userManagementPage.columns.status', 'Status'),
      width: 150,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Switch
              checked={params.value}
              onChange={() => handleStatusChange(params.id, params.value)}
              disabled={params.row.role === 'OWNER'}
              color="success"
              size="small"
            />
          }
          label={<Typography variant="caption" fontWeight={600}>{params.value ? 'Active' : 'Inactive'}</Typography>}
          sx={{ ml: 0 }}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Tooltip title={t('userManagementPage.editUser', 'Edit user')}><EditIcon fontSize="small" /></Tooltip>}
          label="Edit"
          onClick={() => openEditDialog(params.row)}
        />,
        <GridActionsCellItem
          key="role"
          icon={
            <Tooltip title={t('userManagementPage.changeRole', 'Change role')}>
              <SecurityIcon fontSize="small" color={params.row.role === 'OWNER' ? 'disabled' : 'primary'} />
            </Tooltip>
          }
          label="Change role"
          onClick={() => openRoleDialog(params.row)}
          disabled={params.row.role === 'OWNER'}
        />,
      ],
    },
  ], [handleStatusChange, t]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>
            Team & Access
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px', mt: 0.25 }}>
            {t('userManagementPage.title', 'Users')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage the people who can access this shop, their roles, and their sign-in status.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Invite by email is coming with Phase 5 — for now, create accounts directly." arrow>
            <span>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={openCreateDialog}
                disabled={actionLoading}
                sx={{ py: 1.15, px: 2.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
              >
                Add user
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Stats Row */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total users', value: stats.total, icon: <GroupIcon />, color: 'primary.main' },
          { label: 'Active', value: stats.active, icon: <CheckCircleIcon />, color: 'success.main' },
          { label: 'Inactive', value: stats.inactive, icon: <CancelIcon />, color: 'warning.main' },
          { label: 'Admins & owners', value: stats.admins, icon: <AdminPanelSettingsIcon />, color: 'secondary.main' },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: 'transparent', color: s.color, border: '1px solid', borderColor: 'divider', width: 40, height: 40 }}>
                  {s.icon}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>{s.label}</Typography>
                  <Typography variant="h5" fontWeight={800}>{loading ? '—' : s.value}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Toolbar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            placeholder="Search by name, username, or email"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="disabled" />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: { md: 360 } }}
          />
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Role</Typography>
            <ToggleButtonGroup
              value={roleFilter}
              exclusive
              size="small"
              onChange={(_, v) => v && setRoleFilter(v)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5 } }}
            >
              <ToggleButton value="ALL">All</ToggleButton>
              <ToggleButton value="OWNER">Owner</ToggleButton>
              <ToggleButton value="ADMIN">Admin</ToggleButton>
              <ToggleButton value="STAFF">Staff</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Status</Typography>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              size="small"
              onChange={(_, v) => v && setStatusFilter(v)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5 } }}
            >
              <ToggleButton value="ALL">All</ToggleButton>
              <ToggleButton value="ACTIVE">Active</ToggleButton>
              <ToggleButton value="INACTIVE">Inactive</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Paper>

      {/* Data grid */}
      <Paper variant="outlined" sx={{ height: '65vh', width: '100%', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          getRowHeight={() => 64}
          disableRowSelectionOnClick
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          slots={{
            loadingOverlay: () => (
              <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                <CircularProgress size={28} />
              </Stack>
            ),
            noRowsOverlay: () => (
              <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ height: '100%', p: 4 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 56, height: 56 }}>
                  <GroupIcon />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>No users match your filters</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, textAlign: 'center' }}>
                  Adjust the search, role or status filters — or add a new team member.
                </Typography>
                <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openCreateDialog} sx={{ textTransform: 'none', mt: 1 }}>
                  Add user
                </Button>
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

      {/* Create Dialog */}
      <Dialog open={dialogMode === 'create'} onClose={handleDialogClose} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack>
            <Typography variant="h6" fontWeight={800}>Add a team member</Typography>
            <Typography variant="caption" color="text.secondary">
              Create their account and share the credentials over a secure channel.
            </Typography>
          </Stack>
          <IconButton onClick={handleDialogClose} aria-label="Close dialog" size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>Personal details</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField autoFocus required fullWidth
                    label={t('userManagementPage.firstName', 'First name')} name="firstName"
                    value={formData.firstName || ''} onChange={handleFormChange}
                    error={!!formErrors.firstName} helperText={formErrors.firstName} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth
                    label={t('userManagementPage.lastName', 'Last name')} name="lastName"
                    value={formData.lastName || ''} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField required fullWidth type="email"
                    label={t('userManagementPage.email', 'Email')} name="email"
                    autoComplete="email"
                    value={formData.email || ''} onChange={handleFormChange}
                    error={!!formErrors.email} helperText={formErrors.email} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField required fullWidth
                    label={t('userManagementPage.phone', 'Mobile number')} name="phone"
                    autoComplete="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleFormChange({ target: { name: 'phone', value: e.target.value.replace(/\D/g, '').slice(0, 15) } })}
                    error={!!formErrors.phone} helperText={formErrors.phone} />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>Sign-in credentials</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField required fullWidth
                    label={t('userManagementPage.username', 'Username')} name="username"
                    autoComplete="username"
                    value={formData.username || ''} onChange={handleFormChange}
                    error={!!formErrors.username} helperText={formErrors.username} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <PasswordField required fullWidth
                    label={t('userManagementPage.password', 'Temporary password')} name="password"
                    autoComplete="new-password"
                    value={formData.password || ''} onChange={handleFormChange}
                    error={!!formErrors.password} helperText={formErrors.password}
                    showStartIcon={false} />
                </Grid>
                <Grid item xs={12}>
                  <PasswordStrengthMeter value={formData.password || ''} />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" variant="outlined" icon={<InfoOutlinedIcon />}>
                    Share this temporary password with the user through a secure channel. They will be prompted to change it after their first sign-in (coming with the enterprise onboarding flow).
                  </Alert>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>Access & role</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('userManagementPage.role', 'Role')}</InputLabel>
                    <Select
                      name="role"
                      value={formData.role || 'STAFF'}
                      label={t('userManagementPage.role', 'Role')}
                      onChange={handleFormChange}
                    >
                      {ROLES.map((role) => (
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('userManagementPage.shop', 'Shop')}</InputLabel>
                    <Select name="shopId" value={formData.shopId || ''} label={t('userManagementPage.shop', 'Shop')} onChange={handleFormChange}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {shops.map((shop) => (
                        <MenuItem key={shop.id} value={shop.id}>{shop.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  {formData.role && ROLE_META[formData.role] && (
                    <Alert severity="info" variant="outlined" icon={ROLE_META[formData.role].icon}>
                      <strong>{formData.role}</strong> — {ROLE_META[formData.role].description}
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleDialogClose} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            disabled={actionLoading}
            sx={{ textTransform: 'none', fontWeight: 700, minWidth: 140 }}
          >
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Create user'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={dialogMode === 'edit'} onClose={handleDialogClose} maxWidth="sm" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack>
            <Typography variant="h6" fontWeight={800}>Edit user</Typography>
            <Typography variant="caption" color="text.secondary">
              @{selectedUser?.username}
            </Typography>
          </Stack>
          <IconButton onClick={handleDialogClose} aria-label="Close dialog" size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField autoFocus required fullWidth label={t('userManagementPage.firstName', 'First name')} name="firstName"
                value={formData.firstName || ''} onChange={handleFormChange}
                error={!!formErrors.firstName} helperText={formErrors.firstName} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('userManagementPage.lastName', 'Last name')} name="lastName"
                value={formData.lastName || ''} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField required fullWidth type="email" label={t('userManagementPage.email', 'Email')} name="email"
                value={formData.email || ''} onChange={handleFormChange}
                error={!!formErrors.email} helperText={formErrors.email} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField required fullWidth label={t('userManagementPage.phone', 'Mobile number')} name="phone"
                value={formData.phone || ''} onChange={handleFormChange}
                error={!!formErrors.phone} helperText={formErrors.phone} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('userManagementPage.shop', 'Shop')}</InputLabel>
                <Select name="shopId" value={formData.shopId || ''} label={t('userManagementPage.shop', 'Shop')} onChange={handleFormChange}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {shops.map((shop) => (
                    <MenuItem key={shop.id} value={shop.id}>{shop.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleDialogClose} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleUpdateUser} variant="contained" disabled={actionLoading}
            sx={{ textTransform: 'none', fontWeight: 700, minWidth: 140 }}>
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={dialogMode === 'role'} onClose={handleDialogClose} maxWidth="xs" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack>
            <Typography variant="h6" fontWeight={800}>Change role</Typography>
            <Typography variant="caption" color="text.secondary">
              @{selectedUser?.username}
            </Typography>
          </Stack>
          <IconButton onClick={handleDialogClose} aria-label="Close dialog" size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ minWidth: 320 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select name="role" value={formData.role || ''} label="Role" onChange={handleFormChange}>
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.role && ROLE_META[formData.role] && (
              <Alert severity="info" variant="outlined" icon={ROLE_META[formData.role].icon}>
                <strong>{formData.role}</strong> — {ROLE_META[formData.role].description}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleDialogClose} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleRoleChange} variant="contained" disabled={actionLoading}
            sx={{ textTransform: 'none', fontWeight: 700, minWidth: 140 }}>
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagementPage;
