import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, 
  TableBody, TableContainer, Chip, TextField, InputAdornment, 
  Stack, IconButton, Tooltip, TablePagination, Alert
} from '@mui/material';
import { 
  Search, FilterList, History, Person, 
  DeleteForever, Edit, Login, AddCircle 
} from '@mui/icons-material';
import dayjs from 'dayjs';

// Helper to get color/icon based on action type
const getActionStyle = (action) => {
  const act = action.toLowerCase();
  if (act.includes('delete')) return { color: 'error', icon: <DeleteForever fontSize="small" /> };
  if (act.includes('update') || act.includes('edit')) return { color: 'warning', icon: <Edit fontSize="small" /> };
  if (act.includes('create') || act.includes('add')) return { color: 'success', icon: <AddCircle fontSize="small" /> };
  if (act.includes('login')) return { color: 'info', icon: <Login fontSize="small" /> };
  return { color: 'default', icon: <History fontSize="small" /> };
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([
    // Mock Data - In production, fetch from /api/audit-logs
    { id: 1, timestamp: '2026-02-02 10:30:15', user: 'Admin', action: 'Delete Invoice', module: 'Sales', details: 'Deleted INV-9902 (₹4,500)', ip: '192.168.1.1' },
    { id: 2, timestamp: '2026-02-02 11:15:00', user: 'Manager', action: 'Update Stock', module: 'Inventory', details: 'Item "Laptop" qty changed: 10 -> 15', ip: '192.168.1.5' },
    { id: 3, timestamp: '2026-02-02 12:05:22', user: 'Cashier', action: 'Create Sale', module: 'Point of Sale', details: 'New Invoice INV-9905 created', ip: '10.0.0.24' },
    { id: 4, timestamp: '2026-02-02 09:00:01', user: 'Admin', action: 'User Login', module: 'Auth', details: 'Successful login from Chrome Windows', ip: '192.168.1.1' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a">Security Audit Logs</Typography>
          <Typography color="text.secondary">Real-time trail of all system activities and modifications.</Typography>
        </Box>
        <Tooltip title="Filter Settings">
          <IconButton sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}><FilterList /></IconButton>
        </Tooltip>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Logs are read-only and cannot be modified by any user, including Administrators.
      </Alert>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Table Search Bar */}
        <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
          <TextField
            placeholder="Filter by user, action, or details..."
            fullWidth
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Module</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Activity Details</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => {
                const style = getActionStyle(log.action);
                return (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" fontWeight={600}>
                        {dayjs(log.timestamp).format('DD MMM, hh:mm A')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{log.user}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={style.icon} 
                        label={log.action} 
                        size="small" 
                        color={style.color} 
                        variant="soft" // If using MUI Lab, or use custom sx below
                        sx={{ fontWeight: 700, px: 1 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1 }}>
                        {log.module}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                        {log.details}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace" color="text.disabled">
                        {log.ip}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  );
}