import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, 
  TableBody, TableContainer, Chip, TextField, InputAdornment, 
  Stack, IconButton, Tooltip, TablePagination, Alert, LinearProgress, Button
} from '@mui/material';
import { 
  Search, History, Person, DeleteForever, Edit, Login, 
  AddCircle, LaptopMac, FileDownload, Close 
} from '@mui/icons-material';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
// Make sure all three are exported from your api.js
import { fetchAuditLogs, exportAuditLogs, fetchAuditLogsByUser } from '../services/api';
import { useTranslation } from 'react-i18next';

dayjs.extend(isBetween);

const getActionStyle = (action) => {
  const act = action ? action.toLowerCase() : '';
  if (act.includes('delete') || act.includes('cancel')) return { color: 'error', icon: <DeleteForever fontSize="small" /> };
  if (act.includes('update') || act.includes('edit')) return { color: 'warning', icon: <Edit fontSize="small" /> };
  if (act.includes('create') || act.includes('add') || act.includes('complete')) return { color: 'success', icon: <AddCircle fontSize="small" /> };
  if (act.includes('login')) return { color: 'info', icon: <Login fontSize="small" /> };
  return { color: 'default', icon: <History fontSize="small" /> };
};

export default function AuditLogs() {
  const { t } = useTranslation();
  // State definitions must always be at the top level
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  // Define the general loader
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page,
        size: rowsPerPage,
        startDate: dayjs(startDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
        endDate: dayjs(endDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      };
      const response = await fetchAuditLogs(params);
      setLogs(response.content || []);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error("General fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, startDate, endDate]);

  // Define the user-specific loader
  const loadUserLogs = useCallback(async (username) => {
    setLoading(true);
    try {
      const data = await fetchAuditLogsByUser(username);
      setLogs(data || []);
      setTotalElements(data ? data.length : 0);
      setPage(0);
    } catch (error) {
      console.error("User fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch general logs when page/dates/rows change
  useEffect(() => {
    if (!selectedUser) {
      loadLogs();
    }
  }, [page, rowsPerPage, startDate, endDate, selectedUser, loadLogs]);

  // Re-fetch user-specific logs ONLY when the selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      loadUserLogs(selectedUser);
    }
  }, [selectedUser, loadUserLogs]);

  const handleExport = async (format) => {
    try {
      const params = {
        startDate: dayjs(startDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
        endDate: dayjs(endDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
        format
      };
      const blob = await exportAuditLogs(params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Audit_Report_${dayjs().format('YYYYMMDD')}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (log.action?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (log.details?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (selectedUser) {
      const logDate = dayjs(log.timestamp);
      const start = dayjs(startDate).startOf('day');
      const end = dayjs(endDate).endOf('day');
      return logDate.isBetween(start, end, 'day', '[]');
    }
    
    return true;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-start" mb={4} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a">{t('auditLogsPage.title')}</Typography>
          <Typography color="text.secondary">
            {selectedUser ? `Activity Trail for: ${selectedUser}` : t('auditLogsPage.subtitle')}
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1.5} alignItems="center">
          {selectedUser && (
            <Button 
              size="small" 
              variant="outlined" 
              color="error" 
              startIcon={<Close />} 
              onClick={() => setSelectedUser(null)}
            >
              Reset
            </Button>
          )}
          <TextField
            type="date"
            size="small"
            label="From"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            sx={{ bgcolor: 'background.paper' }}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            sx={{ bgcolor: 'background.paper' }}
          />
          <Tooltip title="Export to Excel">
            <IconButton onClick={() => handleExport('excel')} sx={{ bgcolor: 'background.paper', border: '1px solid' }}>
              <FileDownload color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={selectedUser ? () => loadUserLogs(selectedUser) : loadLogs} sx={{ bgcolor: 'background.paper', border: '1px solid' }}>
              <History />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Logs are read-only and cannot be modified by any user, including Administrators.
      </Alert>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', overflow: 'hidden' }}>
        {loading && <LinearProgress color="primary" />}
        
        <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
          <TextField
            placeholder={t('auditLogsPage.searchPlaceholder')}
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
                <TableCell sx={{ fontWeight: 800, bgcolor: 'background.default' }}>{t('auditLogsPage.columns.timestamp')}</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: 'background.default' }}>{t('auditLogsPage.columns.user')}</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: 'background.default' }}>{t('auditLogsPage.columns.action')}</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: 'background.default' }}>{t('auditLogsPage.columns.entity')}</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: 'background.default' }}>{t('auditLogsPage.columns.details')}</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: 'background.default' }}>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs
                .slice(selectedUser ? page * rowsPerPage : 0, selectedUser ? (page + 1) * rowsPerPage : filteredLogs.length)
                .map((log) => (
                  <TableRow key={log.id || `${log.timestamp}-${log.username}-${log.action}`} hover>
                    <TableCell>{dayjs(log.timestamp).format('DD MMM, hh:mm A')}</TableCell>
                    <TableCell>
                      <Stack 
                        direction="row" spacing={1} alignItems="center"
                        onClick={() => setSelectedUser(log.username)}
                        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
                      >
                        <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight={600}>{log.username}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={getActionStyle(log.action).icon} 
                        label={log.action} 
                        size="small" 
                        color={getActionStyle(log.action).color} 
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ bgcolor: 'background.default', px: 1, py: 0.5, borderRadius: 1 }}>
                        {log.entity} {log.entityId !== 'N/A' ? `#${log.entityId}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 250 }}>
                      <Tooltip title={log.userAgent || ''}>
                        <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                          {log.details}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" fontFamily="monospace">{log.ipAddress}</Typography>
                        {log.userAgent && <LaptopMac sx={{ fontSize: 14, color: 'text.disabled' }} />}
                      </Stack>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={selectedUser ? filteredLogs.length : totalElements}
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