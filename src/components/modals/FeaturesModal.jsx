import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Grid, Card, CardContent,
  Typography, Box, Avatar, Stack, useTheme, useMediaQuery, Tabs, Tab
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';

const FeaturesModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tab, setTab] = useState(0);

  const modules = [
    {
      title: 'Inventory Management',
      icon: InventoryIcon,
      color: '#3b82f6',
      description: 'Real-time stock tracking and automated alerts',
      features: [
        'Item Database with SKU & Barcode',
        'Real-time Stock Tracking',
        'Low Stock Alerts',
        'Purchase Order Management',
        'Expiry Date Tracking',
        'Multi-warehouse Support'
      ]
    },
    {
      title: 'Sales & Billing',
      icon: PointOfSaleIcon,
      color: '#10b981',
      description: 'GST-compliant billing with delivery tracking',
      features: [
        'GST-Compliant Invoices',
        'E-Invoice Generation',
        'Payment Methods Support',
        'Delivery Management',
        'Customer Ledger',
        'Return Management'
      ]
    },
    {
      title: 'Financial Analytics',
      icon: AccountBalanceIcon,
      color: '#f59e0b',
      description: 'Comprehensive financial reporting and insights',
      features: [
        'Daily Cash Book',
        'Expense Tracking',
        'Tax Compliance Reports',
        'Profit & Loss Analysis',
        'GST Summary Reports',
        'Financial Dashboard'
      ]
    },
    {
      title: 'Reports & Analytics',
      icon: AssessmentIcon,
      color: '#8b5cf6',
      description: 'In-depth business insights and trends',
      features: [
        'Sales Reports',
        'Category Analysis',
        'Customer Insights',
        'Inventory Reports',
        'Custom Report Builder',
        'Export to Excel/PDF'
      ]
    },
    {
      title: 'Workforce Management',
      icon: PeopleIcon,
      color: '#ec4899',
      description: 'Employee and payroll management',
      features: [
        'Staff Management',
        'Role-Based Access',
        'Attendance Tracking',
        'Payroll Processing',
        'Performance Metrics',
        'Leave Management'
      ]
    },
    {
      title: 'Enterprise Features',
      icon: SecurityIcon,
      color: '#6366f1',
      description: 'Security and reliability',
      features: [
        '256-bit SSL Encryption',
        'Daily Automated Backups',
        'Multi-user Support',
        'Audit Logs',
        'Data Recovery',
        '99.9% Uptime SLA'
      ]
    }
  ];

  const currentModule = modules[tab];
  const Icon = currentModule.icon;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ pb: 0, pt: 3, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={900}>Powerful Features Built for Growth</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Everything you need to scale your business</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, overflowX: 'auto' }}>
          <Tabs 
            value={tab} 
            onChange={(e, newTab) => setTab(newTab)}
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons={isMobile ? 'auto' : false}
            sx={{
              '& .MuiTab-root': { 
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                py: 2
              },
              '& .Mui-selected': { color: 'primary.main' }
            }}
          >
            {modules.map((m, idx) => (
              <Tab key={idx} label={m.title} />
            ))}
          </Tabs>
        </Box>

        {/* Module Content */}
        <Grid container spacing={3}>
          {/* Left: Module Info */}
          <Grid item xs={12} md={5}>
            <Box sx={{ mb: 3 }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: currentModule.color + '20',
                  mb: 2
                }}
              >
                <Icon sx={{ fontSize: 45, color: currentModule.color }} />
              </Avatar>
              <Typography variant="h4" fontWeight={900} gutterBottom>
                {currentModule.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>
                {currentModule.description}
              </Typography>

              {/* Feature List */}
              <Stack spacing={1.5}>
                {currentModule.features.map((feature, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: currentModule.color,
                        flexShrink: 0
                      }} 
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {feature}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Right: Visual Cards */}
          <Grid item xs={12} md={7}>
            <Grid container spacing={2}>
              {modules.map((module, idx) => {
                const ModuleIcon = module.icon;
                const isActive = idx === tab;
                return (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        border: isActive ? `2px solid ${theme.palette.primary.main}` : '1px solid #e2e8f0',
                        bgcolor: isActive ? '#f0f4ff' : 'background.paper',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                          borderColor: 'primary.main'
                        }
                      }}
                      onClick={() => setTab(idx)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Avatar 
                          sx={{ 
                            width: 60, 
                            height: 60, 
                            bgcolor: module.color + '15',
                            mx: 'auto',
                            mb: 2
                          }}
                        >
                          <ModuleIcon sx={{ color: module.color }} />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                          {module.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {module.features.length} Features
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default FeaturesModal;
