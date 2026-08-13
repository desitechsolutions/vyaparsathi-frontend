import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Stack, Avatar,
  LinearProgress, Alert, TableContainer, Chip,
} from '@mui/material';
import {
  ArrowBackIosNew, FileDownload, EmojiEvents, PersonOutline,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { fetchSalespersonLeaderboard } from '../../services/api';

const downloadCSV = (data, from, to) => {
  const header = ['Rank', 'Salesperson', 'Total Sales (INR)', 'Sales Count', 'Avg Sale Value (INR)'];
  const rows = data.map(row => [
    row.rank,
    (row.salespersonName || '').replaceAll(',', ' '),
    row.totalSales,
    row.saleCount,
    row.avgSaleValue,
  ]);
  const csvContent = [
    [`Salesperson Leaderboard (${from} to ${to})`],
    [],
    header,
    ...rows,
  ].map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Salesperson_Leaderboard_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const rankMedal = (rank) => {
  if (rank === 1) return { color: '#eab308', label: '🥇' };
  if (rank === 2) return { color: '#94a3b8', label: '🥈' };
  if (rank === 3) return { color: '#b45309', label: '🥉' };
  return null;
};

export default function SalespersonLeaderboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchSalespersonLeaderboard(from, to);
      setReport(response.data || []);
    } catch (e) {
      setError(e.message || 'Failed to load salesperson data.');
      setReport([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleFetch(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const topSales = report.length > 0 ? Number(report[0].totalSales) : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Button
        startIcon={<ArrowBackIosNew sx={{ fontSize: '0.8rem !important' }} />}
        onClick={() => navigate('/reports')}
        sx={{ mb: 3, color: 'text.secondary', fontWeight: 700, textTransform: 'none' }}
      >
        Back to Reports
      </Button>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="text.primary">
            {t('salespersonLeaderboard.title', 'Salesperson Leaderboard')}
          </Typography>
          <Typography color="text.secondary">
            {t('salespersonLeaderboard.subtitle', 'Ranks users by attributed sales value in the selected date range.')}
          </Typography>
        </Box>
        {report.length > 0 && (
          <Button
            variant="outlined" startIcon={<FileDownload />}
            onClick={() => downloadCSV(report, from, to)}
            sx={{ borderRadius: 2, bgcolor: 'background.paper', fontWeight: 700 }}
          >
            {t('reportsCommon.export', 'Export CSV')}
          </Button>
        )}
      </Stack>

      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField label={t('reportsCommon.from', 'From')} type="date" value={from} fullWidth
              onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label={t('reportsCommon.to', 'To')} type="date" value={to} fullWidth
              onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="contained" fullWidth size="large" onClick={handleFetch}
              disabled={loading} sx={{ height: 56, borderRadius: 2, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Run'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : report.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 80 }}>Rank</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Salesperson</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Share of Top</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>Sales</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>Avg Sale</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.map((row) => {
                const share = topSales > 0 ? (Number(row.totalSales) / topSales) * 100 : 0;
                const medal = rankMedal(row.rank);
                return (
                  <TableRow key={row.salespersonId} hover>
                    <TableCell>
                      {medal ? (
                        <Typography variant="h5" sx={{ lineHeight: 1 }}>{medal.label}</Typography>
                      ) : (
                        <Chip label={`#${row.rank}`} size="small" sx={{ fontWeight: 800 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 36, height: 36 }}>
                          <PersonOutline sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          {row.salespersonName}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ width: '25%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={share}
                            sx={{ height: 8, borderRadius: 5, bgcolor: 'action.hover' }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 40 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            {share.toFixed(0)}%
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="text.primary">{row.saleCount}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        ₹{Number(row.avgSaleValue).toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={900} color="primary.main">
                        ₹{Number(row.totalSales).toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <EmojiEvents sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No salesperson activity in this window.</Typography>
          <Typography variant="body2" color="text.disabled">
            Sales must have a salesperson assigned to appear on the leaderboard.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
