import React from 'react';
import { Box, Typography } from '@mui/material';

const PrintSignatureGrid = ({ signatures = [] }) => {
  if (!signatures || signatures.length === 0) return null;

  const itemWidth = `${(100 / signatures.length).toFixed(1)}%`;

  return (
    <Box sx={{ mt: 2.5, pt: 1, pageBreakInside: 'avoid', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
        {signatures.map((sig, idx) => (
          <Box key={idx} sx={{ width: itemWidth, textAlign: 'center', px: 0.5, boxSizing: 'border-box' }}>
            <Typography variant="body2" sx={{ color: '#000000', fontFamily: 'monospace', letterSpacing: -1, mb: 0.3, fontSize: '0.8rem' }}>
              ____________________
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', display: 'block', fontSize: '0.72rem', color: '#000000' }}>
              {sig.title}
            </Typography>

            <Box sx={{ mt: 0.3, textAlign: 'center' }}>
              {sig.name && (
                <Typography variant="caption" sx={{ color: '#000000', display: 'block', fontSize: '0.66rem', fontWeight: 600 }}>
                  Name: {sig.name}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: '#555555', display: 'block', fontSize: '0.64rem', fontStyle: 'italic' }}>
                Signature & Date
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PrintSignatureGrid;
