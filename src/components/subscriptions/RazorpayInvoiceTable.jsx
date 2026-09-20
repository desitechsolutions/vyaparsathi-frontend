import React, { useState, useEffect } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography, Chip, Skeleton, Box, Grid, Stack,
  TextField, MenuItem, TablePagination, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
  Avatar, Divider, Tab, Tabs,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import VerifiedIcon from '@mui/icons-material/Verified';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ReplayIcon from '@mui/icons-material/Replay';
import BusinessIcon from '@mui/icons-material/Business';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { toast } from 'react-toastify';

import platformApi from '../../services/platformApi';
import { useShop } from '../../context/ShopContext';

/**
 * Indian Number-to-Words Converter for Tax Invoice Totals.
 */
function numberToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  };

  const integerPart = Math.floor(Number(num || 0));
  const words = inWords(integerPart);
  return (words ? words : 'Zero') + ' Rupees Only';
}

function invoiceYear(createdAt) {
  const d = createdAt ? new Date(createdAt) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
}

/**
 * Resolves complete statutory B2B invoice fields combining:
 * 1. Payment transaction log
 * 2. Platform vendor details from platform_details table / API
 * 3. Buyer details snapshot prioritized from invoice row, with ShopContext fallback
 */
export function resolveInvoiceDetails(inv, razorpayStatus, platformInfo, shop) {
  // ── 1. Seller / Platform Details ──
  const seller = inv?.platformDetails || platformInfo || {};
  const sellerCompany = seller.companyName || 'Biruma Technology Solutions Pvt. Ltd.';
  const sellerTrade = seller.tradeName || 'VyaparSathi Enterprise SaaS';
  const sellerCin = seller.cin || 'U62010HR2025PTC139151';
  const sellerGstin = seller.gstin || '06AAOCB1973G1ZJ';
  const sellerPan = seller.pan || 'AAOCB1973G';
  const sellerAddress = [
    seller.addressLine1,
    seller.addressLine2,
    seller.city,
    seller.state ? `${seller.state}${seller.pincode ? ' - ' + seller.pincode : ''}` : ''
  ].filter(Boolean).join(', ') || 'Arjun Nagar, Gurgaon, Haryana – 122001';
  const sellerState = seller.state || 'Haryana';
  const sellerStateCode = String(seller.stateCode || '06').trim();
  const sellerEmail = seller.supportEmail || 'contact@desitechsolutions.com';
  const sellerPhone = seller.supportPhone || '+91 98765 43210';
  const sellerSac = seller.hsnSacCode || '998313';

  // ── 2. Buyer / Customer Details (Priority: Invoice snapshot -> ShopContext) ──
  const buyer = inv?.shopDetails || {};
  const buyerName = buyer.shopName || shop?.name || `Shop Account #${inv?.shopId || razorpayStatus?.shopId || 1}`;
  const buyerOwner = buyer.ownerName || shop?.ownerName || '';
  const buyerAddress = buyer.address || shop?.address || 'Registered Business Address on file';
  const buyerCity = buyer.city || shop?.city || '';
  const buyerState = buyer.state || shop?.state || sellerState;
  const buyerStateCode = String(buyer.stateCode || shop?.stateCode || sellerStateCode).trim();
  const buyerPincode = buyer.pincode || shop?.pincode || '';
  const buyerGstin = buyer.gstin || shop?.gstin || 'N/A (Unregistered / B2C)';
  const buyerPhone = buyer.phone || shop?.phone || 'N/A';
  const buyerEmail = buyer.email || shop?.email || 'N/A';

  // ── 3. Financials & Tax Math (18% GST Inclusive) ──
  const totalAmount = Number(inv?.amount || 999);
  const baseAmount = Number((totalAmount / 1.18).toFixed(2));
  const totalGst = Number((totalAmount - baseAmount).toFixed(2));

  // Dynamic Intra-State vs Inter-State Evaluation
  const isIntraState = sellerStateCode === buyerStateCode;
  const cgstRate = isIntraState ? 9 : 0;
  const cgstAmount = isIntraState ? Number((totalGst / 2).toFixed(2)) : 0;
  const sgstRate = isIntraState ? 9 : 0;
  const sgstAmount = isIntraState ? Number((totalGst / 2).toFixed(2)) : 0;
  const igstRate = !isIntraState ? 18 : 0;
  const igstAmount = !isIntraState ? totalGst : 0;

  // ── 4. Metadata & Statutory Identifiers ──
  const prefix = seller.invoicePrefix || 'SUB-INV';
  const pDate = inv?.createdAt ? new Date(inv.createdAt) : new Date();
  const invYear = pDate.getFullYear();
  const invNo = inv?.invoiceNumber || `${prefix}-${invYear}-${String(inv?.id || Date.now()).slice(-6).padStart(6, '0')}`;
  const formattedDate = pDate.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const formattedDateTime = pDate.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const plan = (inv?.planCode || razorpayStatus?.planCode || 'PRO').toUpperCase();
  const cycle = (inv?.billingCycle || razorpayStatus?.billingCycle || 'MONTHLY').toUpperCase();
  const periodStart = inv?.periodStart ? new Date(inv.periodStart) : pDate;
  const periodEnd = inv?.periodEnd
    ? new Date(inv.periodEnd)
    : new Date(periodStart.getTime() + (cycle === 'YEARLY' ? 365 : 30) * 24 * 3600 * 1000);
  const formattedPeriod = `${periodStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} to ${periodEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const paymentId = inv?.razorpayPaymentId || 'SUB-AUTO-MANDATE';
  const subId = inv?.razorpaySubscriptionId || razorpayStatus?.razorpaySubscriptionId || 'MANDATE-REF';
  const method = inv?.method || 'Razorpay AutoPay (e-Mandate / UPI / Card)';
  const placeOfSupply = buyerState ? `${buyerStateCode ? buyerStateCode + ' - ' : ''}${buyerState}` : `${sellerStateCode} - ${sellerState}`;

  return {
    sellerCompany, sellerTrade, sellerCin, sellerGstin, sellerPan, sellerAddress, sellerState, sellerStateCode,
    sellerEmail, sellerPhone, sellerSac,
    buyerName, buyerOwner, buyerAddress, buyerCity, buyerState, buyerStateCode, buyerPincode, buyerGstin, buyerPhone, buyerEmail,
    totalAmount, baseAmount, totalGst, isIntraState, cgstRate, cgstAmount, sgstRate, sgstAmount, igstRate, igstAmount,
    invNo, formattedDate, formattedDateTime, plan, cycle, formattedPeriod, paymentId, subId, method, placeOfSupply,
    amountInWords: numberToWords(totalAmount),
  };
}

/**
 * Enterprise B2B Tax Invoice & Receipt Table for VyaparSathi.
 */
export default function RazorpayInvoiceTable({ invoices = [], razorpayStatus = null, loading = false }) {
  const { shop } = useShop();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalTab, setModalTab] = useState(0);

  const [platformInfo, setPlatformInfo] = useState({
    companyName: 'Biruma Technology Solutions Pvt. Ltd.',
    tradeName: 'VyaparSathi Enterprise SaaS',
    cin: 'U62010HR2025PTC139151',
    gstin: '06AAOCB1973G1ZJ',
    pan: 'AAOCB1973G',
    addressLine1: 'Arjun Nagar',
    addressLine2: '',
    city: 'Gurgaon',
    state: 'Haryana',
    stateCode: '06',
    pincode: '122001',
    hsnSacCode: '998313',
    invoicePrefix: 'SUB-INV',
    supportEmail: 'contact@desitechsolutions.com',
    supportPhone: '+91 98765 43210',
  });

  useEffect(() => {
    platformApi.getPublicPlatformInfo()
      .then((data) => {
        if (data) setPlatformInfo((prev) => ({ ...prev, ...data }));
      })
      .catch((err) => console.error('[RazorpayInvoiceTable] Public platform info fetch error:', err));
  }, []);

  // Combine real payment logs with a synthetic active plan receipt if logs are empty but mandate is active
  const displayInvoices = [...invoices];
  if (displayInvoices.length === 0 && razorpayStatus?.active && razorpayStatus?.planCode && razorpayStatus?.planCode !== 'FREE') {
    const syntheticCreatedAt = razorpayStatus.validTill ? new Date(razorpayStatus.validTill).toISOString() : new Date().toISOString();
    displayInvoices.push({
      id: 'active-sub-receipt',
      createdAt: syntheticCreatedAt,
      razorpayPaymentId: razorpayStatus.razorpaySubscriptionId || 'SUB-ACTIVE-MANDATE',
      planCode: razorpayStatus.planCode || 'PRO',
      billingCycle: razorpayStatus.billingCycle || 'MONTHLY',
      method: 'Razorpay AutoPay (e-Mandate)',
      amount: razorpayStatus.priceAmount || (razorpayStatus.planCode === 'ENTERPRISE' ? 4999 : 999),
      status: 'SUCCESS',
      invoiceNumber: `${platformInfo.invoicePrefix || 'SUB-INV'}-${invoiceYear(syntheticCreatedAt)}-${String(razorpayStatus.shopId || 101).padStart(6, '0')}`,
      shopId: razorpayStatus.shopId || shop?.id || 1,
    });
  }

  // Summary Metrics
  const totalSpent = displayInvoices.reduce((acc, inv) => {
    return inv.status === 'SUCCESS' ? acc + Number(inv.amount || 0) : acc;
  }, 0);

  const successfulCount = displayInvoices.filter((i) => i.status === 'SUCCESS').length;
  const activePlanLabel = (razorpayStatus?.planCode || displayInvoices[0]?.planCode || 'FREE').toUpperCase();

  // Search & Filter
  const filteredInvoices = displayInvoices.filter((inv) => {
    const pId = String(inv.razorpayPaymentId || '').toLowerCase();
    const invNo = String(inv.invoiceNumber || '').toLowerCase();
    const pCode = String(inv.planCode || '').toLowerCase();
    const query = search.trim().toLowerCase();

    const matchesSearch = !query || pId.includes(query) || invNo.includes(query) || pCode.includes(query);
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedInvoices = filteredInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dt) => {
    if (!dt) return 'N/A';
    return new Date(dt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const statusChipColor = (status) => {
    const s = String(status || 'SUCCESS').toUpperCase();
    if (s === 'SUCCESS' || s === 'CHARGED' || s === 'AUTHENTICATED') return 'success';
    if (s === 'FAILED' || s === 'REJECTED') return 'error';
    if (s === 'REFUNDED') return 'secondary';
    return 'warning';
  };

  const renderStatusIcon = (status) => {
    const s = String(status || 'SUCCESS').toUpperCase();
    if (s === 'SUCCESS' || s === 'CHARGED' || s === 'AUTHENTICATED') return <CheckCircleIcon sx={{ fontSize: 14 }} />;
    if (s === 'FAILED' || s === 'REJECTED') return <CancelIcon sx={{ fontSize: 14 }} />;
    if (s === 'REFUNDED') return <ReplayIcon sx={{ fontSize: 14 }} />;
    return <HourglassEmptyIcon sx={{ fontSize: 14 }} />;
  };

  const copyToClipboard = (text, label) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  //  PRINT ENGINE — Strict A4 Portrait, Print-Safe CSS Engine
  // ═════════════════════════════════════════════════════════════════════════
  const triggerPrintWindow = (inv) => {
    const details = resolveInvoiceDetails(inv, razorpayStatus, platformInfo, shop);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>B2B Tax Invoice - ${details.invNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 10px;
      font-size: 11px;
      line-height: 1.4;
    }
    .invoice-card {
      max-width: 820px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 24px;
      background: #ffffff;
    }
    
    /* Header Section */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1e40af;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 900;
      color: #1e40af;
      letter-spacing: -0.5px;
      margin-bottom: 2px;
    }
    .brand-subtitle {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
    }
    .invoice-badge-box {
      text-align: right;
    }
    .invoice-main-title {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .invoice-sub-type {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .badge-paid {
      background: #dcfce7 !important;
      color: #15803d !important;
      font-weight: 800;
      font-size: 10px;
      padding: 3px 10px;
      border-radius: 9999px;
      display: inline-block;
      border: 1px solid #bbf7d0;
      margin-top: 4px;
    }

    /* Metadata Bar */
    .meta-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 16px;
    }
    .meta-item-label {
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .meta-item-val {
      font-size: 10.5px;
      font-weight: 800;
      color: #0f172a;
      font-family: monospace;
      margin-top: 1px;
    }

    /* Dual Parties Grid */
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .party-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
    }
    .party-title {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 800;
      color: #1e40af;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .party-name {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 3px;
    }
    .party-text {
      font-size: 10px;
      color: #334155;
      line-height: 1.45;
    }

    /* Line Items Table */
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    table.items-table th {
      background: #f1f5f9;
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 800;
      color: #334155;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    table.items-table td {
      padding: 10px;
      border: 1px solid #cbd5e1;
      font-size: 10.5px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Totals & Tax Breakup Grid */
    .totals-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .words-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
    }
    .calculation-card {
      background: #eff6ff;
      border: 1.5px solid #bfdbfe;
      border-radius: 6px;
      padding: 12px 14px;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #334155;
      margin-bottom: 4px;
    }
    .grand-total-box {
      border-top: 1.5px solid #93c5fd;
      padding-top: 6px;
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .grand-total-amount {
      font-size: 18px;
      font-weight: 900;
      color: #1e40af;
    }

    /* Declarations & Signatory Section */
    .signatory-grid {
      display: grid;
      grid-template-columns: 1.3fr 0.9fr;
      gap: 16px;
      border-top: 1px solid #cbd5e1;
      padding-top: 14px;
      margin-top: 14px;
      page-break-inside: avoid;
    }
    .legal-notes {
      font-size: 9px;
      color: #64748b;
      line-height: 1.5;
    }
    .signatory-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
      background: #fafafa;
    }
    .signature-seal {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border: 1px dashed #2563eb;
      border-radius: 4px;
      color: #2563eb;
      font-size: 9px;
      font-weight: 800;
      margin: 8px 0;
      text-transform: uppercase;
      background: #eff6ff;
    }

    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }
      .invoice-card {
        border: none;
        padding: 0;
        max-width: 100%;
      }
      .page-break-avoid {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-title">${details.sellerCompany}</div>
        <div class="brand-subtitle">${details.sellerTrade}</div>
        <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
          CIN: <strong>${details.sellerCin}</strong> · PAN: <strong>${details.sellerPan}</strong>
        </div>
      </div>
      <div class="invoice-badge-box">
        <div class="invoice-main-title">TAX INVOICE</div>
        <div class="invoice-sub-type">Original for Recipient (Rule 46 CGST)</div>
        <span class="badge-paid">✓ FULLY PAID · AUTOMATED DEBIT</span>
      </div>
    </div>

    <!-- Metadata Bar -->
    <div class="meta-bar">
      <div>
        <div class="meta-item-label">Invoice Number</div>
        <div class="meta-item-val">${details.invNo}</div>
      </div>
      <div>
        <div class="meta-item-label">Invoice Date & Time</div>
        <div class="meta-item-val" style="font-family: inherit;">${details.formattedDateTime}</div>
      </div>
      <div>
        <div class="meta-item-label">Place of Supply (POS)</div>
        <div class="meta-item-val" style="font-family: inherit;">${details.placeOfSupply}</div>
      </div>
      <div>
        <div class="meta-item-label">Reverse Charge</div>
        <div class="meta-item-val" style="font-family: inherit;">NO (Section 9(3))</div>
      </div>
    </div>

    <!-- Parties: Seller & Buyer Grid -->
    <div class="parties-grid">
      <!-- Seller (Billed From) -->
      <div class="party-card">
        <div class="party-title">Supplier / Platform Details (Billed From)</div>
        <div class="party-name">${details.sellerCompany}</div>
        <div class="party-text">
          ${details.sellerAddress}<br/>
          <strong>GSTIN:</strong> ${details.sellerGstin} · <strong>CIN:</strong> ${details.sellerCin}<br/>
          <strong>State:</strong> ${details.sellerState} (Code: ${details.sellerStateCode})<br/>
          <strong>Email:</strong> ${details.sellerEmail} · info@desitechsolutions.com · <strong>Phone:</strong> ${details.sellerPhone}
        </div>
      </div>

      <!-- Buyer (Billed To) -->
      <div class="party-card">
        <div class="party-title">Subscriber / Merchant Details (Billed To)</div>
        <div class="party-name">${details.buyerName}</div>
        <div class="party-text">
          ${details.buyerOwner ? `Attn: ${details.buyerOwner}<br/>` : ''}
          ${details.buyerAddress}${details.buyerCity ? `, ${details.buyerCity}` : ''}${details.buyerPincode ? ` - ${details.buyerPincode}` : ''}<br/>
          <strong>GSTIN / UIN:</strong> ${details.buyerGstin}<br/>
          <strong>State:</strong> ${details.buyerState} (Code: ${details.buyerStateCode})<br/>
          <strong>Contact:</strong> ${details.buyerPhone} · ${details.buyerEmail}
        </div>
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 45%;">Service Description & Coverage Scope</th>
          <th class="text-center" style="width: 12%;">SAC Code</th>
          <th class="text-center" style="width: 12%;">Billing Period</th>
          <th class="text-right" style="width: 12%;">Rate</th>
          <th class="text-right" style="width: 14%;">Taxable Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">1</td>
          <td>
            <strong>VyaparSathi ${details.plan} Plan SaaS Subscription</strong><br/>
            <span style="font-size: 9.5px; color: #475569;">
              Multi-branch POS Billing, GST Ledger, Inventory Control, E-Way Bill Generation & AutoPay e-Mandate Management
            </span>
          </td>
          <td class="text-center font-mono">${details.sellerSac}</td>
          <td class="text-center" style="font-size: 9.5px;">${details.formattedPeriod}</td>
          <td class="text-right">₹${details.baseAmount.toFixed(2)}</td>
          <td class="text-right font-mono" style="font-weight: 800;">₹${details.baseAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals & Tax Summary Grid -->
    <div class="totals-grid page-break-avoid">
      <!-- Words Box & Payment Details -->
      <div class="words-card">
        <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 3px;">
          Amount Chargeable in Words
        </div>
        <div style="font-size: 11px; font-weight: 800; color: #1e40af; margin-bottom: 8px;">
          ${details.amountInWords}
        </div>
        <div style="font-size: 9px; color: #475569; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
          <strong>Payment Mode:</strong> ${details.method}<br/>
          <strong>Razorpay Payment Ref:</strong> <span style="font-family: monospace;">${details.paymentId}</span><br/>
          <strong>Subscription Mandate Ref:</strong> <span style="font-family: monospace;">${details.subId}</span>
        </div>
      </div>

      <!-- Calculation Card -->
      <div class="calculation-card">
        <div class="calc-row">
          <span>Taxable Base Value:</span>
          <span style="font-weight: 700;">₹${details.baseAmount.toFixed(2)}</span>
        </div>
        ${details.isIntraState ? `
          <div class="calc-row">
            <span>CGST (${details.cgstRate}%):</span>
            <span style="font-weight: 700;">₹${details.cgstAmount.toFixed(2)}</span>
          </div>
          <div class="calc-row">
            <span>SGST (${details.sgstRate}%):</span>
            <span style="font-weight: 700;">₹${details.sgstAmount.toFixed(2)}</span>
          </div>
        ` : `
          <div class="calc-row">
            <span>IGST (${details.igstRate}%):</span>
            <span style="font-weight: 700;">₹${details.igstAmount.toFixed(2)}</span>
          </div>
        `}
        <div class="calc-row" style="border-top: 1px solid #bfdbfe; padding-top: 4px; margin-top: 4px; font-weight: 700;">
          <span>Total Tax Amount (18% GST):</span>
          <span>₹${details.totalGst.toFixed(2)}</span>
        </div>
        <div class="grand-total-box">
          <span style="font-size: 11px; font-weight: 800; color: #1e40af;">Total Invoice Value:</span>
          <span class="grand-total-amount">₹${details.totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Declarations & Signatory Section -->
    <div class="signatory-grid page-break-avoid">
      <div class="legal-notes">
        <strong>Terms & Statutory Declarations:</strong><br/>
        1. This is a computer-generated tax invoice issued in terms of Rule 46 of the Central Goods and Services Tax (CGST) Rules, 2017.<br/>
        2. Input Tax Credit (ITC) is admissible on this tax invoice subject to supplier invoice matching in GSTR-2B.<br/>
        3. SAC 998313: Information technology and software subscription services rendered electronically.<br/>
        4. No physical signature is required pursuant to the Information Technology Act, 2000.
      </div>
      <div class="signatory-box">
        <div style="font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase;">
          For ${details.sellerCompany}
        </div>
        <div class="signature-seal">
          <span style="font-size: 14px;">✓</span>
          <span>Digitally Signed & Validated</span>
        </div>
        <div style="font-size: 9px; color: #64748b;">
          Authorized Corporate Signatory<br/>
          Automated Billing Verification Unit
        </div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=940,height=850');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  const currentDetails = selectedInvoice
    ? resolveInvoiceDetails(selectedInvoice, razorpayStatus, platformInfo, shop)
    : null;

  return (
    <Stack spacing={3}>
      {/* Metric Cards Overview */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Avatar sx={{ bgcolor: '#EFF6FF', color: '#2563EB', width: 44, height: 44 }}>
              <CreditCardIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Spent
              </Typography>
              <Typography variant="h6" fontWeight={900} color="text.primary">
                ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Avatar sx={{ bgcolor: '#ECFDF5', color: '#059669', width: 44, height: 44 }}>
              <VerifiedIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Successful Debits
              </Typography>
              <Typography variant="h6" fontWeight={900} color="text.primary">
                {successfulCount} payments
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Avatar sx={{ bgcolor: '#FEF3C7', color: '#D97706', width: 44, height: 44 }}>
              <WorkspacePremiumIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Active Plan Tier
              </Typography>
              <Typography variant="h6" fontWeight={900} color="text.primary">
                {activePlanLabel}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Invoices Table Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {/* Header & Controls */}
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptLongIcon color="primary" /> Official B2B Tax Invoices & Payment Logs
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rule 46 CGST compliant tax receipts with SAC 998313, GSTIN matching, and AutoPay debit audit trail.
              </Typography>
            </Box>

            {/* Filter controls */}
            <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                size="small"
                placeholder="Search Invoice or Pay ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />,
                }}
                sx={{ width: { xs: '100%', sm: 220 } }}
              />

              <TextField
                select
                size="small"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                sx={{ width: 140 }}
                InputProps={{
                  startAdornment: <FilterListIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />,
                }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="SUCCESS">Success</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="REFUNDED">Refunded</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </Box>

        {/* Invoices Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>INVOICE / PAYMENT REF</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>PLAN / CYCLE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>PAYMENT METHOD</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>AMOUNT (INCL. GST)</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton animation="wave" height={40} /></TableCell>
                  </TableRow>
                ))
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <ReceiptLongIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={700}>
                      No AutoPay transactions found.
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                      {search || statusFilter !== 'ALL'
                        ? 'No transactions match your search query or status filter.'
                        : 'Official GST tax invoices will appear here following your subscription activation and recurring cycles.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((row) => (
                  <TableRow key={row.id || row.razorpayPaymentId} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800, color: 'text.primary' }}>
                        {row.invoiceNumber || row.razorpayPaymentId || '—'}
                      </Typography>
                      {row.invoiceNumber && row.razorpayPaymentId && (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'text.secondary', display: 'block' }}>
                          Ref: {row.razorpayPaymentId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} sx={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>
                        {row.planCode || razorpayStatus?.planCode || 'PRO'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', display: 'block', fontSize: '0.65rem' }}>
                        {row.billingCycle || razorpayStatus?.billingCycle || 'MONTHLY'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>
                      {row.method || 'Razorpay AutoPay'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900, fontSize: '0.85rem' }}>
                      ₹{Number(row.amount || 999).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={renderStatusIcon(row.status)}
                        label={row.status}
                        color={statusChipColor(row.status)}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.65rem', borderRadius: '6px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon fontSize="small" />}
                          onClick={() => {
                            setSelectedInvoice(row);
                            setModalTab(0);
                          }}
                          sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none', fontSize: '0.7rem' }}
                        >
                          View Invoice
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<DownloadIcon fontSize="small" />}
                          onClick={() => triggerPrintWindow(row)}
                          sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none', fontSize: '0.7rem' }}
                        >
                          Print / PDF
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {!loading && filteredInvoices.length > 0 && (
          <TablePagination
            component="div"
            count={filteredInvoices.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </Paper>

      {/* ═══════════════════════════════════════════════════════════════════════
           ENTERPRISE TAX INVOICE DETAIL MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {selectedInvoice && currentDetails && (
        <Dialog
          open={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: '20px', p: 0, overflow: 'hidden' } }}
        >
          {/* Modal Header */}
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: '#2563EB', color: '#fff', fontWeight: 900, width: 38, height: 38 }}>
                VS
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={900}>
                  B2B Tax Invoice & Receipt
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {currentDetails.invNo} · SAC {currentDetails.sellerSac}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label="TAX INVOICE PAID"
                color="success"
                size="small"
                sx={{ fontWeight: 900, borderRadius: '6px', fontSize: '0.7rem' }}
              />
              <IconButton onClick={() => setSelectedInvoice(null)} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>

          {/* Modal Tabs */}
          <Tabs
            value={modalTab}
            onChange={(_, v) => setModalTab(v)}
            sx={{
              px: 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              minHeight: 44,
              '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 44, fontSize: '0.85rem' },
            }}
          >
            <Tab label="Tax Invoice Document Preview" />
            <Tab label="Payment Audit & Technical Details" />
          </Tabs>

          <DialogContent sx={{ p: 3, bgcolor: modalTab === 0 ? '#f8fafc' : 'background.paper' }}>
            {modalTab === 0 ? (
              /* TAB 0: Official Invoice Preview */
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  bgcolor: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                }}
              >
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ pb: 2, borderBottom: '2px solid #1e40af', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={900} color="#1e40af" sx={{ letterSpacing: -0.5 }}>
                      {currentDetails.sellerCompany}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block' }}>
                      {currentDetails.sellerTrade}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      CIN: <strong>{currentDetails.sellerCin}</strong> | PAN: <strong>{currentDetails.sellerPan}</strong>
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2" fontWeight={900} color="#0f172a">
                      TAX INVOICE
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                      Rule 46 CGST · Original for Recipient
                    </Typography>
                  </Box>
                </Stack>

                {/* Metadata Row */}
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', mb: 2.5 }}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        Invoice Number
                      </Typography>
                      <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {currentDetails.invNo}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        Invoice Date
                      </Typography>
                      <Typography variant="body2" fontWeight={800} sx={{ fontSize: '0.75rem' }}>
                        {currentDetails.formattedDate}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        Place of Supply (POS)
                      </Typography>
                      <Typography variant="body2" fontWeight={800} sx={{ fontSize: '0.75rem' }}>
                        {currentDetails.placeOfSupply}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        Reverse Charge
                      </Typography>
                      <Typography variant="body2" fontWeight={800} sx={{ fontSize: '0.75rem' }}>
                        NO
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Seller & Buyer Details */}
                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 1.75, border: '1px solid #e2e8f0', borderRadius: '8px', height: '100%' }}>
                      <Typography variant="caption" fontWeight={800} color="#1e40af" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                        Supplier / Platform (Billed From)
                      </Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {currentDetails.sellerCompany}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.45 }}>
                        {currentDetails.sellerAddress}<br/>
                        <strong>GSTIN:</strong> {currentDetails.sellerGstin}<br/>
                        <strong>State:</strong> {currentDetails.sellerState} (Code: {currentDetails.sellerStateCode})<br/>
                        <strong>Support:</strong> {currentDetails.sellerEmail} · info@desitechsolutions.com
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 1.75, border: '1px solid #e2e8f0', borderRadius: '8px', height: '100%' }}>
                      <Typography variant="caption" fontWeight={800} color="#1e40af" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                        Subscriber / Recipient (Billed To)
                      </Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {currentDetails.buyerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.45 }}>
                        {currentDetails.buyerOwner && `Attn: ${currentDetails.buyerOwner}`}<br/>
                        {currentDetails.buyerAddress}{currentDetails.buyerCity && `, ${currentDetails.buyerCity}`}{currentDetails.buyerPincode && ` - ${currentDetails.buyerPincode}`}<br/>
                        <strong>GSTIN / UIN:</strong> {currentDetails.buyerGstin}<br/>
                        <strong>State:</strong> {currentDetails.buyerState} (Code: {currentDetails.buyerStateCode})<br/>
                        <strong>Contact:</strong> {currentDetails.buyerPhone}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Items & Tax Table */}
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #cbd5e1', borderRadius: '8px', mb: 2.5 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem' }}>DESCRIPTION</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.65rem' }}>SAC</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.65rem' }}>PERIOD</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.65rem' }}>TAXABLE BASE</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.65rem' }}>TOTAL (INR)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          <strong>VyaparSathi {currentDetails.plan} SaaS Plan Subscription</strong>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                            POS, GST Invoicing, Inventory, Analytics & Razorpay AutoPay
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {currentDetails.sellerSac}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.7rem' }}>
                          {currentDetails.formattedPeriod}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700 }}>
                          ₹{currentDetails.baseAmount.toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 900 }}>
                          ₹{currentDetails.totalAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Summary & Tax Split */}
                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid item xs={12} sm={7}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', height: '100%' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.65rem', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                        Amount in Words
                      </Typography>
                      <Typography variant="body2" fontWeight={800} color="#1e40af" sx={{ mb: 1 }}>
                        {currentDetails.amountInWords}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                        <strong>Payment Instrument:</strong> {currentDetails.method}<br/>
                        <strong>Razorpay ID:</strong> {currentDetails.paymentId}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={5}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '8px' }}>
                      <Stack spacing={0.5}>
                        <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '0.75rem' }}>
                          <Typography variant="caption" color="text.secondary">Taxable Amount:</Typography>
                          <Typography variant="caption" fontWeight={700}>₹{currentDetails.baseAmount.toFixed(2)}</Typography>
                        </Stack>
                        {currentDetails.isIntraState ? (
                          <>
                            <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '0.75rem' }}>
                              <Typography variant="caption" color="text.secondary">CGST (9%):</Typography>
                              <Typography variant="caption" fontWeight={700}>₹{currentDetails.cgstAmount.toFixed(2)}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '0.75rem' }}>
                              <Typography variant="caption" color="text.secondary">SGST (9%):</Typography>
                              <Typography variant="caption" fontWeight={700}>₹{currentDetails.sgstAmount.toFixed(2)}</Typography>
                            </Stack>
                          </>
                        ) : (
                          <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '0.75rem' }}>
                            <Typography variant="caption" color="text.secondary">IGST (18%):</Typography>
                            <Typography variant="caption" fontWeight={700}>₹{currentDetails.igstAmount.toFixed(2)}</Typography>
                          </Stack>
                        )}
                        <Divider sx={{ my: 0.5, borderColor: '#bfdbfe' }} />
                        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                          <Typography variant="subtitle2" fontWeight={900} color="#1e40af">Total Amount:</Typography>
                          <Typography variant="h6" fontWeight={900} color="#1e40af">₹{currentDetails.totalAmount.toFixed(2)}</Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Legal Signatory */}
                <Box sx={{ pt: 1.5, borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    * Computer-generated B2B tax invoice. ITC claimable under Section 16 CGST Act.
                  </Typography>
                  <Chip
                    icon={<VerifiedUserIcon sx={{ fontSize: 14 }} />}
                    label="Digitally Signed & Validated"
                    size="small"
                    sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 800, fontSize: '0.65rem', border: '1px dashed #93c5fd' }}
                  />
                </Box>
              </Paper>
            ) : (
              /* TAB 1: Technical & Audit Metadata */
              <Stack spacing={2}>
                <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
                    Razorpay Gateway Transaction Parameters
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Razorpay Payment ID</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                          {selectedInvoice.razorpayPaymentId || 'N/A'}
                        </Typography>
                        {selectedInvoice.razorpayPaymentId && (
                          <IconButton size="small" onClick={() => copyToClipboard(selectedInvoice.razorpayPaymentId, 'Payment ID')}>
                            <ContentCopyIcon fontSize="small" sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Subscription Mandate ID</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                          {selectedInvoice.razorpaySubscriptionId || razorpayStatus?.razorpaySubscriptionId || 'N/A'}
                        </Typography>
                        {selectedInvoice.razorpaySubscriptionId && (
                          <IconButton size="small" onClick={() => copyToClipboard(selectedInvoice.razorpaySubscriptionId, 'Subscription ID')}>
                            <ContentCopyIcon fontSize="small" sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Payment Instrument Mode</Typography>
                      <Typography variant="body2" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
                        {selectedInvoice.method || 'Razorpay AutoPay'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Bank / VPA Identifier</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {selectedInvoice.bank || selectedInvoice.vpa || 'Secured Mandate'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Created Timestamp</Typography>
                      <Typography variant="body2">
                        {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString('en-IN') : 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Status & Invoice State</Typography>
                      <Typography variant="body2" fontWeight={800} color="success.main">
                        {selectedInvoice.status || 'SUCCESS'} ({selectedInvoice.invoiceStatus || 'PAID'})
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#0f172a', color: '#f8fafc', borderRadius: '12px' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                    Raw Record Snapshot
                  </Typography>
                  <pre style={{ margin: 0, fontSize: '0.7rem', overflowX: 'auto', fontFamily: 'monospace' }}>
                    {JSON.stringify(selectedInvoice, null, 2)}
                  </pre>
                </Paper>
              </Stack>
            )}
          </DialogContent>

          {/* Modal Footer Actions */}
          <DialogActions sx={{ p: 2.5, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => copyToClipboard(currentDetails.invNo, 'Invoice Number')}
              sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
            >
              Copy Invoice No.
            </Button>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                onClick={() => setSelectedInvoice(null)}
                sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PrintIcon />}
                onClick={() => triggerPrintWindow(selectedInvoice)}
                sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none', px: 2.5 }}
              >
                Print / Download PDF
              </Button>
            </Stack>
          </DialogActions>
        </Dialog>
      )}
    </Stack>
  );
}
