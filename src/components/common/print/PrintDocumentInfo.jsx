import React from 'react';
import { Box, Typography } from '@mui/material';

const PrintDocumentInfo = ({ supplier, references = [], isReturn = false }) => {
  // Filter out any references that have null/undefined/empty values unless strictly needed
  const activeReferences = references.filter(ref => ref && ref.value && ref.value !== 'N/A' && String(ref.value).trim() !== '');

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', width: '100%', mb: 1.2 }}>
      {/* Left Box: Vendor / Supplier Info (Stacked Format) */}
      <Box
        sx={{
          p: 1,
          border: '1px solid #000000',
          width: activeReferences.length > 0 ? '49.5%' : '100%',
          bgcolor: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
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
          {isReturn ? 'RETURN TO SUPPLIER (VENDOR)' : 'SUPPLIER / VENDOR DETAILS'}
        </Typography>
        
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#000000', fontSize: '0.88rem', lineHeight: 1.2 }}>
          {supplier?.name || supplier?.supplierName || ''}
        </Typography>
        
        {supplier?.address && (
          <Typography variant="body2" sx={{ color: '#000000', fontSize: '0.75rem', mt: 0.2, lineHeight: 1.2 }}>
            {supplier.address}
          </Typography>
        )}

        <Box sx={{ mt: 0.4 }}>
          {(supplier?.gstin || supplier?.gstNo) && (
            <Typography variant="caption" sx={{ color: '#000000', fontSize: '0.72rem', display: 'block' }}>
              <strong>GSTIN:</strong> {supplier.gstin || supplier.gstNo}
            </Typography>
          )}
          {(supplier?.phone || supplier?.email) && (
            <Typography variant="caption" sx={{ color: '#000000', fontSize: '0.72rem', display: 'block' }}>
              {supplier?.phone && <><strong>Phone:</strong> {supplier.phone}</>}
              {supplier?.phone && supplier?.email && ' | '}
              {supplier?.email && <><strong>Email:</strong> {supplier.email}</>}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Right Box: Document References (Only rendered if active references exist) */}
      {activeReferences.length > 0 && (
        <Box
          sx={{
            p: 1,
            border: '1px solid #000000',
            width: '49.5%',
            bgcolor: '#ffffff',
            boxSizing: 'border-box'
          }}
        >
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
            DOCUMENT & LOGISTICS REFERENCES
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', rowGap: 0.4 }}>
            {activeReferences.map((ref, idx) => (
              <Box key={idx} sx={{ width: '50%' }}>
                <Typography variant="caption" sx={{ color: '#444444', fontSize: '0.64rem', display: 'block' }}>
                  {ref.label}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: ref.highlight ? 900 : 700, color: '#000000', fontSize: '0.74rem' }}>
                  {ref.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PrintDocumentInfo;
