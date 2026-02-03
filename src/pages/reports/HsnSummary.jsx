import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, Stack, TableContainer } from '@mui/material';
import { ArrowBackIosNew, FileDownload } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function HsnSummary() {
  const navigate = useNavigate();
  const [data] = useState([
    { hsn: '6109', desc: 'Cotton T-Shirts', qty: 150, taxable: 45000, tax: 2250 },
    { hsn: '6403', desc: 'Leather Footwear', qty: 40, taxable: 85000, tax: 10200 },
  ]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Button startIcon={<ArrowBackIosNew />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Stack direction="row" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900}>HSN Summary</Typography>
          <Typography color="text.secondary">HSN-wise tax distribution for GSTR filing</Typography>
        </Box>
        <Button variant="outlined" startIcon={<FileDownload />}>Export HSN CSV</Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }} elevation={0}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>HSN Code</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Qty Sold</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Taxable Value</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Total Tax</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i} hover>
                <TableCell><Chip label={row.hsn} color="primary" variant="outlined" sx={{ fontWeight: 800 }} /></TableCell>
                <TableCell>{row.desc}</TableCell>
                <TableCell align="right">{row.qty}</TableCell>
                <TableCell align="right">₹{row.taxable.toLocaleString()}</TableCell>
                <TableCell align="right">₹{row.tax.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}