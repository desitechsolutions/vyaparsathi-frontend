import React from 'react';
import {
  Box, Typography, Paper, Grid, Chip, TableContainer, Table, TableHead, 
  TableRow, TableCell, TableBody, Divider, Tooltip, Avatar, Stack, Card, CardContent, Button
} from '@mui/material';
import Header from './Header';
import { formatDate } from '../../utils/utils';

// Icons
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PrintIcon from '@mui/icons-material/Print';

const statusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'RECEIVED': return 'success';
    case 'PENDING': return 'warning';
    case 'COMPLETED': return 'primary';
    case 'REJECTED': return 'error';
    case 'PARTIALLY_RECEIVED': return 'info';
    default: return 'default';
  }
};

const ReceivingDetails = ({ receiving, poItems = [], onBack }) => {
  if (!receiving) {
    return (
      <Box>
        <Header title="Receiving Details" onBack={onBack} />
        <Typography sx={{ py: 5, textAlign: 'center', color: 'grey.500' }}>Record not found.</Typography>
      </Box>
    );
  }

  const getPoItem = (purchaseOrderItemId) =>
    poItems.find((item) => item.id === purchaseOrderItemId) || {};

  // Calculate High-level Metrics
  const summary = receiving.receivingItems?.reduce((acc, item) => ({
    totalRec: acc.totalRec + (item.receivedQty || 0),
    totalLoss: acc.totalLoss + (item.rejectedQty || 0) + (item.damagedQty || 0),
    overageCount: acc.overageCount + (item.isOveraged ? 1 : 0)
  }), { totalRec: 0, totalLoss: 0, overageCount: 0 });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Header title={`Receiving Slip: ${receiving.grNumber || '#' + (receiving.poNumber || receiving.id)}`} onBack={onBack} />
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={() => window.open(`/receivings/${receiving.id}/print`, '_blank')}
          sx={{ fontWeight: 700 }}
        >
          Print GRN Note
        </Button>
      </Stack>

      {/* 1. Metric Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Received', val: summary?.totalRec, icon: <CheckCircleIcon />, color: 'success.main' },
          { label: 'Damaged/Rejected', val: summary?.totalLoss, icon: <ErrorOutlineIcon />, color: 'error.main' },
          { label: 'Overage Items', val: summary?.overageCount, icon: <WarningAmberIcon />, color: 'warning.main' }
        ].map((item, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: `5px solid`, borderColor: item.color }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
                <Box sx={{ color: item.color }}>{item.icon}</Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{item.val}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 2. Primary Details Header */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: 24, color: 'primary.contrastText' }}>
                {receiving.supplier?.name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>{receiving.supplier?.name || 'Unknown Supplier'}</Typography>
                <Typography variant="body2" color="text.secondary">{receiving.supplier?.address}</Typography>
                <Chip label={`Status: ${receiving.status}`} color={statusColor(receiving.status)} size="small" sx={{ mt: 1, fontWeight: 'bold' }} />
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>VENDOR INVOICE & LOGISTICS</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: 'text.primary' }}>
                Invoice #: {receiving.supplierInvoiceNo || 'N/A'} {receiving.supplierInvoiceDate ? `(${formatDate(receiving.supplierInvoiceDate)})` : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Vehicle #: {receiving.vehicleNo || 'N/A'} | Challan #: {receiving.deliveryChallanNo || 'N/A'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { md: 'right' }, bgcolor: 'action.hover', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>AUDIT & APPROVAL</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: 'text.primary' }}>Recorded: {formatDate(receiving.receivedAt)} ({receiving.receivedBy || 'Staff'})</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Approved By: {receiving.approvedByUserName || 'System Manager'} {receiving.approvedAt ? `at ${formatDate(receiving.approvedAt)}` : ''}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 3. Detailed Breakdown Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Product Details</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary' }}>Ordered</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary' }}>Received</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: 'success.main' }}>Accepted</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: 'error.main' }}>Loss (D/R)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>Unit Cost (₹)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>Line Total (₹)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {receiving.receivingItems?.map((item, index) => {
              const poItem = getPoItem(item.purchaseOrderItemId);
              const lossTotal = (item.damagedQty || 0) + (item.rejectedQty || 0);
              const accepted = item.acceptedQty ?? Math.max(0, (item.receivedQty || 0) - lossTotal);
              const cost = item.unitCost || poItem.unitCost || 0;
              const total = item.lineTotal || (cost * accepted);
              const displayName = item.name || item.itemName || item.itemVariantName || poItem.name || poItem.itemName || 'Item';
              const description = item.notes || item.description || poItem.description;
              
              return (
                <TableRow key={index} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {displayName}
                    </Typography>
                    {description && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                        {description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      SKU: {item.sku || poItem.sku || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ color: 'text.primary' }}>{item.expectedQty}</TableCell>
                  <TableCell align="center" sx={{ color: 'text.primary' }}>{item.receivedQty}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'success.main' }}>{accepted}</TableCell>
                  <TableCell align="center">
                    <Tooltip title={`Damaged: ${item.damagedQty || 0} | Rejected: ${item.rejectedQty || 0}`}>
                       <Typography variant="body2" color={lossTotal > 0 ? 'error.main' : 'text.primary'}>
                         {lossTotal}
                       </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.primary' }}>₹{Number(cost).toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>₹{Number(total).toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 4. Global Notes Footer */}
      {receiving.notes && (
        <Paper variant="outlined" sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'info.soft', borderColor: 'info.light' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <InfoOutlinedIcon fontSize="small" color="info" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Global Receiving Notes</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">{receiving.notes}</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ReceivingDetails;