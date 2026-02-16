import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Avatar, useTheme } from '@mui/material';
import { AccountBalanceWallet, People, RequestQuote, Savings } from '@mui/icons-material';

const StatCard = ({ title, value, icon, colorName }) => {
  const theme = useTheme();
  const colorBase = theme.palette[colorName] || theme.palette.primary;

  return (
    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: `${colorBase.main}15`, color: colorBase.main, width: 56, height: 56 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={900}>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default function SalarySummaryCards({ data }) {
  // Logic updated to match your new Entity fields
  
  // 1. Total Monthly Liability (Sum of all base salaries)
  const totalBaseLiability = data.reduce((acc, curr) => acc + (curr.baseSalary || 0), 0);
  
  // 2. Active Staff Count
  const activeStaff = data.filter(i => i.active).length;

  // 3. Outstanding Advances (Staff Owed to Shop)
  const totalOutstandingAdvances = data.reduce((acc, curr) => acc + (curr.advanceBalance || 0), 0);

  // 4. Staff with Debt Count
  const staffWithDebt = data.filter(i => (i.advanceBalance || 0) > 0).length;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="Monthly Liability" 
          value={`₹${totalBaseLiability.toLocaleString()}`} 
          icon={<AccountBalanceWallet />} 
          colorName="primary" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="Active Staff" 
          value={activeStaff} 
          icon={<People />} 
          colorName="info" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="Total Advances" 
          value={`₹${totalOutstandingAdvances.toLocaleString()}`} 
          icon={<RequestQuote />} 
          colorName="error" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="Debt Exposure" 
          value={`${staffWithDebt} Staff`} 
          icon={<Savings />} 
          colorName="warning" 
        />
      </Grid>
    </Grid>
  );
}