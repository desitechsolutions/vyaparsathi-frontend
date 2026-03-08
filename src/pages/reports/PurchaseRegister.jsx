import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Button, CircularProgress, Stack,
  Card, CardContent, Avatar, Alert, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField
} from '@mui/material';
import { ArrowBackIosNew, Inventory2, FileDownload, LocalShipping } from '@mui/icons-material';
import { fetchPurchaseRegister } from '../../services/api';
import dayjs from 'dayjs';

const formatDate = (d) => d ? dayjs(d).format('DD MMM YYYY') : '—';

const downloadCSV = (data, from, to) => {
  const rows = [
    ['Purchase Register — Batch-Supplier Tracking'],
    [`Period: ${from} to ${to}`],
    [],
    ['Date', 'PO No', 'Supplier', 'Item Name', 'Batch No', 'Mfg Date', 'Expiry Date', 'Qty Received', 'Unit Cost', 'Total Cost'],
    ...(data || []).map(r => [
      formatDate(r.receivedDate), r.poNumber, r.supplierName, r.itemName,
      r.batchNumber || '—', formatDate(r.manufacturingDate), formatDate(r.expiryDate),
      r.receivedQty, r.unitCost, r.totalCost
    ])
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Purchase_Register_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function PurchaseRegister() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchPurchaseRegister(from, to);
      setData(Array.isArray(result) ? result : result?.items || []);
    } catch (e) {
      setError('Failed to load purchase register. Ensure the backend endpoint is available.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadReport(); }, []);

  const totalValue = (data || []).reduce((sum, r) => sum + Number(r.totalCost || 0), 0);
  const uniqueSuppliers = new Set((data || []).map(r => r.supplierName)).size;
  const uniqueBatches = new Set((data || []).map(r => r.batchNumber).filter(Boolean)).size;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Button
        startIcon={<ArrowBackIosNew sx={{ fontSize: '0.8rem !important' }} />}
        onClick={() => navigate('/reports')}
        sx={{ mb: 3, color: 'text.secondary', fontWeight: 700, textTransform: 'none' }}
      >
        Back to Reports
      </Button>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
            <LocalShipping color="primary" />
            <Typography variant="h4" fontWeight={900} color="#0f172a">Purchase Register</Typography>
          </Stack>
          <Typography color="text.secondary">
            Batch-wise supplier tracking — required for drug recall traceability and regulatory audits
          </Typography>
        </Box>
        {data && data.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => downloadCSV(data, from, to)}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', bgcolor: 'white' }}
          >
            Export CSV
          </Button>
        )}
      </Stack>

      <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
        The Purchase Register tracks which supplier supplied each batch. This is critical for drug recalls and pharmacy audits.
      </Alert>

      {/* Date Filter */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField label="From Date" type="date" value={from} fullWidth
              onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="To Date" type="date" value={to} fullWidth
              onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button variant="contained" fullWidth size="large" onClick={loadReport}
              disabled={loading} sx={{ height: 56, borderRadius: 2, fontWeight: 700 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Load Register'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress thickness={5} /></Box>
      ) : data ? (
        <>
          {/* Stats */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<Inventory2 />} bg="#dbeafe" color="#2563eb"
                label="Total Batches" value={uniqueBatches} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<LocalShipping />} bg="#dcfce7" color="#16a34a"
                label="Unique Suppliers" value={uniqueSuppliers} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<Inventory2 />} bg="#fef3c7" color="#d97706"
                label="Total Purchase Value"
                value={`₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              />
            </Grid>
          </Grid>

          {data.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Inventory2 sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} color="text.secondary">
                No purchase records found for this period
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    {['Date', 'PO No', 'Supplier', 'Item Name', 'Batch No', 'Mfg Date', 'Expiry', 'Qty', 'Unit Cost', 'Total'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, idx) => {
                    const isExpired = row.expiryDate && dayjs(row.expiryDate).isBefore(dayjs());
                    const isExpiringSoon = row.expiryDate && dayjs(row.expiryDate).diff(dayjs(), 'day') <= 90;
                    return (
                      <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                        <TableCell>
                          <Typography variant="body2">{formatDate(row.receivedDate)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontWeight={600}>{row.poNumber}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700}>{row.supplierName}</Typography>
                          {row.supplierDlNumber && (
                            <Typography variant="caption" color="text.secondary">DL: {row.supplierDlNumber}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700}>{row.itemName}</Typography>
                          {row.composition && (
                            <Typography variant="caption" color="text.secondary">{row.composition}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">{row.batchNumber || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatDate(row.manufacturingDate)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isExpired ? 'EXPIRED' : isExpiringSoon ? formatDate(row.expiryDate) : formatDate(row.expiryDate)}
                            color={isExpired ? 'error' : isExpiringSoon ? 'warning' : 'default'}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>{row.receivedQty} {row.unit}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">₹{Number(row.unitCost || 0).toFixed(2)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            ₹{Number(row.totalCost || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      ) : null}
    </Box>
  );
}

const StatCard = ({ icon, color, bg, label, value }) => (
  <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar variant="rounded" sx={{ width: 52, height: 52, bgcolor: bg, color }}>{icon}</Avatar>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={900} sx={{ color }}>{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);
