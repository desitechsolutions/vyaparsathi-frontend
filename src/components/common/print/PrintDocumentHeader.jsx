import React from 'react';
import { Box, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { generateQrPayload } from '../../../utils/qrCodeHelper';

export const formatDocNo = (str, defaultPrefix = 'DOC') => {
  if (!str) return '';
  // If raw timestamp string like PR-20260807134310 or GRN-20260807162556
  const match = str.match(/^(GRN|PR|PO)?-?(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/i);
  if (match) {
    const pfx = match[1] ? match[1].toUpperCase() : defaultPrefix;
    const year = match[2];
    const seq = match[7] ? match[7].padStart(6, '0') : '000001';
    return `${pfx}-${year}-${seq}`;
  }
  return str;
};

const PrintDocumentHeader = ({
  shop,
  documentTitle,
  documentSubtitle,
  documentNumber,
  documentDate,
  status,
  rawId,
  documentType = 'ERP_DOCUMENT'
}) => {
  const formattedNo = formatDocNo(documentNumber, documentType === 'GOODS_RECEIPT_NOTE' ? 'GRN' : 'PR');
  const qrData = generateQrPayload({
    documentType,
    documentNumber: formattedNo,
    shopId: shop?.id || 1,
    businessId: shop?.businessId || shop?.id || 1,
    documentId: rawId
  });

  return (
    <Box sx={{ pb: 1.2, mb: 1.2, borderBottom: '2px solid #000000', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        {/* Left Side: QR Code + Company Info */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '62%' }}>
          <Box sx={{ p: 0.4, border: '1px solid #000000', bgcolor: '#ffffff', flexShrink: 0 }}>
            <QRCodeSVG value={qrData} size={48} level="M" />
          </Box>

          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                textTransform: 'uppercase',
                fontSize: '1.05rem',
                letterSpacing: 0.2,
                color: '#000000',
                lineHeight: 1.2
              }}
            >
              {shop?.name || 'VYAPARSATHI RETAIL ERP'}
            </Typography>
            {shop?.address && (
              <Typography variant="body2" sx={{ color: '#000000', fontSize: '0.76rem', mt: 0.2, lineHeight: 1.2 }}>
                {shop.address}
              </Typography>
            )}
            {shop?.gstin && (
              <Typography variant="caption" sx={{ color: '#000000', fontSize: '0.72rem', display: 'block', mt: 0.2 }}>
                <strong>GSTIN:</strong> {shop.gstin || shop.gstNo}
              </Typography>
            )}
            {(shop?.phone || shop?.email) && (
              <Typography variant="caption" sx={{ color: '#000000', fontSize: '0.72rem', display: 'block' }}>
                {shop?.phone && <><strong>Phone:</strong> {shop.phone}</>}
                {shop?.phone && shop?.email && ' | '}
                {shop?.email && <><strong>Email:</strong> {shop.email}</>}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Right Side: Document Title & Prominent Number Box */}
        <Box sx={{ textAlign: 'right', width: '36%' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              textTransform: 'uppercase',
              fontSize: '1.15rem',
              color: '#000000',
              lineHeight: 1.1
            }}
          >
            {documentTitle}
          </Typography>
          {documentSubtitle && (
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#333333', textTransform: 'uppercase', display: 'block', mt: 0.2, fontSize: '0.66rem' }}>
              {documentSubtitle}
            </Typography>
          )}

          <Box sx={{ mt: 0.8, p: 0.6, border: '1.5px solid #000000', display: 'inline-block', width: '100%', maxWidth: 180, textAlign: 'center', bgcolor: '#fafafa' }}>
            <Typography variant="caption" sx={{ color: '#444444', display: 'block', fontSize: '0.62rem', fontWeight: 800 }}>
              DOCUMENT NO. & DATE
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '0.92rem', color: '#000000', my: 0.2 }}>
              {formattedNo}
            </Typography>
            {documentDate && (
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#000000' }}>
                Date: {documentDate}
              </Typography>
            )}
            {status && (
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#000000', mt: 0.2 }}>
                Status: {status}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PrintDocumentHeader;
