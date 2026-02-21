import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, CircularProgress, Snackbar, Alert, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
    InputLabel, Select, MenuItem, Switch, FormControlLabel, Tooltip, Grid
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import {
    fetchUsers, adminCreateUser, updateUser, updateUserStatus, updateUserRole, fetchShop
} from '../services/api';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [dialogMode, setDialogMode] = useState(null); // 'create', 'edit', 'role'
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({});
    const [formErrors, setFormErrors] = useState({});

    const ROLES = ['STAFF', 'ADMIN'];

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersData, shopsResponse] = await Promise.all([fetchUsers(), fetchShop()]);
            setUsers(usersData);
            const shopData = shopsResponse.data;
            setShops(Array.isArray(shopData) ? shopData : (shopData ? [shopData] : []));
        } catch (error) {
            console.error("Data Load Error:", error);
            setSnackbar({ open: true, message: 'Failed to load page data.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

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
            if (!formData.username) errors.username = "Username is required";
            if (!formData.pin || formData.pin.length < 4) errors.pin = "PIN must be at least 4 digits";
            if (!formData.phone || !phoneRegex.test(formData.phone)) errors.phone = "Valid 10-15 digit phone is required";
        }

        if (!formData.firstName) errors.firstName = "First name is required";
        if (formData.email && !emailRegex.test(formData.email)) errors.email = "Invalid email format";
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const openCreateDialog = () => {
        setFormData({ username: '', pin: '', role: 'STAFF', firstName: '', lastName: '', email: '', phone: '', shopId: '' });
        setDialogMode('create');
    };

    const openEditDialog = (user) => {
        setSelectedUser(user);
        setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            shopId: user.shopId || ''
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
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleCreateUser = async () => {
        if (!validateForm()) return;
        try {
            setActionLoading(true);
            const createdUser = await adminCreateUser(formData);
            setUsers(prev => [...prev, createdUser]);
            setSnackbar({ open: true, message: 'User created successfully.', severity: 'success' });
            handleDialogClose();
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to create user.', severity: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser || !validateForm()) return;
        try {
            setActionLoading(true);
            const updatedUser = await updateUser(selectedUser.id, formData);
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
            setSnackbar({ open: true, message: 'User updated successfully.', severity: 'success' });
            handleDialogClose();
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to update user.', severity: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRoleChange = async () => {
        if (!selectedUser) return;
        try {
            setActionLoading(true);
            const updatedUser = await updateUserRole(selectedUser.id, formData.role);
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
            setSnackbar({ open: true, message: 'User role updated successfully.', severity: 'success' });
            handleDialogClose();
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to update role.', severity: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusChange = async (userId, currentStatus) => {
        try {
            const updatedUser = await updateUserStatus(userId, !currentStatus);
            setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            setSnackbar({ open: true, message: 'User status updated successfully.', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to update status.', severity: 'error' });
        }
    };

    const columns = useMemo(() => [
        { 
            field: 'name', 
            headerName: 'Name', 
            flex: 1.5, 
            minWidth: 180, 
            renderCell: ({ row }) => (
                <Box py={1}>
                    <Typography variant="body2" fontWeight="bold">
                        {`${row.firstName || ''} ${row.lastName || ''}`.trim() || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{row.username}</Typography>
                </Box>
            ) 
        },
        { 
            field: 'email', 
            headerName: 'Contact & Shop', 
            flex: 1.5, 
            minWidth: 200, 
            renderCell: ({ row }) => (
                <Box py={1}>
                    <Typography variant="body2">{row.email || 'No Email'}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.shopName || 'No Shop Assigned'}</Typography>
                </Box>
            ) 
        },
        { 
            field: 'role', 
            headerName: 'Role', 
            flex: 1, 
            minWidth: 130, 
            renderCell: ({ value }) => {
                const color = value === 'OWNER' ? 'secondary' : value === 'ADMIN' ? 'primary' : 'default';
                return <Chip label={value} color={color} size="small" icon={<VpnKeyIcon />} sx={{ fontWeight: 'bold' }} />;
            } 
        },
        { 
            field: 'createdAt', 
            headerName: 'Created On', 
            flex: 1, 
            minWidth: 120, 
            renderCell: ({ value }) => <Typography variant="body2">{new Date(value).toLocaleDateString()}</Typography> 
        },
        { 
            field: 'active', 
            headerName: 'Status', 
            width: 150, 
            renderCell: (params) => (
                <FormControlLabel 
                    control={
                        <Switch 
                            checked={params.value} 
                            onChange={() => handleStatusChange(params.id, params.value)} 
                            disabled={params.row.role === 'OWNER'} 
                            color="success" 
                        />
                    } 
                    label={params.value ? 'Active' : 'Inactive'} 
                    sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }}
                />
            ) 
        },
        { 
            field: 'actions', 
            type: 'actions', 
            width: 120, 
            getActions: (params) => [
                <GridActionsCellItem icon={<Tooltip title="Edit Details"><EditIcon /></Tooltip>} label="Edit" onClick={() => openEditDialog(params.row)} />,
                <GridActionsCellItem 
                    icon={<Tooltip title="Change Role"><SecurityIcon color={params.row.role === 'OWNER' ? 'disabled' : 'primary'} /></Tooltip>} 
                    label="Change Role" 
                    onClick={() => openRoleDialog(params.row)} 
                    disabled={params.row.role === 'OWNER'} 
                />
            ]
        },
    ], [handleStatusChange]);

    return (
        <Box p={3} bgcolor="#f4f6f8" minHeight="100vh">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold">User Management</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<PersonAddIcon />} 
                    onClick={openCreateDialog}
                    disabled={actionLoading}
                >
                    Create User
                </Button>
            </Box>

            <Paper sx={{ height: '75vh', width: '100%', borderRadius: 2 }}>
                <DataGrid 
                    rows={users} 
                    columns={columns} 
                    loading={loading} 
                    getRowId={(row) => row.id} 
                    disableRowSelectionOnClick
                    slots={{ loadingOverlay: CircularProgress }} 
                />
            </Paper>

            {/* Create Dialog */}
            <Dialog open={dialogMode === 'create'} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>Create New User</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField autoFocus required label="First Name" name="firstName" fullWidth value={formData.firstName || ''} onChange={handleFormChange} error={!!formErrors.firstName} helperText={formErrors.firstName} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField required label="Last Name" name="lastName" fullWidth value={formData.lastName || ''} onChange={handleFormChange} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField required label="Email" name="email" type="email" fullWidth value={formData.email || ''} onChange={handleFormChange} error={!!formErrors.email} helperText={formErrors.email} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField required label="Phone Number" name="phone" fullWidth value={formData.phone || ''} onChange={handleFormChange} error={!!formErrors.phone} helperText={formErrors.phone} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField required label="Username" name="username" fullWidth value={formData.username || ''} onChange={handleFormChange} error={!!formErrors.username} helperText={formErrors.username} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField required label="Initial PIN" name="pin" type="password" fullWidth value={formData.pin || ''} onChange={handleFormChange} error={!!formErrors.pin} helperText={formErrors.pin} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Role</InputLabel>
                                <Select name="role" value={formData.role || 'STAFF'} label="Role" onChange={handleFormChange}>
                                    {ROLES.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Assign to Shop</InputLabel>
                                <Select name="shopId" value={formData.shopId || ''} label="Assign to Shop" onChange={handleFormChange}>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {shops.map(shop => <MenuItem key={shop.id} value={shop.id}>{shop.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button onClick={handleCreateUser} variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={dialogMode === 'edit'} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField autoFocus required label="First Name" name="firstName" fullWidth value={formData.firstName || ''} onChange={handleFormChange} error={!!formErrors.firstName} helperText={formErrors.firstName} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField required label="Last Name" name="lastName" fullWidth value={formData.lastName || ''} onChange={handleFormChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField required label="Email" name="email" type="email" fullWidth value={formData.email || ''} onChange={handleFormChange} error={!!formErrors.email} helperText={formErrors.email} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField required label="Phone Number" name="phone" fullWidth value={formData.phone || ''} onChange={handleFormChange} error={!!formErrors.phone} helperText={formErrors.phone} />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Assign to Shop</InputLabel>
                                <Select name="shopId" value={formData.shopId || ''} label="Assign to Shop" onChange={handleFormChange}>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {shops.map(shop => <MenuItem key={shop.id} value={shop.id}>{shop.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button onClick={handleUpdateUser} variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Role Dialog */}
            <Dialog open={dialogMode === 'role'} onClose={handleDialogClose}>
                <DialogTitle>Change Role for {selectedUser?.username}</DialogTitle>
                <DialogContent sx={{ minWidth: 320 }}>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Role</InputLabel>
                        <Select name="role" value={formData.role || ''} label="Role" onChange={handleFormChange}>
                            {ROLES.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button onClick={handleRoleChange} variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : 'Save'}
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