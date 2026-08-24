import React, { useState, useEffect } from 'react';
import {
  Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  Snackbar, Alert, Typography, MenuItem, Chip, Grid, Card, CardContent
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import * as api from '../../services/api';

export default function HolidayCalendar() {
  const [holidays, setHolidays] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [dialog, setDialog] = useState({
    open: false,
    mode: 'add',
    data: { name: '', date: '', type: 'NATIONAL', description: '' }
  });

  useEffect(() => { fetchHolidays(); }, [year]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      // TODO: Implement getHolidayCalendar API call
      const mockData = [
        { id: 1, name: 'Independence Day', date: '2026-08-15', type: 'NATIONAL', description: 'National Holiday' },
        { id: 2, name: 'Janmashtami', date: '2026-08-30', type: 'RELIGIOUS', description: 'Hindu Festival' },
      ];
      setHolidays(mockData);
    } catch (err) {
      showToast('Failed to load holidays', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const handleOpenDialog = (mode, holiday = null) => {
    setDialog({
      open: true,
      mode,
      data: holiday || { name: '', date: '', type: 'NATIONAL', description: '' }
    });
  };

  const handleSaveHoliday = async () => {
    if (!dialog.data.name || !dialog.data.date) {
      showToast('Please enter holiday name and date', 'error');
      return;
    }

    try {
      setLoading(true);
      if (dialog.mode === 'add') {
        // TODO: Call createHolidayCalendar API
        showToast('Holiday added successfully');
      } else {
        // TODO: Call updateHolidayCalendar API
        showToast('Holiday updated successfully');
      }
      setDialog({ open: false, mode: 'add', data: {} });
      fetchHolidays();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save holiday', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;

    try {
      setLoading(true);
      // TODO: Call deleteHolidayCalendar API
      showToast('Holiday deleted successfully');
      fetchHolidays();
    } catch (err) {
      showToast('Failed to delete holiday', 'error');
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

  if (loading && holidays.length === 0) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress />
    </Box>
  );

  const holidaysByMonth = holidays.reduce((acc, h) => {
    const month = new Date(h.date).toLocaleDateString('en-IN', { month: 'long' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(h);
    return acc;
  }, {});

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Holiday Calendar</Typography>
          <Typography variant="body2" color="text.secondary">Configure national and regional holidays</Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            size="small"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            sx={{ width: 120 }}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('add')}
          >
            Add Holiday
          </Button>
        </Stack>
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
                Total Holidays ({year})
              </Typography>
              <Typography variant="h6">{holidays.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                National Holidays
              </Typography>
              <Typography variant="h6">{holidays.filter(h => h.type === 'NATIONAL').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Regional Holidays
              </Typography>
              <Typography variant="h6">{holidays.filter(h => h.type === 'RELIGIOUS' || h.type === 'REGIONAL').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {holidays.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          No holidays configured for {year}. Click "Add Holiday" to create one.
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Holiday Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Day</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holidays.map(holiday => {
                const date = new Date(holiday.date);
                const dayName = date.toLocaleDateString('en-IN', { weekday: 'long' });

                return (
                  <TableRow key={holiday.id} hover>
                    <TableCell fontWeight={600}>{holiday.name}</TableCell>
                    <TableCell>{new Date(holiday.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{dayName}</TableCell>
                    <TableCell>
                      <Chip
                        label={holiday.type}
                        size="small"
                        color={holiday.type === 'NATIONAL' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{holiday.description}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog('edit', holiday)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteHoliday(holiday.id)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.mode === 'add' ? 'Add Holiday' : 'Edit Holiday'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Holiday Name"
              fullWidth
              value={dialog.data.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={dialog.data.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Type"
              fullWidth
              value={dialog.data.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
            >
              <MenuItem value="NATIONAL">National Holiday</MenuItem>
              <MenuItem value="RELIGIOUS">Religious Festival</MenuItem>
              <MenuItem value="REGIONAL">Regional Holiday</MenuItem>
              <MenuItem value="OPTIONAL">Optional Holiday</MenuItem>
            </TextField>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={dialog.data.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveHoliday}
            disabled={loading}
          >
            {dialog.mode === 'add' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
