import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, TextField, InputAdornment, Stack,
  Chip, CircularProgress, Alert, Tooltip
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SecurityIcon from '@mui/icons-material/Security';
import api from '../../services/api';

export default function SuperAdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [search, setSearch] = useState('');

  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/audit/logs?page=${page}&size=${rowsPerPage}`);
      if (response.data && response.data.content) {
        setLogs(response.data.content);
        setTotalElements(response.data.totalElements);
      } else if (Array.isArray(response.data)) {
        setLogs(response.data);
        setTotalElements(response.data.length);
      }
    } catch (err) {
      console.error("Audit log fetch error:", err);
      setError("Failed to fetch platform audit log records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [page, rowsPerPage]);

  const filteredLogs = logs.filter(log => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (log.username && log.username.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.entity && log.entity.toLowerCase().includes(term)) ||
      (log.details && log.details.toLowerCase().includes(term)) ||
      (log.impersonationSessionId && log.impersonationSessionId.toLowerCase().includes(term))
    );
  });

  const getActionColor = (action) => {
    if (!action) return 'default';
    if (action.includes('SUSPEND') || action.includes('REVOKE') || action.includes('DELETE')) return 'error';
    if (action.includes('ACTIVATE') || action.includes('CREATE') || action.includes('ACCEPT')) return 'success';
    if (action.includes('IMPERSONATION') || action.includes('OVERRIDE')) return 'warning';
    return 'primary';
  };

  return (
    <Box sx={{ p: 3, color: 'text.primary' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <GavelIcon sx={{ fontSize: 36, color: 'primary.main' }} /> Platform Audit Trail & Forensics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Immutable operational logs, administrative actions, and support impersonation events
          </Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Filter audit logs by action, username, shop ID, or impersonation session UUID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>)
          }}
        />
      </Paper>

      {/* Main Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>TIMESTAMP</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>ACTOR / USER</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>ACTION</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>TARGET SHOP</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>DETAILS & REASON</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>IMPERSONATION SESSION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  No audit log records match the selected criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                    {log.username}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      color={getActionColor(log.action)}
                      size="small"
                      sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                    {log.targetShopId ? `#${log.targetShopId}` : 'GLOBAL / SYSTEM'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', maxWidth: 300 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>{log.details}</Typography>
                    {log.reason && (
                      <Typography variant="caption" color="warning.main" fontWeight={700} sx={{ display: 'block' }}>
                        Reason: {log.reason}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                    {log.impersonationSessionId ? (
                      <Chip
                        icon={<SecurityIcon sx={{ fontSize: '12px !important' }} />}
                        label={log.impersonationSessionId.substring(0, 8) + '...'}
                        color="warning"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                      />
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Box>
  );
}
