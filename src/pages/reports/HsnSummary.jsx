import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, Stack, TableContainer } from '@mui/material';
import { ArrowBackIosNew, FileDownload } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HsnSummary() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data] = useState([
    { hsn: '6109', desc: 'Cotton T-Shirts', qty: 150, taxable: 45000, tax: 2250 },
    { hsn: '6403', desc: 'Leather Footwear', qty: 40, taxable: 85000, tax: 10200 },
  ]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Button startIcon={<ArrowBackIosNew />} onClick={() => navigate(-1)} sx={{ mb: 2, color: 'text.secondary', fontWeight: 700 }}>Back</Button>
      <Stack direction="row" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="text.primary">{t('hsnSummaryReport.title')}</Typography>
          <Typography color="text.secondary">{t('hsnSummaryReport.subtitle')}</Typography>
        </Box>
        <Button variant="outlined" startIcon={<FileDownload />} sx={{ borderRadius: 2, fontWeight: 700, bgcolor: 'background.paper' }}>Export HSN CSV</Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }} elevation={0}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('hsnSummaryReport.columns.hsn')}</TableCell>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('hsnSummaryReport.columns.description')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>Qty Sold</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('hsnSummaryReport.columns.taxableValue')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('hsnSummaryReport.columns.total')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i} hover sx={{ '&:hover': { bgcolor: 'action.hover !important' } }}>
                <TableCell><Chip label={row.hsn} color="primary" variant="outlined" sx={{ fontWeight: 800 }} /></TableCell>
                <TableCell sx={{ color: 'text.primary' }}>{row.desc}</TableCell>
                <TableCell align="right" sx={{ color: 'text.primary' }}>{row.qty}</TableCell>
                <TableCell align="right" sx={{ color: 'text.primary' }}>₹{row.taxable.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ color: 'text.primary', fontWeight: 700 }}>₹{row.tax.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}