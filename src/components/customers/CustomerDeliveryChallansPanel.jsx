import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { fetchCustomerDeliveryChallans } from '../../services/api';

const STATUS_COLOR = {
  PENDING: 'default',
  PACKED: 'info',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

export default function CustomerDeliveryChallansPanel({ customerId }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError('');
    try {
      const resp = await fetchCustomerDeliveryChallans(customerId, page, size);
      setRows(resp?.content || []);
      setTotal(resp?.totalElements || 0);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load delivery challans.');
    } finally {
      setLoading(false);
    }
  }, [customerId, page, size]);

  useEffect(() => { load(); }, [load]);

  const dateStr = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={800}>Delivery challans ({total})</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack>
      ) : rows.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', borderRadius: 2.5 }}>
          <LocalShippingIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">No delivery challans yet for this customer.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Challan #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Delivery person</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{d.challanNo || `DC-${d.id}`}</TableCell>
                  <TableCell>{dateStr(d.createdAt)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.deliveryAddress || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>{d.deliveryPerson?.name || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={d.deliveryStatus || 'PENDING'}
                      color={STATUS_COLOR[d.deliveryStatus] || 'default'}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => navigate(`/delivery?search=${encodeURIComponent(d.challanNo || d.id)}`)} sx={{ textTransform: 'none' }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={size}
            onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </TableContainer>
      )}
    </Box>
  );
}
