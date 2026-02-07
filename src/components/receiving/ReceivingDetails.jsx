import React from 'react';
import {
  Box, Typography, Paper, Grid, Chip, TableContainer, Table, TableHead, 
  TableRow, TableCell, TableBody, Divider, Tooltip, Avatar, Stack, Card, CardContent
} from '@mui/material';
import Header from './Header';
import { formatDate } from '../../utils/utils';

// Icons
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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
      <Header title={`Receiving Slip: #${receiving.poNumber || receiving.id}`} onBack={onBack} />

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
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid #e0e0e0' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: 24 }}>
                {receiving.supplier?.name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{receiving.supplier?.name || 'Unknown Supplier'}</Typography>
                <Typography variant="body2" color="text.secondary">{receiving.supplier?.address}</Typography>
                <Chip label={`Status: ${receiving.status}`} color={statusColor(receiving.status)} size="small" sx={{ mt: 1, fontWeight: 'bold' }} />
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: { md: 'right' }, bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">RECORDED ON</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{formatDate(receiving.receivedAt)}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>By: {receiving.receivedBy || 'System Admin'}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 3. Detailed Breakdown Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Product Details</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Ordered</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: 'success.main' }}>Received</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: 'error.main' }}>Loss (D/R)</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Audit Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Justification</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {receiving.receivingItems?.map((item, index) => {
              const poItem = getPoItem(item.purchaseOrderItemId);
              const lossTotal = (item.damagedQty || 0) + (item.rejectedQty || 0);
              
              return (
                <TableRow key={index} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.25' } }}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{poItem.name || 'Item Not Found'}</Typography>
                    <Typography variant="caption" color="text.secondary">SKU: {poItem.sku || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell align="center">{item.expectedQty}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{item.receivedQty}</TableCell>
                  <TableCell align="center">
                    <Tooltip title={`Damaged: ${item.damagedQty} | Rejected: ${item.rejectedQty}`}>
                       <Typography variant="body2" color={lossTotal > 0 ? 'error.main' : 'text.primary'}>
                         {lossTotal}
                       </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Chip 
                          label={item.status} 
                          size="small" 
                          color={statusColor(item.status)} 
                          variant={item.status === 'RECEIVED' ? 'filled' : 'outlined'}
                        />
                        {item.isOveraged && (
                          <Tooltip title="Exceeded PO Quantity">
                            <WarningAmberIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    {item.isOveraged ? (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.dark', display: 'block' }}>
                          REASON: {item.overageReason?.replace('_', ' ')}
                        </Typography>
                        <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                          "{item.overageNotes || 'No notes provided'}"
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {item.notes || '-'}
                      </Typography>
                    )}
                  </TableCell>
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