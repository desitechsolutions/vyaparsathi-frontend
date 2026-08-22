import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Checkbox, TextField, Card, CardContent, Stack, Alert, Chip
} from '@mui/material';

export default function Step3Deductions({ data, onDataChange }) {
  const [deductions, setDeductions] = useState([
    { id: 1, component: 'Employee PF (12%)', amount: 6000, isStatutory: true, editable: false },
    { id: 2, component: 'Employee ESI (0.75%)', amount: 375, isStatutory: true, editable: false },
    { id: 3, component: 'Professional Tax', amount: 200, isStatutory: true, editable: false },
    { id: 4, component: 'Income Tax (TDS)', amount: 8000, isStatutory: true, editable: false },
    { id: 5, component: 'Salary Advance Recovery', amount: 2000, isStatutory: false, editable: true },
  ]);

  const handleDeductionChange = (index, field, value) => {
    const updated = [...deductions];
    if (field === 'amount') {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setDeductions(updated);
    onDataChange({ deductionsData: updated });
  };

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const totalStatutory = deductions.filter(d => d.isStatutory).reduce((sum, d) => sum + d.amount, 0);
  const totalOther = deductions.filter(d => !d.isStatutory).reduce((sum, d) => sum + d.amount, 0);

  return (
    <Box>
      <h3>Step 3: Deductions & Statutory Tax</h3>

      <Alert severity="warning" sx={{ mb: 3 }}>
        Statutory deductions (PF, ESI, TDS, PT) are calculated automatically. You can override non-statutory deductions.
      </Alert>

      {/* Deduction Summary */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1, bgcolor: 'error.light' }}>
          <CardContent>
            <p style={{ color: '#666', margin: 0 }}>Total Deductions</p>
            <h2 style={{ margin: '8px 0' }}>₹{totalDeductions.toLocaleString()}</h2>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: 'warning.light' }}>
          <CardContent>
            <p style={{ color: '#666', margin: 0 }}>Statutory</p>
            <h2 style={{ margin: '8px 0' }}>₹{totalStatutory.toLocaleString()}</h2>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: 'info.light' }}>
          <CardContent>
            <p style={{ color: '#666', margin: 0 }}>Other</p>
            <h2 style={{ margin: '8px 0' }}>₹{totalOther.toLocaleString()}</h2>
          </CardContent>
        </Card>
      </Stack>

      {/* Deductions Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Component</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Can Override</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deductions.map((ded, idx) => (
              <TableRow key={ded.id}>
                <TableCell>
                  <span style={{ fontWeight: ded.isStatutory ? 600 : 'normal' }}>
                    {ded.component}
                  </span>
                </TableCell>
                <TableCell align="right">
                  {ded.editable ? (
                    <TextField
                      size="small"
                      type="number"
                      value={ded.amount}
                      onChange={(e) => handleDeductionChange(idx, 'amount', e.target.value)}
                      sx={{ width: '100px' }}
                    />
                  ) : (
                    <span sx={{ fontWeight: 600 }}>₹{ded.amount.toLocaleString()}</span>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={ded.isStatutory ? 'Statutory' : 'Other'}
                    color={ded.isStatutory ? 'warning' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Checkbox checked={ded.editable} disabled />
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                ₹{totalDeductions.toLocaleString()}
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <p style={{ marginTop: '16px', color: '#666', fontSize: '12px' }}>
        <strong>Statutory Deductions:</strong> PF, ESI, PT, and TDS are calculated based on employee salary structure and are locked from editing.
        <strong> Other Deductions:</strong> Loan recoveries and other non-statutory deductions can be modified as needed.
      </p>
    </Box>
  );
}