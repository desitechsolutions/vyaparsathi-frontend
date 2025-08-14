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
} from '@mui/material';
import { fetchDailyReport } from '../services/api';

const Reports = () => {
  // State for the selected date, defaulting to today's date in YYYY-MM-DD format
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  // State for the report data
  const [report, setReport] = useState(null);
  // State for loading status
  const [loading, setLoading] = useState(false);
  // State for handling errors
  const [error, setError] = useState('');

  // Function to fetch the daily report from the API
  const handleFetchDaily = async () => {
    setLoading(true); // Start loading state
    setReport(null); // Clear previous report data
    setError(''); // Clear any previous errors

    try {
      // Assuming fetchDailyReport is a function from '../services/api' that returns a promise
      const res = await fetchDailyReport(date);
      // Update the report state with the fetched data
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch daily report:', err);
      // Set an error message if the API call fails
      setError('Failed to fetch daily report. Please try again.');
    } finally {
      setLoading(false); // End loading state, regardless of success or failure
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4, color: 'primary.main' }}>
        Daily Sales Report
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {/* Input section for selecting date and fetching report */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="h6" gutterBottom>
                Select a Date
              </Typography>
              <TextField
                type="date"
                fullWidth
                value={date}
                onChange={(e) => setDate(e.target.value)}
                variant="outlined"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleFetchDaily}
                disabled={loading}
                // Show a loading spinner inside the button while fetching
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {loading ? 'Fetching...' : 'Fetch Report'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Display section for the report results */}
        <Grid item xs={12}>
          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}

          {report && (
            <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
              {/* Card for Total Sales */}
              <Grid item xs={12} sm={6} md={4}>
                <Card elevation={3} sx={{ bgcolor: 'secondary.main', color: 'white', textAlign: 'center' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Total Sales
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                      ₹{report.totalSales.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Card for Number of Sales */}
              <Grid item xs={12} sm={6} md={4}>
                <Card elevation={3} sx={{ bgcolor: 'info.main', color: 'white', textAlign: 'center' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Number of Sales
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                      {report.numberOfSales}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {!report && !loading && !error && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Select a date and click 'Fetch Report' to see the daily summary.
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
