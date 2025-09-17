import React from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  TableContainer,
  MenuItem,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TableSortLabel from '@mui/material/TableSortLabel';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getStatusColor, formatDate } from '../../utils/utils.js';
import Header from './Header';

const ReceivingList = ({
  receivings,
  loading,
  error,
  filters,
  setFilters,
  sort,
  setSort,
  onViewDetails,
  onEdit,
  onDelete,
  onReceiveGoods,
  onCreateNew,
  onCreateTicket,
}) => {
  // Ensure sort always has a default value
  const safeSort = sort || { field: '', direction: 'asc' };
  const safeReceivings = Array.isArray(receivings) ? receivings : [];

  // Filtering
  const filteredReceivings = safeReceivings.filter((rec) => {
    if (!rec) return false;

    const poNumberFilter = (filters?.poNumber || '').toLowerCase();
    const supplierFilter = (filters?.supplier || '').toLowerCase();
    const statusFilter = filters?.status || '';
    const dateFromFilter = filters?.dateFrom || '';
    const dateToFilter = filters?.dateTo || '';

    const recPoNumber = (rec.poNumber || '').toLowerCase();
    const recSupplier = (rec.supplier?.name || '').toLowerCase();
    const recStatus = rec.status || '';
    const recDate = rec.receivedAt ? new Date(rec.receivedAt) : null;

    return (
      (!poNumberFilter || recPoNumber.includes(poNumberFilter)) &&
      (!statusFilter || recStatus === statusFilter) &&
      (!supplierFilter || recSupplier.includes(supplierFilter)) &&
      (!dateFromFilter || (recDate && recDate >= new Date(dateFromFilter))) &&
      (!dateToFilter || (recDate && recDate <= new Date(dateToFilter)))
    );
  });

  // Sorting
  const handleSort = (field) => {
    setSort((prev = { field: '', direction: 'asc' }) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedReceivings = [...filteredReceivings].sort((a, b) => {
    if (!safeSort.field) return 0;
    let aValue, bValue;

    switch (safeSort.field) {
      case 'supplier':
        aValue = a.supplier?.name?.toLowerCase() || '';
        bValue = b.supplier?.name?.toLowerCase() || '';
        break;
      case 'receivedAt':
        aValue = a.receivedAt ? new Date(a.receivedAt) : new Date(0);
        bValue = b.receivedAt ? new Date(b.receivedAt) : new Date(0);
        break;
      case 'poNumber':
        aValue = a.poNumber?.toLowerCase() || '';
        bValue = b.poNumber?.toLowerCase() || '';
        break;
      case 'status':
        aValue = a.status?.toLowerCase() || '';
        bValue = b.status?.toLowerCase() || '';
        break;
      case 'id':
        aValue = a.id || 0;
        bValue = b.id || 0;
        break;
      default:
        aValue = a[safeSort.field] || '';
        bValue = b[safeSort.field] || '';
    }

    if (aValue < bValue) return safeSort.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return safeSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Header title="Receiving Dashboard" />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            onClick={onReceiveGoods}
            startIcon={<LocalShippingOutlinedIcon />}
            sx={{ borderRadius: 2 }}
          >
            Receive Goods
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={onCreateTicket}
            startIcon={<AssignmentOutlinedIcon />}
            sx={{ borderRadius: 2 }}
          >
            Create Ticket
          </Button>
          <Button
            variant="contained"
            onClick={onCreateNew}
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2 }}
          >
            New Receiving
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="PO Number"
            value={filters.poNumber}
            onChange={e => setFilters(f => ({ ...f, poNumber: e.target.value }))}
            size="small"
            variant="outlined"
          />
          <TextField
            label="Supplier"
            value={filters.supplier}
            onChange={e => setFilters(f => ({ ...f, supplier: e.target.value }))}
            size="small"
            variant="outlined"
          />
          <TextField
            label="Status"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            size="small"
            variant="outlined"
            select
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="RECEIVED">Received</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            {/* Add more statuses as needed */}
          </TextField>
          <TextField
            label="From"
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To"
            type="date"
            value={filters.dateTo}
            onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="outlined"
            onClick={() =>
                setFilters({
                poNumber: '',
                supplier: '',
                status: '',
                dateFrom: '',
                dateTo: '',
                })
            }
            sx={{
                minWidth: 120,
                height: 40,
                borderRadius: 2,
                ml: 2, // margin-left for spacing
                textTransform: 'none', // optional: keeps text as "Clear Filters"
                fontWeight: 500,
                }}
                >
                Clear Filters
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, color: 'grey.500' }}>
          <CircularProgress color="inherit" size={40} sx={{ mb: 2 }} />
          <Typography>Loading data...</Typography>
        </Box>
      )}
      {error && safeReceivings.length === 0 && (
        <Box sx={{ py: 2, textAlign: 'center', color: 'error.main', bgcolor: 'error.light', borderRadius: 2 }}>
          {error}
        </Box>
      )}
      {!loading && safeReceivings.length === 0 && !error && (
        <Typography sx={{ py: 5, textAlign: 'center', color: 'grey.500' }}>No records found.</Typography>
      )}

      {!loading && sortedReceivings.length > 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={safeSort.field === 'id'}
                    direction={safeSort.field === 'id' ? safeSort.direction : 'asc'}
                    onClick={() => handleSort('id')}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={safeSort.field === 'poNumber'}
                    direction={safeSort.field === 'poNumber' ? safeSort.direction : 'asc'}
                    onClick={() => handleSort('poNumber')}
                  >
                    PO Number
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={safeSort.field === 'supplier'}
                    direction={safeSort.field === 'supplier' ? safeSort.direction : 'asc'}
                    onClick={() => handleSort('supplier')}
                  >
                    Supplier
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={safeSort.field === 'status'}
                    direction={safeSort.field === 'status' ? safeSort.direction : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={safeSort.field === 'receivedAt'}
                    direction={safeSort.field === 'receivedAt' ? safeSort.direction : 'asc'}
                    onClick={() => handleSort('receivedAt')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedReceivings.map((rec) => (
                <TableRow key={rec.id} hover>
                  <TableCell>{rec.id}</TableCell>
                  <TableCell>{rec.poNumber}</TableCell>
                  <TableCell>{rec.supplier?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={rec.status}
                      size="small"
                      color={getStatusColor(rec.status)}
                    />
                  </TableCell>
                  <TableCell>{formatDate(rec.receivedAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton onClick={() => onViewDetails(rec)} color="primary">
                        <InfoOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Goods">
                      <IconButton onClick={() => onEdit(rec)} color="warning">
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => onDelete(rec.id)} color="error">
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default ReceivingList;