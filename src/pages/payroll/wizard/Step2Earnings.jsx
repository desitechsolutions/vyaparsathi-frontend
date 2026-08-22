import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Stack, Card, CardContent, Alert, IconButton
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

export default function Step2Earnings({ data, onDataChange }) {
  const [earnings, setEarnings] = useState([
    { id: 1, component: 'Basic Salary', amount: 50000 },
    { id: 2, component: 'HRA (30% of Basic)', amount: 15000 },
    { id: 3, component: 'Dearness Allowance (DA)', amount: 10000 },
  ]);

  const [adjustments, setAdjustments] = useState([
    { id: 1, employee: 'John Doe', type: 'Bonus', amount: 5000 },
    { id: 2, employee: 'Jane Smith', type: 'Overtime', amount: 2500 },
  ]);

  const handleAddAdjustment = () => {
    setAdjustments([
      ...adjustments,
      { id: Math.max(...adjustments.map(a => a.id), 0) + 1, employee: '', type: 'Bonus', amount: 0 }
    ]);
  };

  const handleAdjustmentChange = (index, field, value) => {
    const updated = [...adjustments];
    updated[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setAdjustments(updated);
    onDataChange({ earningsData: { adjustments } });
  };

  const handleRemoveAdjustment = (index) => {
    const updated = adjustments.filter((_, i) => i !== index);
    setAdjustments(updated);
    onDataChange({ earningsData: { adjustments: updated } });
  };

  const totalBase = earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalAdjustments = adjustments.reduce((sum, a) => sum + a.amount, 0);
  const totalEarnings = totalBase + totalAdjustments;

  return (
    <Box>
      <h3>Step 2: Earnings & Bonuses</h3>

      <Alert severity="info" sx={{ mb: 3 }}>
        Base earnings are calculated from salary structure. Add bonuses, overtime, or special incentives for this month.
      </Alert>

      {/* Earnings Summary */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1, bgcolor: 'success.light' }}>
          <CardContent>
            <p style={{ color: '#666', margin: 0 }}>Base Earnings</p>
            <h2 style={{ margin: '8px 0' }}>₹{totalBase.toLocaleString()}</h2>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: 'info.light' }}>
          <CardContent>
            <p style={{ color: '#666', margin: 0 }}>Adjustments</p>
            <h2 style={{ margin: '8px 0' }}>₹{totalAdjustments.toLocaleString()}</h2>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: 'primary.light' }}>
          <CardContent>
            <p style={{ color: '#666', margin: 0 }}>Total Gross</p>
            <h2 style={{ margin: '8px 0' }}>₹{totalEarnings.toLocaleString()}</h2>
          </CardContent>
        </Card>
      </Stack>

      {/* Base Earnings (Read-only) */}
      <h4>Base Earnings from Salary Structure</h4>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Component</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {earnings.map(earning => (
              <TableRow key={earning.id}>
                <TableCell>{earning.component}</TableCell>
                <TableCell align="right">₹{earning.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell sx={{ fontWeight: 600 }}>Subtotal</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>₹{totalBase.toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Adjustments */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <h4>Bonuses & Adjustments</h4>
        <Button size="small" startIcon={<AddIcon />} onClick={handleAddAdjustment}>
          Add Adjustment
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adjustments.map((adj, idx) => (
              <TableRow key={adj.id}>
                <TableCell>
                  <TextField
                    size="small"
                    value={adj.employee}
                    onChange={(e) => handleAdjustmentChange(idx, 'employee', e.target.value)}
                    sx={{ width: '150px' }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={adj.type}
                    onChange={(e) => handleAdjustmentChange(idx, 'type', e.target.value)}
                    sx={{ width: '120px' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={adj.amount}
                    onChange={(e) => handleAdjustmentChange(idx, 'amount', e.target.value)}
                    sx={{ width: '100px' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveAdjustment(idx)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {adjustments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#999' }}>
                  No adjustments. Click "Add Adjustment" to add bonuses or overtime.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}