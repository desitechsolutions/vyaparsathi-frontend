import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Switch, TextField, 
  InputAdornment, Stack, Avatar, Button, Tooltip, Badge, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, 
  InputLabel, Select, MenuItem as SelectItem
} from '@mui/material';
import {
  Search,
  PersonAdd,
  AdminPanelSettings,
  Security,
  VpnKey,
  MoreVert,
  Mail,
  Shield,
  Edit,
  DeleteForever,
  History,
  Close,
  FilterList
} from '@mui/icons-material';

// --- MOCK DATA ---
const INITIAL_USERS = [
  { id: 1, name: "Aman Deshmukh", email: "aman.admin@desitech.com", role: "SUPER_ADMIN", status: "ACTIVE", lastLogin: "2026-02-18T10:30:00", twoFactor: true, avatar: "AD", online: true },
  { id: 2, name: "Sriya Sharma", email: "sriya.support@desitech.com", role: "SUPPORT_AGENT", status: "ACTIVE", lastLogin: "2026-02-18T12:15:00", twoFactor: true, avatar: "SS", online: true },
  { id: 3, name: "Rahul Varma", email: "rahul.finance@desitech.com", role: "FINANCE_MANAGER", status: "INACTIVE", lastLogin: "2026-02-10T09:00:00", twoFactor: false, avatar: "RV", online: false }
];

export const SystemUserManagement = () => {
  // --- STATE ---
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'SUPPORT_AGENT' });

  // --- HANDLERS ---
  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleToggleStatus = (id) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : user
    ));
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;

    const userToAdd = {
      ...newUser,
      id: Date.now(),
      status: 'ACTIVE',
      lastLogin: new Date().toISOString(),
      twoFactor: false,
      avatar: newUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      online: false
    };

    setUsers([userToAdd, ...users]);
    setOpenModal(false);
    setNewUser({ name: '', email: '', role: 'SUPPORT_AGENT' });
  };

  const handleDeleteUser = () => {
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    handleMenuClose();
  };

  // --- HELPERS ---
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(search.toLowerCase()) || 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.role.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);

  const getRoleConfig = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return { color: '#f43f5e', icon: <AdminPanelSettings fontSize="inherit" />, label: 'Super Admin' };
      case 'SUPPORT_AGENT': return { color: '#38bdf8', icon: <Security fontSize="inherit" />, label: 'Support' };
      case 'FINANCE_MANAGER': return { color: '#fbbf24', icon: <Shield fontSize="inherit" />, label: 'Finance' };
      default: return { color: '#94a3b8', icon: <Shield fontSize="inherit" />, label: 'User' };
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#0f172a', minHeight: '100vh', color: 'white' }}>
      
      {/* Header Section */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.5px', color: '#f8fafc' }}>
            System Users
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
            Manage internal platform access, roles, and security protocols
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<PersonAdd />}
          onClick={() => setOpenModal(true)}
          sx={{ 
            bgcolor: '#ec4899', 
            borderRadius: '12px', 
            px: 3, 
            py: 1.2, 
            fontWeight: 700,
            boxShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.39)',
            '&:hover': { bgcolor: '#db2777' } 
          }}
        >
          Add Internal User
        </Button>
      </Stack>

      {/* Control Bar */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#1e293b', borderRadius: '16px', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255,255,255,0.3)' }} />
                </InputAdornment>
              ),
              sx: { 
                color: 'white', 
                bgcolor: '#0f172a', 
                borderRadius: '10px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2) !important' }
              }
            }}
          />
          <Button startIcon={<FilterList />} sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'none' }}>Filters</Button>
        </Stack>
      </Paper>

      {/* Table Section */}
      <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', borderRadius: '20px', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
            <TableRow>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>USER INFO</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ROLE / ACCESS</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>SECURITY</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>LAST LOGIN</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>STATUS</TableCell>
              <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length > 0 ? filteredUsers.map((user) => {
              const roleConfig = getRoleConfig(user.role);
              return (
                <TableRow key={user.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Badge 
                        overlap="circular" 
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        sx={{ '& .MuiBadge-badge': { bgcolor: user.online ? '#4ade80' : '#64748b', border: '2px solid #1e293b' } }}
                      >
                        <Avatar sx={{ bgcolor: roleConfig.color, fontWeight: 700, borderRadius: '12px', fontSize: '0.9rem' }}>{user.avatar}</Avatar>
                      </Badge>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>{user.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Mail sx={{ fontSize: 12 }} /> {user.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Chip 
                      icon={roleConfig.icon}
                      label={roleConfig.label} 
                      size="small" 
                      sx={{ 
                        bgcolor: `${roleConfig.color}15`, 
                        color: roleConfig.color, 
                        fontWeight: 800,
                        border: `1px solid ${roleConfig.color}30`,
                        fontSize: '0.7rem'
                      }} 
                    />
                  </TableCell>

                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Tooltip title={user.twoFactor ? "2FA Enabled" : "2FA Disabled"}>
                      <IconButton size="small">
                        <VpnKey sx={{ color: user.twoFactor ? '#4ade80' : '#ef4444', fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>

                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="caption" sx={{ color: 'white', opacity: 0.8, fontWeight: 600 }}>
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
                      at {new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Switch 
                        checked={user.status === 'ACTIVE'}
                        onChange={() => handleToggleStatus(user.id)}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#4ade80' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4ade80' }
                        }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: user.status === 'ACTIVE' ? '#4ade80' : '#ef4444', minWidth: '55px' }}>
                        {user.status}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <IconButton sx={{ color: 'rgba(255,255,255,0.3)' }} size="small" onClick={(e) => handleMenuOpen(e, user)}>
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'rgba(255,255,255,0.3)' }}>
                  No users match your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { 
            bgcolor: '#1e293b', 
            color: 'white', 
            minWidth: 150,
            border: '1px solid rgba(255,255,255,0.05)',
            backgroundImage: 'none',
            '& .MuiMenuItem-root': { fontSize: '0.85rem', gap: 1.5 }
          }
        }}
      >
        <MenuItem onClick={handleMenuClose}><Edit fontSize="small" /> Edit Profile</MenuItem>
        <MenuItem onClick={handleMenuClose}><History fontSize="small" /> Activity Logs</MenuItem>
        <MenuItem onClick={handleDeleteUser} sx={{ color: '#ef4444' }}><DeleteForever fontSize="small" /> Terminate Access</MenuItem>
      </Menu>

      {/* Add User Dialog */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        PaperProps={{ sx: { bgcolor: '#1e293b', color: 'white', borderRadius: '16px', minWidth: '400px', backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add Internal User
          <IconButton onClick={() => setOpenModal(false)} sx={{ color: 'gray' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField 
              fullWidth label="Full Name" variant="outlined" 
              value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }, '& label': { color: 'rgba(255,255,255,0.5)' } }} 
            />
            <TextField 
              fullWidth label="Email Address" variant="outlined"
              value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }, '& label': { color: 'rgba(255,255,255,0.5)' } }} 
            />
            <FormControl fullWidth sx={{ '& label': { color: 'rgba(255,255,255,0.5)' } }}>
              <InputLabel>Role</InputLabel>
              <Select 
                label="Role"
                value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
              >
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="SUPPORT_AGENT">Support Agent</SelectItem>
                <SelectItem value="FINANCE_MANAGER">Finance Manager</SelectItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenModal(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancel</Button>
          <Button onClick={handleAddUser} variant="contained" disabled={!newUser.name || !newUser.email} sx={{ bgcolor: '#ec4899', fontWeight: 700, '&:hover': { bgcolor: '#db2777' } }}>
            Confirm Access
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemUserManagement;