import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Button,
  CircularProgress, Stack, Card, CardContent, Avatar, Alert,
  Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import {
  ArrowBackIosNew, EventBusy, Warning, CheckCircle, FileDownload
} from '@mui/icons-material';
import { fetchExpiryReport } from '../../services/api';
import dayjs from 'dayjs';

const DAYS_OPTIONS = [30, 60, 90];

const formatDate = (d) => d ? dayjs(d).format('DD MMM YYYY') : '—';

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { label: 'N/A', color: 'default' };
  const today = dayjs();
  const expiry = dayjs(expiryDate);
  const daysLeft = expiry.diff(today, 'day');
  if (daysLeft < 0) return { label: 'Expired', color: 'error', daysLeft };
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: 'error', daysLeft };
  if (daysLeft <= 60) return { label: `${daysLeft}d left`, color: 'warning', daysLeft };
  return { label: `${daysLeft}d left`, color: 'success', daysLeft };
};

const downloadCSV = (data, days) => {
  const rows = [
    ['Expiry Report', `Next ${days} Days`],
    [],
    ['Item Name', 'SKU', 'Batch No', 'Mfg Date', 'Expiry Date', 'Days Left', 'Qty', 'Unit'],
    ...(data || []).map(r => [
      r.itemName, r.sku, r.batchNumber,
      formatDate(r.manufacturingDate), formatDate(r.expiryDate),
      getExpiryStatus(r.expiryDate).daysLeft ?? '—',
      r.quantity, r.unit
    ])
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Expiry_Report_Next${days}Days_${dayjs().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function ExpiryReport() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = async (d) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchExpiryReport(d);
      setData(Array.isArray(result) ? result : result?.items || []);
    } catch (e) {
      setError('Failed to load expiry report. Please try again.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadReport(days); }, [days]);

  const expired = (data || []).filter(r => getExpiryStatus(r.expiryDate).daysLeft < 0);
  const expiringSoon = (data || []).filter(r => {
    const { daysLeft } = getExpiryStatus(r.expiryDate);
    return daysLeft >= 0 && daysLeft <= 30;
  });

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
          <Typography variant="h4" fontWeight={900} color="#0f172a">Expiry Report</Typography>
          <Typography color="text.secondary">Track stock nearing expiry to prevent losses</Typography>
        </Box>
        {data && data.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => downloadCSV(data, days)}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', bgcolor: 'white' }}
          >
            Export CSV
          </Button>
        )}
      </Stack>

      {/* Days Filter */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Stack direction="row" alignItems="center" spacing={3} flexWrap="wrap" gap={2}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">Show items expiring in:</Typography>
          <ToggleButtonGroup
            value={days}
            exclusive
            onChange={(_, val) => val && setDays(val)}
            size="small"
          >
            {DAYS_OPTIONS.map(d => (
              <ToggleButton key={d} value={d} sx={{ fontWeight: 700, px: 3 }}>
                {d} Days
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress thickness={5} /></Box>
      ) : data ? (
        <>
          {/* Stats */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={4}>
              <StatCard
                icon={<EventBusy />}
                color="error"
                label="Already Expired"
                value={expired.length}
                desc="Items past expiry date"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                icon={<Warning />}
                color="warning"
                label="Expiring in 30 Days"
                value={expiringSoon.length}
                desc="Urgent — sell or return"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                icon={<CheckCircle />}
                color="success"
                label={`Total in Next ${days} Days`}
                value={data.length}
                desc="All items flagged"
              />
            </Grid>
          </Grid>

          {/* Data Table */}
          {data.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <CheckCircle sx={{ fontSize: 60, color: '#86efac', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} color="text.secondary">
                No items expiring in the next {days} days
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    {['Item Name', 'SKU', 'Batch No', 'Mfg Date', 'Expiry Date', 'Status', 'Qty'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, idx) => {
                    const status = getExpiryStatus(row.expiryDate);
                    return (
                      <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700}>{row.itemName}</Typography>
                          {row.composition && (
                            <Typography variant="caption" color="text.secondary">{row.composition}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">{row.sku}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">{row.batchNumber || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatDate(row.manufacturingDate)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{formatDate(row.expiryDate)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status.label}
                            color={status.color}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>{row.quantity} {row.unit}</Typography>
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

const STAT_CARD_BG = { error: '#fee2e2', warning: '#fef3c7', success: '#dcfce7' };

const StatCard = ({ icon, color, label, value, desc }) => (
  <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <Avatar variant="rounded" sx={{ width: 52, height: 52, bgcolor: STAT_CARD_BG[color] || '#f1f5f9', color: `${color}.main` }}>
        {icon}
      </Avatar>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase' }}>{label}</Typography>
        <Typography variant="h4" fontWeight={900} color={`${color}.main`}>{value}</Typography>
        <Typography variant="caption" color="text.disabled">{desc}</Typography>
      </Box>
    </CardContent>
  </Card>
);
