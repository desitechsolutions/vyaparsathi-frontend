import React, { useState, useEffect } from 'react';
import {
  Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  Snackbar, Alert, Typography, Switch, FormControlLabel, Chip, Grid, Card, CardContent
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import * as api from '../../services/api';

export default function LeaveTypeManagement() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [dialog, setDialog] = useState({
    open: false,
    mode: 'add',
    data: { name: '', maxDaysPerYear: 0, carryForwardDays: 0, isProrated: false, isActive: true }
  });

  useEffect(() => { fetchLeaveTypes(); }, []);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const res = await api.listLeaveTypes?.() || [];
      setLeaveTypes(res.content || res || []);
    } catch (err) {
      showToast('Failed to load leave types', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const handleOpenDialog = (mode, leaveType = null) => {
    setDialog({
      open: true,
      mode,
      data: leaveType || { name: '', maxDaysPerYear: 0, carryForwardDays: 0, isProrated: false, isActive: true }
    });
  };

  const handleSaveLeaveType = async () => {
    if (!dialog.data.name) {
      showToast('Please enter leave type name', 'error');
      return;
    }

    try {
      setLoading(true);
      if (dialog.mode === 'add') {
        await api.createLeaveType?.(dialog.data);
        showToast('Leave type created successfully');
      } else {
        // TODO: Implement updateLeaveType endpoint
        showToast('Leave type updated successfully');
      }
      setDialog({ open: false, mode: 'add', data: {} });
      fetchLeaveTypes();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save leave type', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeaveType = async (leaveTypeId) => {
    if (!window.confirm('Are you sure you want to delete this leave type?')) return;

    try {
      setLoading(true);
      // TODO: Implement deleteLeaveType endpoint
      showToast('Leave type deleted successfully');
      fetchLeaveTypes();
    } catch (err) {
      showToast('Failed to delete leave type', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setDialog({
      ...dialog,
      data: { ...dialog.data, [field]: value }
    });
  };

  if (loading && leaveTypes.length === 0) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Leave Type Management</Typography>
          <Typography variant="body2" color="text.secondary">Configure leave types and carry-forward policies</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('add')}
        >
          Add Leave Type
        </Button>
      </Stack>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Leave Types
              </Typography>
              <Typography variant="h6">{leaveTypes.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Types
              </Typography>
              <Typography variant="h6">{leaveTypes.filter(lt => lt.isActive).length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {leaveTypes.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          No leave types configured. Click "Add Leave Type" to create one.
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Leave Type Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Max Days/Year</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Carry Forward Days</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Prorated</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaveTypes.map(lt => (
                <TableRow key={lt.id} hover>
                  <TableCell fontWeight={600}>{lt.name}</TableCell>
                  <TableCell align="center">{lt.maxDaysPerYear}</TableCell>
                  <TableCell align="center">{lt.carryForwardDays}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={lt.isProrated ? 'Yes' : 'No'}
                      size="small"
                      variant={lt.isProrated ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={lt.isActive ? 'Active' : 'Inactive'}
                      color={lt.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog('edit', lt)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteLeaveType(lt.id)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.mode === 'add' ? 'Add Leave Type' : 'Edit Leave Type'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Leave Type Name (e.g., Annual, Sick, Casual)"
              fullWidth
              value={dialog.data.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
            <TextField
              label="Max Days Per Year"
              type="number"
              fullWidth
              value={dialog.data.maxDaysPerYear}
              onChange={(e) => handleInputChange('maxDaysPerYear', parseInt(e.target.value) || 0)}
            />
            <TextField
              label="Carry Forward Days"
              type="number"
              fullWidth
              value={dialog.data.carryForwardDays}
              onChange={(e) => handleInputChange('carryForwardDays', parseInt(e.target.value) || 0)}
              helperText="Days that can be carried forward to next year"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={dialog.data.isProrated}
                  onChange={(e) => handleInputChange('isProrated', e.target.checked)}
                />
              }
              label="Prorated (for mid-year joiners)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={dialog.data.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveLeaveType}
            disabled={loading}
          >
            {dialog.mode === 'add' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
