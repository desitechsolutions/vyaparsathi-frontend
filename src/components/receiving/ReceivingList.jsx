import React from 'react';
import {
  Box, Button, Typography, TextField, TableContainer, MenuItem, Paper,
  Table, TableHead, TableRow, TableCell, TableBody, CircularProgress,
  IconButton, Chip, Tooltip, Stack, Alert, Grid, TableSortLabel
} from '@mui/material';
import {
  Add as AddIcon,
  EditOutlined as EditOutlinedIcon,
  DeleteOutlined as DeleteOutlinedIcon,
  LocalShippingOutlined as LocalShippingOutlinedIcon,
  AssignmentOutlined as AssignmentOutlinedIcon,
  InfoOutlined as InfoOutlinedIcon,
  FilterList as FilterIcon,
  RestartAlt as ResetIcon, ConfirmationNumberOutlined as TicketIcon
} from '@mui/icons-material';
import { getStatusColor, formatDate } from '../../utils/utils.js';
import Header from './Header';

const ReceivingList = ({
  receivings, loading, error, filters, setFilters, sort, setSort,
  onViewDetails, onEdit, onDelete, onReceiveGoods, onCreateNew, onCreateTicket,onViewTickets,
}) => {
  const safeSort = sort || { field: 'receivedAt', direction: 'desc' };
  const safeReceivings = Array.isArray(receivings) ? receivings : [];

  // Filtering Logic
  const filteredReceivings = safeReceivings.filter((rec) => {
    if (!rec) return false;
    const poFilter = (filters?.poNumber || '').toLowerCase();
    const supFilter = (filters?.supplier || '').toLowerCase();
    const statFilter = filters?.status || '';
    const dateFrom = filters?.dateFrom || '';
    const dateTo = filters?.dateTo || '';

    const matchPo = (rec.poNumber || '').toLowerCase().includes(poFilter);
    const matchSup = (rec.supplier?.name || '').toLowerCase().includes(supFilter);
    const matchStat = !statFilter || rec.status === statFilter;
    
    const recDate = rec.receivedAt ? new Date(rec.receivedAt) : null;
    const matchFrom = !dateFrom || (recDate && recDate >= new Date(dateFrom));
    const matchTo = !dateTo || (recDate && recDate <= new Date(dateTo));

    return matchPo && matchSup && matchStat && matchFrom && matchTo;
  });

  // Sorting Logic
  const handleSort = (field) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedReceivings = [...filteredReceivings].sort((a, b) => {
    let aVal, bVal;
    
    if (safeSort.field === 'supplier') {
      aVal = a.supplier?.name?.toLowerCase() || '';
      bVal = b.supplier?.name?.toLowerCase() || '';
    } else {
      aVal = a[safeSort.field];
      bVal = b[safeSort.field];
    }

    if (aVal < bVal) return safeSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return safeSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Action Button Helper
  const ActionBtn = ({ title, icon, color, onClick }) => (
    <Tooltip title={title} arrow>
      <IconButton 
        onClick={onClick} 
        color={color} 
        size="small" 
        sx={{ 
          border: '1px solid transparent', 
          '&:hover': { border: '1px solid currentColor', bgcolor: 'transparent' } 
        }}
      >
        {React.cloneElement(icon, { fontSize: 'small' })}
      </IconButton>
    </Tooltip>
  );

  return (
    <Box sx={{ pb: 4 }}>
      {/* Page Header */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ md: 'center' }} 
        spacing={2} 
        sx={{ mb: 4 }}
      >
        <Header title="Receiving Dashboard" />
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={onViewTickets} // Calls the parent's function to change the view state
            startIcon={<TicketIcon />} 
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            View Tickets
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={onCreateTicket} 
            startIcon={<AssignmentOutlinedIcon />} 
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Ticket
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={onReceiveGoods} 
            startIcon={<LocalShippingOutlinedIcon />} 
            sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 2 }}
          >
            Receive Goods
          </Button>
          <Button 
            variant="contained" 
            onClick={onCreateNew} 
            startIcon={<AddIcon />} 
            sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 2 }}
          >
            New Entry
          </Button>
        </Stack>
      </Stack>

      {/* Filter Toolbar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <FilterIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Quick Filters</Typography>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField 
              fullWidth size="small" label="PO Number" 
              value={filters.poNumber || ''} 
              onChange={e => setFilters(f => ({ ...f, poNumber: e.target.value }))} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField 
              fullWidth size="small" label="Supplier" 
              value={filters.supplier || ''} 
              onChange={e => setFilters(f => ({ ...f, supplier: e.target.value }))} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField 
              fullWidth size="small" select label="Status" 
              value={filters.status || ''} 
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="PARTIALLY_RECEIVED">Partially Received</MenuItem>
              <MenuItem value="RECEIVED">Received</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField 
              fullWidth size="small" type="date" label="From" 
              InputLabelProps={{ shrink: true }} 
              value={filters.dateFrom || ''} 
              onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Stack direction="row" spacing={1}>
              <TextField 
                fullWidth size="small" type="date" label="To" 
                InputLabelProps={{ shrink: true }} 
                value={filters.dateTo || ''} 
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} 
              />
              <Tooltip title="Reset Filters">
                <IconButton 
                  onClick={() => setFilters({ poNumber: '', supplier: '', status: '', dateFrom: '', dateTo: '' })} 
                  sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}
                >
                  <ResetIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content Area */}
      {loading ? (
        <Stack alignItems="center" sx={{ py: 10 }}>
          <CircularProgress size={40} thickness={4} />
          <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>Fetching logs...</Typography>
        </Stack>
      ) : error ? (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : sortedReceivings.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 10, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
          <Typography color="text.secondary">No receiving records match your criteria.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 800 }}>
                  <TableSortLabel
                    active={safeSort.field === 'id'}
                    direction={safeSort.field === 'id' ? safeSort.direction : 'asc'}
                    onClick={() => handleSort('id')}
                  >ID</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }}>
                   <TableSortLabel
                    active={safeSort.field === 'poNumber'}
                    direction={safeSort.field === 'poNumber' ? safeSort.direction : 'asc'}
                    onClick={() => handleSort('poNumber')}
                  >PO NUMBER</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }}>
                   <TableSortLabel
                    active={safeSort.field === 'supplier'}
                    direction={safeSort.field === 'supplier' ? safeSort.direction : 'asc'}
                    onClick={() => handleSort('supplier')}
                  >SUPPLIER</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>
                   <TableSortLabel
                    active={safeSort.field === 'receivedAt'}
                    direction={safeSort.field === 'receivedAt' ? safeSort.direction : 'asc'}
                    onClick={() => handleSort('receivedAt')}
                  >DATE</TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedReceivings.map((rec) => (
                <TableRow key={rec.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fafafa' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>#{rec.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{rec.poNumber}</Typography>
                  </TableCell>
                  <TableCell>{rec.supplier?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={rec.status?.replace('_', ' ')}
                      size="small"
                      color={getStatusColor(rec.status)}
                      sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell>{formatDate(rec.receivedAt)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <ActionBtn title="View Details" icon={<InfoOutlinedIcon />} color="primary" onClick={() => onViewDetails(rec)} />
                      <ActionBtn title="Edit Report" icon={<EditOutlinedIcon />} color="warning" onClick={() => onEdit(rec)} />
                      <ActionBtn title="Delete Record" icon={<DeleteOutlinedIcon />} color="error" onClick={() => onDelete(rec.id)} />
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ReceivingList;