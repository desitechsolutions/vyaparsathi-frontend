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

const PurchaseReturnPrintDocument = ({ purchaseReturn }) => {
  const { shop } = useShop();

  if (!purchaseReturn) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Purchase Return record not found.</Typography>
      </Box>
    );
  }

  const totalQty = purchaseReturn.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  const grandTotal = purchaseReturn.totalAmount || purchaseReturn.items?.reduce((sum, item) => sum + ((item.unitCost || 0) * (item.quantity || 0)), 0) || 0;

  // Prepare references - ONLY include when data exists!
  const references = [
    { label: 'Return Note #', value: purchaseReturn.returnNo || `#${purchaseReturn.id}`, highlight: true },
    { label: 'Return Date', value: formatDate(purchaseReturn.returnDate) },
    (purchaseReturn.receivingGrNumber || purchaseReturn.receivingId) && {
      label: 'Linked GRN #',
      value: purchaseReturn.receivingGrNumber || `#${purchaseReturn.receivingId}`
    },
    (purchaseReturn.poNumber || purchaseReturn.purchaseOrderId) && {
      label: 'Linked PO #',
      value: purchaseReturn.poNumber || `#${purchaseReturn.purchaseOrderId}`
    },
    purchaseReturn.supplierInvoiceNo && {
      label: 'Supplier Invoice #',
      value: `${purchaseReturn.supplierInvoiceNo}${purchaseReturn.supplierInvoiceDate ? ` (${formatDate(purchaseReturn.supplierInvoiceDate)})` : ''}`
    },
    purchaseReturn.status && { label: 'Debit Note Status', value: purchaseReturn.status, highlight: true },
    purchaseReturn.transporterName && { label: 'Transporter', value: purchaseReturn.transporterName },
    purchaseReturn.vehicleNo && { label: 'Vehicle Number', value: purchaseReturn.vehicleNo },
    purchaseReturn.driverName && { label: 'Driver Name', value: purchaseReturn.driverName },
    purchaseReturn.approvedByUserName && { label: 'Approved By', value: purchaseReturn.approvedByUserName },
    purchaseReturn.approvedAt && { label: 'Approved Date', value: formatDate(purchaseReturn.approvedAt) }
  ].filter(Boolean);

  // Signature Block configuration for External Goods Return Note (4 Columns)
  const signatures = [
    { title: 'PREPARED / DISPATCHED BY', name: 'Store Staff' },
    { title: 'STORE MANAGER', name: purchaseReturn.approvedByUserName || 'Store Manager' },
    { title: 'DRIVER / TRANSPORTER', name: purchaseReturn.driverName || purchaseReturn.transporterName || 'Carrier' },
    { title: 'SUPPLIER RECEIVER', name: 'Vendor Stamp & Sign' }
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
        documentTitle="GOODS RETURN NOTE"
        documentSubtitle="OFFICIAL SUPPLIER RETURN CHALLAN & DEBIT NOTE"
        documentNumber={purchaseReturn.returnNo || `#${purchaseReturn.id}`}
        documentDate={formatDate(purchaseReturn.returnDate)}
        status={purchaseReturn.status}
        rawId={purchaseReturn.id}
        documentType="PURCHASE_RETURN"
      />

      {/* 2. VENDOR & LOGISTICS INFO */}
      <PrintDocumentInfo
        supplier={purchaseReturn.supplier || { name: purchaseReturn.supplierName }}
        references={references}
        isReturn={true}
      />

      {/* 3. DYNAMIC ERP ITEMS TABLE */}
      <PrintItemTable
        items={purchaseReturn.items || []}
        isReturn={true}
      />

      {/* 4. VALUATION & AMOUNT IN WORDS */}
      <PrintSummary
        totalQty={totalQty}
        grandTotal={grandTotal}
        subtotal={grandTotal}
        notes={purchaseReturn.notes}
        returnReason={purchaseReturn.reason || purchaseReturn.returnReason}
        isReturn={true}
        customQtyLabel="Total Returned Stock Qty:"
      />

      {/* 5. AUTHORIZATION & ACKNOWLEDGMENT SIGNATURES */}
      <PrintSignatureGrid signatures={signatures} />

      {/* 6. SYSTEM FOOTER */}
      <PrintDocumentFooter shopName={shop?.name} documentName="Goods Return Note / Debit Note" />
    </Box>
  );
};

export default PurchaseReturnPrintDocument;
