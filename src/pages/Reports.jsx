import React, { useState } from 'react';
import { TextField, Button, Paper, Typography } from '@mui/material';
import { fetchDailyReport } from '../services/api';

const Reports = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState({ totalSales: 0, numberOfSales: 0 });

  const handleFetchDaily = async () => {
    const res = await fetchDailyReport(date);
    setReport(res.data);
  };

  return (
    <Paper style={{ padding: '16px' }}>
      <Typography variant="h5" gutterBottom>Daily Report</Typography>
      <TextField type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Button variant="contained" onClick={handleFetchDaily}>Fetch Report</Button>
      <Typography variant="h6">Total Sales: ₹{report.totalSales}</Typography>
      <Typography variant="h6">Number of Sales: {report.numberOfSales}</Typography>
    </Paper>
  );
};

export default Reports;