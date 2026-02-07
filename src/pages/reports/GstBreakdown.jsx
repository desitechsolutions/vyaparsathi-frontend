import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, CircularProgress, 
  Table, TableHead, TableRow, TableCell, TableBody, Stack, Avatar, Chip, Alert
} from '@mui/material';
import {
  ArrowBackIosNew, FileDownload, RequestPage, 
  Layers, AccountBalance, Calculate
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { fetchGstBreakdown } from '../../services/api';

const downloadCSV = (data, from, to) => {
  const header = ['GST Rate (%)', 'Taxable Value (INR)', 'CGST', 'SGST', 'IGST', 'Total GST'];
  const rows = data.map(row => [
    `${row.gstRate}%`,
    row.taxableValue,
    row.cgst,
    row.sgst,
    row.igst,
    (row.cgst + row.sgst + row.igst).toFixed(2)
  ]);
  const csvContent = [
    [`GST Breakdown Report (${from} to ${to})`],
    [],
    header, 
    ...rows
  ].map(r => r.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GST_Breakdown_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function GstBreakdown() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchGstBreakdown(from, to);
      setReport(response.data);
    } catch (e) {
      setError(e.message || "Failed to load breakdown.");
      setReport([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleFetch(); }, []);

  // Calculate totals for the footer row
  const totals = report.reduce((acc, curr) => ({
    taxable: acc.taxable + (curr.taxableValue || 0),
    cgst: acc.cgst + (curr.cgst || 0),
    sgst: acc.sgst + (curr.sgst || 0),
    igst: acc.igst + (curr.igst || 0),
  }), { taxable: 0, cgst: 0, sgst: 0, igst: 0 });

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
          <Typography variant="h4" fontWeight={900} color="#0f172a">Tax Breakdown</Typography>
          <Typography color="text.secondary">Itemized GST figures grouped by tax slabs</Typography>
        </Box>
        {report.length > 0 && (
          <Button 
            variant="outlined" startIcon={<FileDownload />} 
            onClick={() => downloadCSV(report, from, to)}
            sx={{ borderRadius: 2, bgcolor: 'white', fontWeight: 700 }}
          >
            Export CSV
          </Button>
        )}
      </Stack>

      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="From Date" type="date" value={from} fullWidth
              onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="To Date" type="date" value={to} fullWidth
              onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              variant="contained" fullWidth size="large" onClick={handleFetch} 
              disabled={loading} sx={{ height: 56, borderRadius: 2, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Slabs'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : report.length > 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Tax Slab</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Taxable Value</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>CGST</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>SGST</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>IGST</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Total Tax</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.map((row, idx) => {
                const totalTax = (row.cgst || 0) + (row.sgst || 0) + (row.igst || 0);
                return (
                  <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Chip label={`${row.gstRate}% GST`} variant="outlined" sx={{ fontWeight: 700, borderColor: 'primary.light', color: 'primary.main' }} />
                    </TableCell>
                    <TableCell align="right">₹{Number(row.taxableValue).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right">₹{Number(row.cgst).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right">₹{Number(row.sgst).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right">₹{Number(row.igst).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalTax.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                );
              })}
              {/* Grand Total Row */}
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 900 }}>Grand Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900 }}>₹{totals.taxable.toLocaleString('en-IN')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900 }}>₹{totals.cgst.toLocaleString('en-IN')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900 }}>₹{totals.sgst.toLocaleString('en-IN')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900 }}>₹{totals.igst.toLocaleString('en-IN')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main' }}>
                  ₹{(totals.cgst + totals.sgst + totals.igst).toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Layers sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
          <Typography color="text.secondary">No tax data found for this period.</Typography>
        </Box>
      )}
    </Box>
  );
}