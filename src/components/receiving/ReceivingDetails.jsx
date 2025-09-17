import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Tooltip,
  Avatar,
  Stack,
} from '@mui/material';
import Header from './Header';
import { formatDate } from '../../utils/utils';

const statusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'RECEIVED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'COMPLETED':
      return 'primary';
    case 'REJECTED':
      return 'error';
    default:
      return 'default';
  }
};

const ReceivingDetails = ({ receiving, poItems = [], onBack }) => {
  if (!receiving) {
    return (
      <Box>
        <Header title="Receiving Details" onBack={onBack} />
        <Typography sx={{ py: 5, textAlign: 'center', color: 'grey.500' }}>
          Record not found.
        </Typography>
      </Box>
    );
  }

  const getPoItem = (purchaseOrderItemId) =>
    poItems.find((item) => item.id === purchaseOrderItemId) || {};

  return (
    <Box>
      <Header title={`Receiving #${receiving.poNumber || receiving.id}`} onBack={onBack} />
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, bgcolor: 'grey.50', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
          Purchase Order Details
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'white', width: 44, height: 44 }}>
                {receiving.supplier?.name?.[0]?.toUpperCase() || 'S'}
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Supplier
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {receiving.supplier?.name || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {receiving.supplier?.address}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Contact: {receiving.supplier?.contactPerson || '-'} | {receiving.supplier?.phone || '-'}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              PO Number
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {receiving.poNumber || '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Receiving Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formatDate(receiving.receivedAt)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={receiving.status}
              size="medium"
              color={statusColor(receiving.status)}
              sx={{ fontWeight: 600, fontSize: 16, mt: 1 }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Received Items Breakdown
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {receiving.receivingItems && receiving.receivingItems.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Variant</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Price/Unit</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ordered Qty</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Received Qty</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Rejected Qty</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Damaged Qty</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
    {receiving.receivingItems.map((item, index) => {
      const poItem = getPoItem(item.purchaseOrderItemId);
      return (
        <TableRow key={index} hover>
          <TableCell>
            <Tooltip title={poItem.name || poItem.itemName || '-'}>
              <span>{poItem.name || poItem.itemName || '-'}</span>
            </Tooltip>
          </TableCell>
           <TableCell>
            {poItem.sku || '-'}
          </TableCell>
          <TableCell>{poItem.unitCost}</TableCell>
          <TableCell align="center">{item.expectedQty ?? '-'}</TableCell>
          <TableCell align="center">{item.receivedQty ?? '-'}</TableCell>
          <TableCell align="center">{item.rejectedQty ?? '-'}</TableCell>
          <TableCell align="center">{item.damagedQty ?? '-'}</TableCell>
          <TableCell>
            {item.rejectReason || item.damageReason || '-'}
          </TableCell>
          <TableCell>
            <Chip
              label={item.status || '-'}
              size="small"
              color={statusColor(item.status)}
              sx={{ fontWeight: 500 }}
            />
          </TableCell>
        </TableRow>
      );
    })}
  </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography sx={{ py: 3, textAlign: 'center', color: 'grey.500' }}>
            No items found for this receiving.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default ReceivingDetails;