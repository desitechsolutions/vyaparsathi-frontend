import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Container, Grid, Card, CardContent, 
  CardActionArea, Avatar, Stack, Divider, Chip
} from '@mui/material';
import {
  Today, BarChart, RequestPage, ListAlt,
  Category, Group, ReceiptLong, Payments,
  Assessment, ChevronRight, LocalShipping,
  Diamond as DiamondIcon, AccountBalance,
  ElectricalServices, DirectionsCar, Checkroom,
  EmojiEvents, PointOfSale,
} from '@mui/icons-material';
import { useShop } from '../../context/ShopContext';

const reportLinks = [
  { title: 'Accounting & P&L Statement', desc: 'Net Profit & Loss, Receivables & Payables Aging', icon: <AccountBalance />, path: 'accounting', color: '#059669' },
  { title: 'Daily Report', desc: 'Real-time daily sales & transactions', icon: <Today />, path: 'daily', color: '#3b82f6' },
  { title: 'Sales Summary', desc: 'Revenue trends over custom periods', icon: <BarChart />, path: 'sales-summary', color: '#10b981' },
  { title: 'GST Summary', desc: 'Consolidated tax liability view', icon: <Assessment />, path: 'gst-summary', color: '#8b5cf6' },
  { title: 'GST Breakdown', desc: 'Audit-ready itemized tax details', icon: <RequestPage />, path: 'gst-breakdown', color: '#f59e0b' },
  { title: 'Items Sold', desc: 'Top performing products & volume', icon: <ListAlt />, path: 'items-sold', color: '#ec4899' },
  { title: 'Category Sales', desc: 'Department-wise revenue split', icon: <Category />, path: 'category-sales', color: '#06b6d4' },
  { title: 'Customer Sales', desc: 'Top spending customers & loyalty', icon: <Group />, path: 'customer-sales', color: '#6366f1' },
  { title: 'Salesperson Leaderboard', desc: 'Ranks users by attributed sales', icon: <EmojiEvents />, path: 'salesperson-leaderboard', color: '#eab308' },
  { title: 'End-of-Day (Z-Report)', desc: 'Shift close-out + drawer reconciliation', icon: <PointOfSale />, path: 'z-report', color: '#f97316' },
  { title: 'Expenses Summary', desc: 'Operational outflow tracking', icon: <ReceiptLong />, path: 'expenses-summary', color: '#ef4444' },
  { title: 'Payments Summary', desc: 'Cash vs Digital collection split', icon: <Payments />, path: 'payments-summary', color: '#2dd4bf' },
];

const jewelleryReportLinks = [
  { title: 'High-Value Transactions', desc: 'Sales ≥ ₹2L with PAN records (IT Act Sec. 269ST)', icon: <DiamondIcon />, path: 'high-value-transactions', color: '#7c3aed' },
  { title: 'Purchase Register', desc: 'Gold/silver purchase receipts & purity records', icon: <LocalShipping />, path: 'purchase-register', color: '#d97706' },
];

const electronicsReportLinks = [
  { title: 'Purchase Register', desc: 'IMEI/serial number intake & supplier traceability', icon: <ElectricalServices />, path: 'purchase-register', color: '#0891b2' },
];

const automobileReportLinks = [
  { title: 'Purchase Register', desc: 'Part number & OEM supplier traceability', icon: <DirectionsCar />, path: 'purchase-register', color: '#92400e' },
];

const clothingReportLinks = [
  { title: 'Items Sold', desc: 'Size-wise & color-wise garment sales', icon: <Checkroom />, path: 'items-sold', color: '#be185d' },
];

const INDUSTRY_SECTION_CONFIG = {
  JEWELLERY: { links: jewelleryReportLinks, label: 'Jewellery & Compliance Reports', color: 'secondary' },
  ELECTRONICS: { links: electronicsReportLinks, label: 'Electronics Reports', color: 'info' },
  AUTOMOBILE: { links: automobileReportLinks, label: 'Automobile Parts Reports', color: 'warning' },
  CLOTHING: { links: clothingReportLinks, label: 'Clothing & Apparel Reports', color: 'success' },
};

const ReportsIndex = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { industryType } = useShop();

  const industrySectionConfig = INDUSTRY_SECTION_CONFIG[industryType];

  const renderCard = (report) => (
    <Grid item xs={12} sm={6} md={4} key={report.path}>
      <Card 
        elevation={0} 
        sx={{ 
          borderRadius: 4, 
          border: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: '0.3s',
          '&:hover': { 
            transform: 'translateY(-5px)', 
            boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 10px 20px rgba(0,0,0,0.5)' : '0 10px 20px rgba(0,0,0,0.05)',
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
                <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                  {report.title}
                </Typography>
              </Box>
              <ChevronRight sx={{ color: 'action.disabled' }} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {report.desc}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: { xs: 2, sm: 3, md: 4 } }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight={900} color="text.primary" gutterBottom>
            {t('reportsIndex.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('reportsIndex.subtitle')}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {reportLinks.map(renderCard)}
        </Grid>

        {/* Industry-Specific Reports Section */}
        {industrySectionConfig && (
          <Box sx={{ mt: 6 }}>
            <Divider sx={{ mb: 4 }}>
              <Chip
                label={industrySectionConfig.label}
                color={industrySectionConfig.color}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Divider>
            <Grid container spacing={3}>
              {industrySectionConfig.links.map(renderCard)}
            </Grid>
          </Box>
        )}

        {/* HSN Summary — shown for all industries for GST compliance */}
        <Box sx={{ mt: 6 }}>
          <Divider sx={{ mb: 4 }}>
            <Chip label="GST Compliance Reports" color="default" variant="outlined" sx={{ fontWeight: 700 }} />
          </Divider>
          <Grid container spacing={3}>
            {[
              { title: 'HSN Summary', desc: 'HSN-wise taxable value & GST for GSTR-1 filing', icon: <Assessment />, path: 'hsn-summary', color: '#0f766e' },
            ].map(renderCard)}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default ReportsIndex;