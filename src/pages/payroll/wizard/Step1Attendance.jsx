import React, { useState, useEffect } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, MenuItem, Button, Stack, Card, CardContent, Alert, CircularProgress
} from '@mui/material';
import * as api from '../../../services/api';

const ATTENDANCE_TYPES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'PAID_LEAVE', 'UNPAID_LEAVE', 'HOLIDAY', 'WEEKEND'];

export default function Step1Attendance({ data, onDataChange, payrollRun }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payrollRun?.id) {
      fetchAttendanceData();
    }
  }, [payrollRun?.id]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await api.fetchEmployees();
      const enriched = (response.content || response).map(emp => ({
        id: emp.id,
        name: emp.name || emp.employeeName,
        totalDays: 30,
        workingDays: 26,
        presentDays: 25,
        paidLeaves: 0,
        lopDays: 1
      }));
      setEmployees(enriched);
      onDataChange({ attendanceData: enriched });
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (index, field, value) => {
    const updated = [...employees];
    updated[index][field] = parseFloat(value) || 0;
    setEmployees(updated);
    onDataChange({ attendanceData: updated });
  };

  const calculateLOPImpact = (employee) => {
    const dailyRate = (employee.presentDays > 0) ? 100 : 0;
    return ((employee.lopDays / employee.workingDays) * 100).toFixed(2);
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <h3>Step 1: Attendance & Loss of Pay (LOP)</h3>

      <Alert severity="info" sx={{ mb: 3 }}>
        Enter attendance for each employee. LOP (Loss of Pay) days will automatically reduce their salary calculation.
      </Alert>

      {/* Summary Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <p style={{ color: '#999', margin: 0 }}>Total Employees</p>
            <h2 style={{ margin: '8px 0' }}>{employees.length}</h2>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <p style={{ color: '#999', margin: 0 }}>Avg Present Days</p>
            <h2 style={{ margin: '8px 0' }}>
              {(employees.reduce((sum, e) => sum + e.presentDays, 0) / employees.length).toFixed(1)}
            </h2>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <p style={{ color: '#999', margin: 0 }}>Total LOP Impact</p>
            <h2 style={{ margin: '8px 0', color: '#f44336' }}>
              {employees.filter(e => e.lopDays > 0).length} employees
            </h2>
          </CardContent>
        </Card>
      </Stack>

      {/* Attendance Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Total Days</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Working Days</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Present Days</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Paid Leaves</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">LOP Days</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">LOP %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((emp, idx) => (
              <TableRow key={emp.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{emp.name}</TableCell>
                <TableCell align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={emp.totalDays}
                    onChange={(e) => handleAttendanceChange(idx, 'totalDays', e.target.value)}
                    sx={{ width: '80px' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={emp.workingDays}
                    onChange={(e) => handleAttendanceChange(idx, 'workingDays', e.target.value)}
                    sx={{ width: '80px' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={emp.presentDays}
                    onChange={(e) => handleAttendanceChange(idx, 'presentDays', e.target.value)}
                    sx={{ width: '80px' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={emp.paidLeaves}
                    onChange={(e) => handleAttendanceChange(idx, 'paidLeaves', e.target.value)}
                    sx={{ width: '80px' }}
                  />
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: emp.lopDays > 0 ? '#f44336' : 'inherit' }}>
                  {emp.lopDays}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: emp.lopDays > 0 ? '#f44336' : 'inherit' }}>
                  {calculateLOPImpact(emp)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <p style={{ marginTop: '16px', color: '#666', fontSize: '12px' }}>
        <strong>Note:</strong> LOP days automatically reduce salary proportionally. For example, 1 LOP day out of 26 working days = ~3.85% salary deduction.
      </p>
    </Box>
  );
}