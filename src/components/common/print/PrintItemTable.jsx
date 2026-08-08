import React from 'react';
import { Box, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Typography } from '@mui/material';
import { formatDate } from '../../../utils/utils';

const PrintItemTable = ({ items = [], isReturn = false }) => {
  if (!items || items.length === 0) {
    return (
      <Box sx={{ p: 2, border: '1px solid #000000', my: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#555' }}>
          No item entries recorded.
        </Typography>
      </Box>
    );
  }

  // Detect column applicability
  const hasSku = items.some(item => !!item.sku);
  const hasBatch = items.some(item => !!item.batchNumber);
  const hasExpiry = items.some(item => !!item.expiryDate);
  const hasSerial = items.some(item => !!item.serialNumber);
  const hasReason = items.some(item => !!item.reason || !!item.rejectReason || !!item.damageReason || !!item.overageReason);

  const hasOrdered = items.some(item => item.expectedQty !== undefined && item.expectedQty !== null);
  const hasReceived = items.some(item => item.receivedQty !== undefined && item.receivedQty !== null);
  const hasAccepted = !isReturn && items.some(item => item.acceptedQty !== undefined || item.receivedQty !== undefined);
  const hasReturned = isReturn || items.some(item => (item.quantity !== undefined && item.quantity > 0));
  const hasLoss = !isReturn && items.some(item => ((item.damagedQty || 0) + (item.rejectedQty || 0)) > 0);

  return (
    <TableContainer component={Box} sx={{ my: 1.5, border: '1px solid #000000', borderRadius: 0 }}>
      <Table size="small" sx={{ borderCollapse: 'collapse', tableLayout: 'auto' }}>
        <TableHead>
          <TableRow sx={{ bgcolor: '#f0f0f0', borderBottom: '2px solid #000000' }}>
            <TableCell sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, borderRight: '1px solid #000000', fontSize: '0.72rem' }}>#</TableCell>
            <TableCell sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, borderRight: '1px solid #000000', fontSize: '0.72rem' }}>Item Description</TableCell>
            {hasSku && <TableCell sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, borderRight: '1px solid #000000', fontSize: '0.72rem' }}>SKU</TableCell>}
            {(hasBatch || hasExpiry) && <TableCell sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, borderRight: '1px solid #000000', fontSize: '0.72rem' }}>Batch / Exp</TableCell>}
            {hasSerial && <TableCell sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, borderRight: '1px solid #000000', fontSize: '0.72rem' }}>Serial / IMEI</TableCell>}
            {hasOrdered && <TableCell align="center" sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, borderRight: '1px solid #000000', fontSize: '0.72rem' }}>Ord Qty</TableCell>}
            {hasReceived && <TableCell align="center" sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, borderRight: '1px solid #000000', fontSize: '0.72rem' }}>Recv Qty</TableCell>}
            {hasAccepted && <TableCell align="center" sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, borderRight: '1px solid #000000', fontSize: '0.72rem' }}>Accp Qty</TableCell>}
            {hasReturned && <TableCell align="center" sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, borderRight: '1px solid #000000', fontSize: '0.72rem' }}>Ret Qty</TableCell>}
            {hasLoss && <TableCell align="center" sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, borderRight: '1px solid #000000', fontSize: '0.72rem' }}>Loss (D/R)</TableCell>}
            <TableCell align="right" sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, borderRight: '1px solid #000000', fontSize: '0.72rem' }}>Unit Cost (₹)</TableCell>
            <TableCell align="right" sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, borderRight: hasReason ? '1px solid #000000' : 'none', fontSize: '0.72rem' }}>Line Total (₹)</TableCell>
            {hasReason && <TableCell sx={{ fontWeight: 900, color: '#000000', py: 0.8, px: 0.8, fontSize: '0.72rem' }}>Remarks / Reason</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, idx) => {
            const accepted = item.acceptedQty ?? Math.max(0, (item.receivedQty || 0) - (item.damagedQty || 0) - (item.rejectedQty || 0));
            const retQty = item.quantity || 0;
            const lossTotal = (item.damagedQty || 0) + (item.rejectedQty || 0);
            const qtyForValuation = isReturn ? retQty : accepted;
            const cost = item.unitCost || 0;
            const lineTotal = item.totalCost || item.lineTotal || (cost * qtyForValuation);
            const reasonText = item.reason || item.rejectReason || item.damageReason || item.notes || item.overageNotes || '-';

            return (
              <TableRow key={idx} sx={{ borderBottom: '1px solid #000000', pageBreakInside: 'avoid' }}>
                <TableCell sx={{ py: 0.6, px: 0.8, color: '#000000', borderRight: '1px solid #000000', fontSize: '0.74rem' }}>{idx + 1}</TableCell>
                <TableCell sx={{ py: 0.6, px: 0.8, color: '#000000', borderRight: '1px solid #000000', fontSize: '0.74rem', fontWeight: 700 }}>
                  {item.name || item.itemVariantName || item.itemName || 'Product Variant'}
                </TableCell>
                {hasSku && <TableCell sx={{ py: 0.6, px: 0.8, color: '#000000', borderRight: '1px solid #000000', fontSize: '0.72rem', fontFamily: 'monospace' }}>{item.sku || '-'}</TableCell>}
                {(hasBatch || hasExpiry) && (
                  <TableCell sx={{ py: 0.6, px: 0.8, color: '#000000', borderRight: '1px solid #000000', fontSize: '0.72rem' }}>
                    {item.batchNumber || '-'} {item.expiryDate ? `(${formatDate(item.expiryDate)})` : ''}
                  </TableCell>
                )}
                {hasSerial && <TableCell sx={{ py: 0.6, px: 0.8, color: '#000000', borderRight: '1px solid #000000', fontSize: '0.72rem', fontFamily: 'monospace' }}>{item.serialNumber || '-'}</TableCell>}
                {hasOrdered && <TableCell align="center" sx={{ py: 0.6, px: 0.8, color: '#000000', borderRight: '1px solid #000000', fontSize: '0.74rem' }}>{item.expectedQty ?? '-'}</TableCell>}
                {hasReceived && <TableCell align="center" sx={{ py: 0.6, px: 0.8, color: '#000000', borderRight: '1px solid #000000', fontSize: '0.74rem' }}>{item.receivedQty ?? '-'}</TableCell>}
                {hasAccepted && <TableCell align="center" sx={{ py: 0.6, px: 0.8, color: '#000000', borderRight: '1px solid #000000', fontSize: '0.74rem', fontWeight: 800 }}>{accepted}</TableCell>}
                {hasReturned && <TableCell align="center" sx={{ py: 0.6, px: 0.8, color: '#000000', borderRight: '1px solid #000000', fontSize: '0.74rem', fontWeight: 800 }}>{retQty}</TableCell>}
                {hasLoss && <TableCell align="center" sx={{ py: 0.6, px: 0.8, color: '#000000', borderRight: '1px solid #000000', fontSize: '0.74rem' }}>{lossTotal}</TableCell>}
                <TableCell align="right" sx={{ py: 0.6, px: 0.8, color: '#000000', borderRight: '1px solid #000000', fontSize: '0.74rem' }}>₹{Number(cost).toFixed(2)}</TableCell>
                <TableCell align="right" sx={{ py: 0.6, px: 0.8, color: '#000000', borderRight: hasReason ? '1px solid #000000' : 'none', fontSize: '0.74rem', fontWeight: 800 }}>₹{Number(lineTotal).toFixed(2)}</TableCell>
                {hasReason && <TableCell sx={{ py: 0.6, px: 0.8, color: '#000000', fontSize: '0.72rem', fontStyle: 'italic' }}>{reasonText}</TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PrintItemTable;
