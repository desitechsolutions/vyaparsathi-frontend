import React from 'react';
import { Box, Typography } from '@mui/material';
import { useShop } from '../../context/ShopContext';
import { formatDate } from '../../utils/utils';
import PrintDocumentHeader from '../common/print/PrintDocumentHeader';
import PrintDocumentInfo from '../common/print/PrintDocumentInfo';
import PrintItemTable from '../common/print/PrintItemTable';
import PrintSummary from '../common/print/PrintSummary';
import PrintSignatureGrid from '../common/print/PrintSignatureGrid';
import PrintDocumentFooter from '../common/print/PrintDocumentFooter';

const GRNPrintDocument = ({ receiving }) => {
  const { shop } = useShop();

  if (!receiving) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Goods Receipt record not found.</Typography>
      </Box>
    );
  }

  // Calculate totals
  const totalAccepted = receiving.receivingItems?.reduce((sum, item) => {
    const accepted = item.acceptedQty ?? Math.max(0, (item.receivedQty || 0) - (item.damagedQty || 0) - (item.rejectedQty || 0));
    return sum + accepted;
  }, 0) || 0;

  const grandTotal = receiving.receivingItems?.reduce((sum, item) => {
    const accepted = item.acceptedQty ?? Math.max(0, (item.receivedQty || 0) - (item.damagedQty || 0) - (item.rejectedQty || 0));
    const cost = item.unitCost || 0;
    return sum + (cost * accepted);
  }, 0) || 0;

  // Prepare references - ONLY include when data actually exists!
  const references = [
    { label: 'GRN Number', value: receiving.grNumber || `#${receiving.id}`, highlight: true },
    { label: 'Receipt Date', value: formatDate(receiving.receivedAt) },
    receiving.poNumber && { label: 'Purchase Order #', value: receiving.poNumber },
    receiving.supplierInvoiceNo && {
      label: 'Supplier Invoice #',
      value: `${receiving.supplierInvoiceNo}${receiving.supplierInvoiceDate ? ` (${formatDate(receiving.supplierInvoiceDate)})` : ''}`
    },
    receiving.warehouseName && { label: 'Warehouse', value: receiving.warehouseName },
    receiving.vehicleNo && { label: 'Vehicle Number', value: receiving.vehicleNo },
    receiving.deliveryChallanNo && { label: 'Delivery Challan', value: receiving.deliveryChallanNo },
    receiving.receivedBy && { label: 'Received By', value: receiving.receivedBy },
    receiving.approvedByUserName && { label: 'Approved By', value: receiving.approvedByUserName },
    receiving.approvedAt && { label: 'Approved Date', value: formatDate(receiving.approvedAt) }
  ].filter(Boolean);

  // Signature Block configuration for Internal GRN
  const signatures = [
    { title: 'STORE RECEIVER', name: receiving.receivedBy || 'Store Staff' },
    { title: 'QUALITY INSPECTOR', name: 'QC Inspector' },
    { title: 'STORE MANAGER', name: receiving.approvedByUserName || 'Store Manager' }
  ];

  return (
    <Box
      className="printable-document-container"
      data-print-document="true"
      sx={{
        width: '100%',
        maxWidth: '210mm',
        mx: 'auto',
        p: '8mm 10mm',
        bgcolor: '#ffffff',
        color: '#000000',
        fontFamily: '"Courier New", Courier, monospace, sans-serif',
        boxSizing: 'border-box',
        // Force browser light rendering — prevents dark-mode Emotion styles
        // from bleeding through into printed output
        colorScheme: 'light',
      }}
    >
      {/* 1. BRANDING & TITLE HEADER */}
      <PrintDocumentHeader
        shop={shop}
        documentTitle="GOODS RECEIPT NOTE"
        documentSubtitle="INTERNAL WAREHOUSE INWARD SLIP"
        documentNumber={receiving.grNumber || `#${receiving.id}`}
        documentDate={formatDate(receiving.receivedAt)}
        status={receiving.status}
        rawId={receiving.id}
        documentType="GOODS_RECEIPT_NOTE"
      />

      {/* 2. VENDOR & LOGISTICS INFO */}
      <PrintDocumentInfo
        supplier={receiving.supplier}
        references={references}
        isReturn={false}
      />

      {/* 3. DYNAMIC ERP ITEMS TABLE */}
      <PrintItemTable
        items={receiving.receivingItems || []}
        isReturn={false}
      />

      {/* 4. VALUATION & AMOUNT IN WORDS */}
      <PrintSummary
        totalQty={totalAccepted}
        grandTotal={grandTotal}
        subtotal={grandTotal}
        notes={receiving.notes}
        isReturn={false}
        customQtyLabel="Total Accepted Stock Qty:"
      />

      {/* 5. AUTHORIZATION SIGNATURES */}
      <PrintSignatureGrid signatures={signatures} />

      {/* 6. SYSTEM FOOTER */}
      <PrintDocumentFooter shopName={shop?.name} documentName="Goods Receipt Note" />
    </Box>
  );
};

export default GRNPrintDocument;
