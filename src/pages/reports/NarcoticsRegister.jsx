import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Grid, Button, CircularProgress, Stack,
  Card, CardContent, Avatar, Alert, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField
} from '@mui/material';
import { ArrowBackIosNew, MedicalServices, FileDownload, GppMaybe } from '@mui/icons-material';
import { fetchNarcoticsRegister } from '../../services/api';
import dayjs from 'dayjs';

const SCHEDULE_COLORS = {
  SCHEDULE_H: 'warning',
  SCHEDULE_H1: 'error',
  SCHEDULE_X: 'error',
};

const SCHEDULE_LABELS = {
  SCHEDULE_H: 'Schedule H',
  SCHEDULE_H1: 'Schedule H1',
  SCHEDULE_X: 'Schedule X (Narcotic)',
};

const formatDate = (d) => d ? dayjs(d).format('DD MMM YYYY, hh:mm A') : '—';

const downloadCSV = (data, from, to, t) => {
  const rows = [
    [t('narcoticsReport.title')],
    [`Period: ${from} to ${to}`],
    [],
    ['Date', 'Invoice No', 'Item Name', 'Schedule', 'Qty', 'Unit', 'Customer', 'Doctor', 'Patient', 'Batch No'],
    ...(data || []).map(r => [
      formatDate(r.saleDate), r.invoiceNo, r.itemName, r.drugSchedule,
      r.qty, r.unit, r.customerName || '—', r.doctorName || '—',
      r.patientName || '—', r.batchNumber || '—'
    ])
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Narcotics_Register_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function NarcoticsRegister() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchNarcoticsRegister(from, to);
      setData(Array.isArray(result) ? result : result?.items || []);
    } catch (e) {
      setError('Failed to load narcotics register. Ensure the backend supports this endpoint.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadReport(); }, [from, to]);

  const scheduleXCount = (data || []).filter(r => r.drugSchedule === 'SCHEDULE_X').length;
  const scheduleH1Count = (data || []).filter(r => r.drugSchedule === 'SCHEDULE_H1').length;
  const scheduleHCount = (data || []).filter(r => r.drugSchedule === 'SCHEDULE_H').length;

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
            <GppMaybe color="error" />
            <Typography variant="h4" fontWeight={900} color="#0f172a">{t('narcoticsReport.title')}</Typography>
          </Stack>
          <Typography color="text.secondary">
            Mandatory log for Schedule H, H1, and X (narcotic) drug sales — required for regulatory compliance
          </Typography>
        </Box>
        {data && data.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => downloadCSV(data, from, to, t)}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', bgcolor: 'white' }}
          >
            Export CSV
          </Button>
        )}
      </Stack>

      {/* Alert Banner */}
      <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
        This register must be maintained as per the Drugs & Cosmetics Act. All Schedule H1 and X sales require a doctor's prescription to be on file.
      </Alert>

      {/* Date Filter */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField label={t('reportsCommon.from')} type="date" value={from} fullWidth
              onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label={t('reportsCommon.to')} type="date" value={to} fullWidth
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
              <StatCard icon={<MedicalServices />} color="#ef4444" bg="#fee2e2"
                label="Schedule X (Narcotics)" value={scheduleXCount} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<MedicalServices />} color="#d97706" bg="#fef3c7"
                label="Schedule H1 Drugs" value={scheduleH1Count} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<MedicalServices />} color="#2563eb" bg="#dbeafe"
                label="Schedule H Drugs" value={scheduleHCount} />
            </Grid>
          </Grid>

          {data.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <MedicalServices sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} color="text.secondary">
                No controlled drug sales recorded in this period
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    {[t('narcoticsReport.columns.date'), t('narcoticsReport.columns.item'), t('narcoticsReport.columns.schedule'), t('narcoticsReport.columns.qty'), t('reportsCommon.allCustomers'), t('narcoticsReport.columns.doctor'), t('narcoticsReport.columns.patient'), 'Batch No'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, idx) => (
                    <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{dayjs(row.saleDate).format('DD MMM YYYY')}</Typography>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">{row.invoiceNo}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>{row.itemName}</Typography>
                        {row.composition && (
                          <Typography variant="caption" color="text.secondary">{row.composition}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={SCHEDULE_LABELS[row.drugSchedule] || row.drugSchedule}
                          color={SCHEDULE_COLORS[row.drugSchedule] || 'default'}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{row.qty} {row.unit}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.customerName || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color={row.doctorName ? 'text.primary' : 'error.main'}>
                          {row.doctorName ? `Dr. ${row.doctorName}` : 'NOT PROVIDED'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.patientName || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">{row.batchNumber || '—'}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
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
        <Typography variant="h4" fontWeight={900} sx={{ color }}>{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);
