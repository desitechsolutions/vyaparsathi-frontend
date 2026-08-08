import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import numberToWords from '../../../utils/numberToWords';

const PrintSummary = ({
  totalQty,
  grandTotal,
  subtotal,
  discount,
  cgst,
  sgst,
  igst,
  otherCharges,
  notes,
  returnReason,
  isReturn = false,
  customQtyLabel
}) => {
  const words = numberToWords(grandTotal);
  const hasNotes = !!(notes && notes.trim().length > 0);
  const hasReason = !!(returnReason && returnReason.trim().length > 0);
  const showRemarksSection = hasNotes || hasReason;

  return (
    <Box sx={{ my: 1.2, pageBreakInside: 'avoid' }}>
      {/* 1. Remarks Section (Rendered ONLY when content exists) */}
      {showRemarksSection && (
        <Box sx={{ p: 1, border: '1px solid #000000', mb: 1.2, bgcolor: '#ffffff' }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 900,
              color: '#000000',
              textTransform: 'uppercase',
              display: 'block',
              fontSize: '0.68rem',
              borderBottom: '1px solid #000000',
              pb: 0.2,
              mb: 0.4
            }}
          >
            {isReturn ? 'RETURN REASON & REMARKS' : 'INSPECTION REMARKS'}
          </Typography>
          {hasReason && (
            <Typography variant="body2" sx={{ fontSize: '0.76rem', color: '#000000', fontWeight: 700, mb: 0.2 }}>
              Reason: {returnReason.trim()}
            </Typography>
          )}
          {hasNotes && (
            <Typography variant="body2" sx={{ fontSize: '0.76rem', color: '#000000' }}>
              {notes.trim()}
            </Typography>
          )}
        </Box>
      )}

      {/* 2. Financial Summary Box */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 1 }}>
        <Box sx={{ p: 1, border: '1px solid #000000', width: '100%', maxWidth: 320, bgcolor: '#fafafa', boxSizing: 'border-box' }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 900,
              color: '#000000',
              textTransform: 'uppercase',
              display: 'block',
              fontSize: '0.68rem',
              borderBottom: '1px solid #000000',
              pb: 0.2,
              mb: 0.5
            }}
          >
            FINANCIAL SUMMARY
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#000000' }}>
              {customQtyLabel || (isReturn ? 'Total Returned Qty:' : 'Total Accepted Qty:')}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#000000' }}>
              {totalQty || 0} Units
            </Typography>
          </Box>

          {subtotal !== undefined && subtotal > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.74rem', color: '#000000' }}>Subtotal:</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.76rem', color: '#000000' }}>₹{Number(subtotal).toFixed(2)}</Typography>
            </Box>
          )}

          {discount !== undefined && discount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.74rem', color: '#000000' }}>Discount:</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.76rem', color: '#000000' }}>- ₹{Number(discount).toFixed(2)}</Typography>
            </Box>
          )}

          {cgst !== undefined && cgst > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.74rem', color: '#000000' }}>CGST:</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.76rem', color: '#000000' }}>+ ₹{Number(cgst).toFixed(2)}</Typography>
            </Box>
          )}

          {sgst !== undefined && sgst > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.74rem', color: '#000000' }}>SGST:</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.76rem', color: '#000000' }}>+ ₹{Number(sgst).toFixed(2)}</Typography>
            </Box>
          )}

          {igst !== undefined && igst > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.74rem', color: '#000000' }}>IGST:</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.76rem', color: '#000000' }}>+ ₹{Number(igst).toFixed(2)}</Typography>
            </Box>
          )}

          {otherCharges !== undefined && otherCharges > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.74rem', color: '#000000' }}>Other Charges:</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.76rem', color: '#000000' }}>+ ₹{Number(otherCharges).toFixed(2)}</Typography>
            </Box>
          )}

          <Divider sx={{ my: 0.5, borderColor: '#000000' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: '0.82rem', textTransform: 'uppercase', color: '#000000' }}>
              {isReturn ? 'TOTAL DEBIT:' : 'GRAND TOTAL:'}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: '0.92rem', color: '#000000' }}>
              ₹{Number(grandTotal || 0).toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 3. Amount in Words (Dedicated Highlighted Section) */}
      <Box sx={{ p: 0.8, border: '1.5px solid #000000', bgcolor: '#ffffff' }}>
        <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', color: '#000000', fontSize: '0.7rem' }}>
          AMOUNT IN WORDS:
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 900, color: '#000000', fontSize: '0.82rem', ml: 1, display: 'inline' }}>
          {words}
        </Typography>
      </Box>
    </Box>
  );
};

export default PrintSummary;
