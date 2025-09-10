import React, { useState } from 'react';
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  fetchDailyReport,
  fetchSalesSummary,
  fetchGstSummary,
  fetchGstBreakdown,
} from '../../services/api';

// Helper function to format date to YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

const Reports = () => {
  // State for the currently selected report type
  const [reportType, setReportType] = useState('daily');
  // State for date inputs
  const [date, setDate] = useState(formatDate(new Date()));
  const [fromDate, setFromDate] = useState(formatDate(new Date()));
  const [toDate, setToDate] = useState(formatDate(new Date()));
  // State for fetched report data
  const [reportData, setReportData] = useState(null);
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Main function to handle fetching different reports
  const handleFetchReport = async () => {
    setLoading(true);
    setReportData(null); // Clear previous data
    setError(''); // Clear previous errors

    try {
      let res;
      switch (reportType) {
        case 'daily':
          res = await fetchDailyReport(date);
          break;
        case 'sales-summary':
          res = await fetchSalesSummary(fromDate, toDate);
          break;
        case 'gst-summary':
          res = await fetchGstSummary(fromDate, toDate);
          break;
        case 'gst-breakdown':
          res = await fetchGstBreakdown(fromDate, toDate);
          break;
        default:
          throw new Error('Invalid report type selected.');
      }
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to fetch report:', err);
      setError('Failed to fetch the report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4, color: 'primary.main' }}>
        Store Reports
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="report-type-label">Report Type</InputLabel>
              <Select
                labelId="report-type-label"
                id="report-type-select"
                value={reportType}
                label="Report Type"
                onChange={(e) => {
                  setReportType(e.target.value);
                  setReportData(null); // Clear data when report type changes
                }}
              >
                <MenuItem value="daily">Daily Report</MenuItem>
                <MenuItem value="sales-summary">Sales Summary</MenuItem>
                <MenuItem value="gst-summary">GST Summary</MenuItem>
                <MenuItem value="gst-breakdown">GST Breakdown</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Conditional date inputs */}
          {reportType === 'daily' ? (
            <Grid item xs={12} sm={4}>
              <TextField
                type="date"
                fullWidth
                label="Select Date"
                InputLabelProps={{ shrink: true }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Grid>
          ) : (
            <>
              <Grid item xs={12} sm={4}>
                <TextField
                  type="date"
                  fullWidth
                  label="From Date"
                  InputLabelProps={{ shrink: true }}
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  type="date"
                  fullWidth
                  label="To Date"
                  InputLabelProps={{ shrink: true }}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              onClick={handleFetchReport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Fetching...' : 'Fetch Report'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Display Section for Reports */}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {reportData && (
        <Box sx={{ mt: 4 }}>
          {/* Daily Report Display */}
          {reportType === 'daily' && (
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Daily Report for {date}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">Total Sales: <span style={{ fontWeight: 'bold' }}>₹{reportData.totalSales.toFixed(2)}</span></Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">Number of Sales: <span style={{ fontWeight: 'bold' }}>{reportData.numberOfSales}</span></Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Sales Summary Display */}
          {reportType === 'sales-summary' && (
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Sales Summary from {fromDate} to {toDate}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">Total Sales: <span style={{ fontWeight: 'bold' }}>₹{reportData.totalSales.toFixed(2)}</span></Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">Total Items Sold: <span style={{ fontWeight: 'bold' }}>{reportData.totalItemsSold}</span></Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">Total Discount: <span style={{ fontWeight: 'bold' }}>₹{reportData.totalDiscount.toFixed(2)}</span></Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">Number of Sales: <span style={{ fontWeight: 'bold' }}>{reportData.numberOfSales}</span></Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* GST Summary Display */}
          {reportType === 'gst-summary' && (
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>GST Summary from {fromDate} to {toDate}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">Total Taxable Value: <span style={{ fontWeight: 'bold' }}>₹{reportData.totalTaxableValue.toFixed(2)}</span></Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">Total GST: <span style={{ fontWeight: 'bold' }}>₹{reportData.totalGst.toFixed(2)}</span></Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">Total SGST: <span style={{ fontWeight: 'bold' }}>₹{reportData.totalSgst.toFixed(2)}</span></Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">Total CGST: <span style={{ fontWeight: 'bold' }}>₹{reportData.totalCgst.toFixed(2)}</span></Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">Total IGST: <span style={{ fontWeight: 'bold' }}>₹{reportData.totalIgst.toFixed(2)}</span></Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">Total UTGST: <span style={{ fontWeight: 'bold' }}>₹{reportData.totalUtgst.toFixed(2)}</span></Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* GST Breakdown Display */}
          {reportType === 'gst-breakdown' && (
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>GST Breakdown from {fromDate} to {toDate}</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>GST Rate</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Taxable Value</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Total GST</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">SGST</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">CGST</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">IGST</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">UTGST</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.gstRate}%</TableCell>
                        <TableCell align="right">₹{item.taxableValue.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{item.totalGst.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{item.sgst.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{item.cgst.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{item.igst.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{item.utgst.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {!reportData && !loading && !error && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Select a report type and date range, then click 'Fetch Report' to see the summary.
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Reports;
