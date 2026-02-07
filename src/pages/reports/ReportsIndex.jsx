import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Grid, Card, CardContent, 
  CardActionArea, Avatar, Stack
} from '@mui/material';
import {
  Today, BarChart, RequestPage, ListAlt, 
  Category, Group, ReceiptLong, Payments, 
  Assessment, ChevronRight
} from '@mui/icons-material';

const reportLinks = [
  { title: 'Daily Report', desc: 'Real-time daily sales & transactions', icon: <Today />, path: 'daily', color: '#3b82f6' },
  { title: 'Sales Summary', desc: 'Revenue trends over custom periods', icon: <BarChart />, path: 'sales-summary', color: '#10b981' },
  { title: 'GST Summary', desc: 'Consolidated tax liability view', icon: <Assessment />, path: 'gst-summary', color: '#8b5cf6' },
  { title: 'GST Breakdown', desc: 'Audit-ready itemized tax details', icon: <RequestPage />, path: 'gst-breakdown', color: '#f59e0b' },
  { title: 'Items Sold', desc: 'Top performing products & volume', icon: <ListAlt />, path: 'items-sold', color: '#ec4899' },
  { title: 'Category Sales', desc: 'Department-wise revenue split', icon: <Category />, path: 'category-sales', color: '#06b6d4' },
  { title: 'Customer Sales', desc: 'Top spending customers & loyalty', icon: <Group />, path: 'customer-sales', color: '#6366f1' },
  { title: 'Expenses Summary', desc: 'Operational outflow tracking', icon: <ReceiptLong />, path: 'expenses-summary', color: '#ef4444' },
  { title: 'Payments Summary', desc: 'Cash vs Digital collection split', icon: <Payments />, path: 'payments-summary', color: '#2dd4bf' },
];

const ReportsIndex = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight={900} color="#0f172a" gutterBottom>
            Business Intelligence
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a specialized report module to analyze your store performance.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {reportLinks.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.path}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 4, 
                  border: '1px solid #e2e8f0', 
                  transition: '0.3s',
                  '&:hover': { 
                    transform: 'translateY(-5px)', 
                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                    borderColor: report.color 
                  } 
                }}
              >
                <CardActionArea onClick={() => navigate(report.path)} sx={{ p: 1 }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                      <Avatar 
                        sx={{ 
                          bgcolor: `${report.color}15`, 
                          color: report.color,
                          width: 48,
                          height: 48
                        }}
                      >
                        {report.icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={800} color="#1e293b">
                          {report.title}
                        </Typography>
                      </Box>
                      <ChevronRight sx={{ color: '#cbd5e1' }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {report.desc}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default ReportsIndex;