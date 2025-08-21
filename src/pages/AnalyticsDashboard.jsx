import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';

// --- Mock API Functions to Simulate Backend Endpoints ---
const mockFetch = (data, delay = 500) => {
  return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

const mockFetchItemDemand = () => {
  const data = [
    { itemId: 1, itemName: "Widget A", predictedDemandNextMonth: 150, trend: "increasing" },
    { itemId: 2, itemName: "Gadget B", predictedDemandNextMonth: 80, trend: "decreasing" },
    { itemId: 3, itemName: "Thing C", predictedDemandNextMonth: 210, trend: "increasing" },
    { itemId: 4, itemName: "Gizmo D", predictedDemandNextMonth: 55, trend: "stable" },
    { itemId: 5, itemName: "Apparatus E", predictedDemandNextMonth: 180, trend: "stable" },
  ];
  return mockFetch(data);
};

const mockFetchCustomerTrends = () => {
  const data = [
    { customerId: 101, customerName: "Alice", buyingPattern: "weekly", frequentlyBoughtItems: ["Widget A", "Gizmo D"] },
    { customerId: 102, customerName: "Bob", buyingPattern: "monthly", frequentlyBoughtItems: ["Gadget B", "Apparatus E"] },
    { customerId: 103, customerName: "Charlie", buyingPattern: "seasonal", frequentlyBoughtItems: ["Thing C"] },
  ];
  return mockFetch(data);
};

const mockFetchTopItems = () => {
  const data = [
    { itemId: 3, itemName: "Thing C", changePercent: 12.5, rising: true },
    { itemId: 1, itemName: "Widget A", changePercent: 8.2, rising: true },
    { itemId: 2, itemName: "Gadget B", changePercent: -5.1, rising: false },
    { itemId: 5, itemName: "Apparatus E", changePercent: 2.1, rising: true },
  ];
  return mockFetch(data);
};

const mockFetchSeasonalTrends = () => {
  const data = [
    { season: "Summer", trendDescription: "Spike in demand for outdoor products." },
    { season: "Winter", trendDescription: "Increase in sales of heating appliances." },
    { season: "Spring", trendDescription: "Consistent demand for gardening supplies." },
  ];
  return mockFetch(data);
};

const mockFetchChurnPrediction = () => {
  const data = [
    { customerId: 201, customerName: "David", churnProbability: 0.75 },
    { customerId: 202, customerName: "Eve", churnProbability: 0.12 },
    { customerId: 203, customerName: "Frank", churnProbability: 0.48 },
  ];
  return mockFetch(data);
};

const mockFetchPurchaseOrders = () => {
  const data = [
    { itemId: 1, itemName: "Widget A", suggestedQuantity: 180.0 },
    { itemId: 3, itemName: "Thing C", suggestedQuantity: 250.0 },
  ];
  return mockFetch(data);
};

const CHART_COLORS = ['#3B82F6', '#6366F1', '#A78BFA', '#E879F9', '#EC4899', '#F472B6'];

const AnalyticsDashboard = () => {
  const [itemDemand, setItemDemand] = useState([]);
  const [customerTrends, setCustomerTrends] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [seasonalTrends, setSeasonalTrends] = useState([]);
  const [churnPrediction, setChurnPrediction] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          demandData, trendsData, topItemsData, seasonalData, churnData, purchaseData
        ] = await Promise.all([
          mockFetchItemDemand(),
          mockFetchCustomerTrends(),
          mockFetchTopItems(),
          mockFetchSeasonalTrends(),
          mockFetchChurnPrediction(),
          mockFetchPurchaseOrders(),
        ]);
        setItemDemand(demandData);
        setCustomerTrends(trendsData);
        setTopItems(topItemsData);
        setSeasonalTrends(seasonalData);
        setChurnPrediction(churnData);
        setPurchaseOrders(purchaseData);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = () => {
    alert("Exporting item demand analytics... (Functionality not implemented)");
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa', p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Business Analytics Dashboard
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExport}
            sx={{ borderRadius: 8, px: 4, fontWeight: 'bold' }}
          >
            Export Item Demand
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 300, justifyContent: 'center' }}>
            <CircularProgress size={48} color="primary" />
            <Typography variant="h6" sx={{ mt: 2 }}>Loading data...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Item Demand Analytics Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  Item Demand Prediction
                </Typography>
                <Box sx={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={itemDemand}>
                      <XAxis dataKey="itemName" stroke="#888" angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#888" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="predictedDemandNextMonth" name="Predicted Demand" fill="#3B82F6" barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Top Selling Items Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  Top Selling Items
                </Typography>
                <Box sx={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={topItems}>
                      <XAxis dataKey="itemName" stroke="#888" angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#888" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="changePercent" name="Change (%)" stroke="#A78BFA" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Churn Prediction Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  Customer Churn Risk
                </Typography>
                <Box sx={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={churnPrediction}
                        dataKey="churnProbability"
                        nameKey="customerName"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {
                          churnPrediction.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))
                        }
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Customer Trends Card */}
            <Grid item xs={12} md={12} lg={8}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  Customer Buying Trends
                </Typography>
                <Grid container spacing={2}>
                  {customerTrends.map(trend => (
                    <Grid item xs={12} md={4} key={trend.customerId}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                        <Typography fontWeight="bold">{trend.customerName}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                          Pattern: {trend.buyingPattern}
                        </Typography>
                        <Typography variant="body2">
                          <b>Freq. Items:</b> {trend.frequentlyBoughtItems.join(', ')}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* Seasonal Trends Card */}
            <Grid item xs={12} md={4} lg={4}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  Seasonal Trends
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {seasonalTrends.map((trend, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography fontWeight="bold">{trend.season}</Typography>
                    <Typography variant="body2" color="text.secondary">{trend.trendDescription}</Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>

            {/* Future Purchase Orders Card */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  Future Purchase Order Suggestions
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><b>Item ID</b></TableCell>
                        <TableCell><b>Item Name</b></TableCell>
                        <TableCell><b>Suggested Quantity</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchaseOrders.map((order, index) => (
                        <TableRow key={index}>
                          <TableCell>{order.itemId}</TableCell>
                          <TableCell>{order.itemName}</TableCell>
                          <TableCell>{order.suggestedQuantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard;