import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Stack, Dialog, DialogTitle, DialogContent, Card, CardContent, Chip, Alert
} from '@mui/material';
import { FileDownload as DownloadIcon, Visibility as ViewIcon } from '@mui/icons-material';

export default function MyPayslips() {
  const [payslips, setPayslips] = useState([
    { id: 1, month: 'September 2026', gross: 50000, deductions: 8000, net: 42000, status: 'PAID', date: '2026-09-15' },
    { id: 2, month: 'August 2026', gross: 50000, deductions: 8000, net: 42000, status: 'PAID', date: '2026-08-15' },
    { id: 3, month: 'July 2026', gross: 50000, deductions: 8000, net: 42000, status: 'PAID', date: '2026-07-15' }
  ]);

  const [viewDialog, setViewDialog] = useState({ open: false, slip: null });

  return (
    <Box>
      <h1>My Payslips</h1>
      <Alert severity="info" sx={{ mb: 3 }}>
        Download and view your payslips with complete earnings and deductions breakdown.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Gross</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Deductions</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Net</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payslips.map(slip => (
              <TableRow key={slip.id} hover>
                <TableCell>{slip.month}</TableCell>
                <TableCell align="right">₹{slip.gross.toLocaleString()}</TableCell>
                <TableCell align="right">₹{slip.deductions.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>₹{slip.net.toLocaleString()}</TableCell>
                <TableCell><Chip label={slip.status} color="success" size="small" /></TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1}>
                    <Button size="small" startIcon={<ViewIcon />}>View</Button>
                    <Button size="small" startIcon={<DownloadIcon />}>Download</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
