import React, { useState, useEffect } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography, Chip, Skeleton, Box, Grid, Stack,
  TextField, MenuItem, TablePagination, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
  Avatar, Divider,
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
import platformApi from '../../services/platformApi';

/**
 * Number-to-Words Converter for B2B Tax Invoice Total Amount.
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

/**
 * Year for a synthetic invoice number, derived from when the invoice was
 * actually created rather than a hardcoded year that would go stale.
 */
function invoiceYear(createdAt) {
  const d = createdAt ? new Date(createdAt) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
}

/**
 * Enterprise-grade B2B Tax Invoice & Receipt Table for VyaparSathi.
 *
 * @param {Array}   invoices       - Array of RazorpayPaymentLog from GET /api/subscriptions/razorpay/invoices
 * @param {object}  razorpayStatus - Aggregated status DTO from GET /api/subscriptions/razorpay/status
 * @param {boolean} loading        - True while data is being fetched
 */
export default function RazorpayInvoiceTable({ invoices = [], razorpayStatus = null, loading = false }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [platformInfo, setPlatformInfo] = useState({
    companyName: 'DesiTech Solutions Pvt. Ltd.',
    tradeName: 'VyaparSathi Enterprise SaaS',
    // No fabricated GSTIN/PAN — a fake-but-plausible number on a legally
    // issued tax invoice is a compliance risk. Left unset until the real
    // value loads from `/api/platform/public-info`; the invoice display
    // and PDF fall back to an explicit "NOT CONFIGURED" label, never a
    // made-up identifier.
    gstin: null,
    pan: null,
    addressLine1: '101, Tech Hub Tower',
    addressLine2: 'Senapati Bapat Marg, Lower Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '400013',
    hsnSacCode: '998313',
    invoicePrefix: 'SUB-INV',
  });

  useEffect(() => {
    platformApi.getPublicPlatformInfo()
      .then((data) => {
        if (data) setPlatformInfo(data);
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
      shopId: razorpayStatus.shopId || 1,
    });
  }

  // Calculate Metric Cards Summary
  const totalSpent = displayInvoices.reduce((acc, inv) => {
    return inv.status === 'SUCCESS' ? acc + Number(inv.amount || 0) : acc;
  }, 0);

  const successfulCount = displayInvoices.filter((i) => i.status === 'SUCCESS').length;
  const activePlanLabel = (razorpayStatus?.planCode || displayInvoices[0]?.planCode || 'FREE').toUpperCase();

  // Filter invoices based on search term & status selector
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

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

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
    if (s === 'SUCCESS' || s === 'CHARGED' || s === 'AUTHENTICATED') {
      return <CheckCircleIcon sx={{ fontSize: 14 }} />;
    }
    if (s === 'FAILED' || s === 'REJECTED') {
      return <CancelIcon sx={{ fontSize: 14 }} />;
    }
    if (s === 'REFUNDED') {
      return <ReplayIcon sx={{ fontSize: 14 }} />;
    }
    return <HourglassEmptyIcon sx={{ fontSize: 14 }} />;
  };

  // Dynamic B2B Tax Invoice Generator Helper
  const triggerPrintWindow = (inv) => {
    const shopId = inv.shopId || razorpayStatus?.shopId || 1;
    const pId = inv.razorpayPaymentId || 'SUB-PAYMENT-REF';
    const subId = inv.razorpaySubscriptionId || razorpayStatus?.razorpaySubscriptionId || 'SUB-MANDATE-REF';
    const pDate = inv.createdAt
      ? new Date(inv.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
    const plan = (inv.planCode || razorpayStatus?.planCode || 'PRO').toUpperCase();
    const cycle = (inv.billingCycle || razorpayStatus?.billingCycle || 'MONTHLY').toLowerCase();
    const totalAmount = Number(inv.amount || 999);

    // Tax Math (18% GST included)
    const baseAmount = Number((totalAmount / 1.18).toFixed(2));
    const totalGst = Number((totalAmount - baseAmount).toFixed(2));

    // Dynamic State Code Evaluation (Intra-State vs Inter-State)
    const vendorStateCode = String(platformInfo.stateCode || '27').trim();
    const customerStateCode = String(inv.shopStateCode || razorpayStatus?.shopStateCode || '27').trim();
    const isIntraState = vendorStateCode === customerStateCode;

    const cgst = isIntraState ? Number((totalGst / 2).toFixed(2)) : 0;
    const sgst = isIntraState ? Number((totalGst / 2).toFixed(2)) : 0;
    const igst = !isIntraState ? totalGst : 0;

    const method = inv.method || 'Razorpay AutoPay (UPI / Card / NetBanking)';
    const invPrefix = platformInfo.invoicePrefix || 'SUB-INV';
    const invNo = inv.invoiceNumber || `${invPrefix}-${invoiceYear(inv.createdAt)}-${String(inv.id || Date.now()).slice(-6).padStart(6, '0')}`;
    const amountInWords = numberToWords(totalAmount);

    const vendorAddressStr = [
      platformInfo.addressLine1,
      platformInfo.addressLine2,
      platformInfo.city,
      platformInfo.state ? `${platformInfo.state} - ${platformInfo.pincode || ''}` : '',
    ].filter(Boolean).join(', ');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>B2B Tax Invoice - ${invNo}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Roboto', 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 20px; font-size: 12px; line-height: 1.4; }
    .invoice-card { max-width: 820px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 28px; background: #ffffff; }
    
    /* Header & Logo */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
    .company-title { font-size: 22px; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; }
    .invoice-title { font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; }
    .badge { background: #dcfce7; color: #15803d; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #bbf7d0; display: inline-block; }

    /* Address Grid */
    .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 11px; }
    .box-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 800; margin-bottom: 4px; letter-spacing: 0.5px; }
    .address-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    
    /* Metadata Grid */
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
    .meta-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .meta-val { font-size: 11px; font-weight: 800; color: #0f172a; font-family: monospace; }

    /* Items Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    th { background: #e2e8f0; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #334155; padding: 10px; text-align: left; border: 1px solid #cbd5e1; }
    td { padding: 10px; border: 1px solid #cbd5e1; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Tax Summary Table */
    .summary-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-bottom: 20px; }
    .words-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .total-box { background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 8px; padding: 16px; text-align: right; }
    .total-amount { font-size: 22px; font-weight: 900; color: #1e40af; }

    /* Footer */
    .footer { text-align: center; color: #64748b; font-size: 10px; margin-top: 25px; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
    
    @media print {
      body { padding: 0; background: #fff; }
      .invoice-card { border: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="company-title">${platformInfo.companyName || 'DesiTech Solutions Pvt. Ltd.'}</div>
        <div style="color: #64748b; font-size: 11px; font-weight: 600;">${platformInfo.tradeName || 'VyaparSathi Enterprise SaaS Platform'}</div>
      </div>
      <div>
        <div class="invoice-title">B2B TAX INVOICE</div>
        <div style="text-align: right; margin-top: 4px;">
          <span class="badge">✓ TAX INVOICE PAID</span>
        </div>
      </div>
    </div>

    <!-- Vendor & Customer Info -->
    <div class="address-grid">
      <div class="address-box">
        <div class="box-title">Vendor / Platform Details (Billed From)</div>
        <strong>${platformInfo.companyName || 'DesiTech Solutions Pvt. Ltd.'}</strong><br/>
        ${vendorAddressStr}<br/>
        <strong>GSTIN:</strong> ${platformInfo.gstin || 'GSTIN NOT CONFIGURED'} | <strong>PAN:</strong> ${platformInfo.pan || 'PAN NOT CONFIGURED'}<br/>
        <strong>State Code:</strong> ${platformInfo.stateCode || '27'} (${platformInfo.state || 'Maharashtra'}) | <strong>SAC Code:</strong> ${platformInfo.hsnSacCode || '998313'}
      </div>
      <div class="address-box">
        <div class="box-title">Customer / Subscriber Details (Billed To)</div>
        <strong>Shop Account #${shopId}</strong><br/>
        Authorized VyaparSathi Merchant Account<br/>
        <strong>GSTIN / UIN:</strong> ${inv.shopGstin || 'N/A (Unregistered / ITC Claimable)'}<br/>
        <strong>State Code:</strong> ${customerStateCode}<br/>
        <strong>Billing Instrument:</strong> ${method}
      </div>
    </div>

    <!-- Metadata Row -->
    <div class="meta-grid">
      <div>
        <div class="meta-label">Invoice Number</div>
        <div class="meta-val">${invNo}</div>
      </div>
      <div>
        <div class="meta-label">Invoice Date</div>
        <div class="meta-val" style="font-family: inherit;">${pDate}</div>
      </div>
      <div>
        <div class="meta-label">Razorpay Payment ID</div>
        <div class="meta-val">${pId}</div>
      </div>
      <div>
        <div class="meta-label">Subscription Mandate ID</div>
        <div class="meta-val">${subId}</div>
      </div>
    </div>

    <!-- Line Items Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 50%;">SAC & Service Description</th>
          <th class="text-center">SAC Code</th>
          <th class="text-center">Billing Cycle</th>
          <th class="text-right">Taxable Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>VyaparSathi ${plan} Plan Subscription Services</strong><br/>
            <span style="color: #64748b; font-size: 10px;">Cloud ERP Access, POS Billing, Inventory, GST Ledger & Razorpay AutoPay</span>
          </td>
          <td class="text-center font-mono">${platformInfo.hsnSacCode || '998313'}</td>
          <td class="text-center" style="text-transform: capitalize;">${cycle}</td>
          <td class="text-right" style="font-weight: 800;">₹${baseAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Tax Breakdown & Totals -->
    <div class="summary-grid">
      <div class="words-box">
        <div class="box-title">Amount Chargeable in Words</div>
        <strong style="font-size: 12px; color: #1e40af;">${amountInWords}</strong>
        <div style="margin-top: 10px; font-size: 10px; color: #64748b;">
          * Tax is payable on reverse charge: No<br/>
          * SAC ${platformInfo.hsnSacCode || '998313'} — Information technology software services
        </div>
      </div>

      <div class="total-box">
        <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
          Taxable Base Value: <strong>₹${baseAmount.toFixed(2)}</strong><br/>
          ${isIntraState ? `
            CGST (9%): <strong>₹${cgst.toFixed(2)}</strong><br/>
            SGST (9%): <strong>₹${sgst.toFixed(2)}</strong><br/>
          ` : `
            IGST (18%): <strong>₹${igst.toFixed(2)}</strong><br/>
          `}
          Total GST (18%): <strong>₹${totalGst.toFixed(2)}</strong>
        </div>
        <hr style="border: none; border-top: 1px solid #bfdbfe; margin: 8px 0;"/>
        <div style="font-size: 11px; font-weight: 800; color: #1e40af;">Total Invoice Amount</div>
        <div class="total-amount">₹${totalAmount.toFixed(2)}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      This is an official computer-generated B2B Tax Invoice. Generated by VyaparSathi Subscription Billing Engine.<br/>
      Powered by Razorpay AutoPay Mandate Network.
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=920,height=850');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

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

      {/* Main Table Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {/* Card Header & Controls */}
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptLongIcon color="primary" /> B2B Tax Invoice & AutoPay History
              </Typography>
              <Typography variant="caption" color="text.secondary">
                View, search, and download official GST tax invoices for your subscription charges.
              </Typography>
            </Box>

            {/* Filter controls */}
            <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                size="small"
                placeholder="Search Payment ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />,
                }}
                sx={{ width: { xs: '100%', sm: 200 } }}
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

        {/* Table Container */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>INVOICE / PAYMENT ID</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>PLAN / CYCLE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>METHOD</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>AMOUNT (INCL. GST)</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>INVOICE ACTIONS</TableCell>
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
                        : 'Charges and official B2B tax receipts will appear here after your first billing cycle.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((row) => (
                  <TableRow key={row.id || row.razorpayPaymentId} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: 'text.primary' }}>
                      {row.razorpayPaymentId || '—'}
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
                          onClick={() => setSelectedInvoice(row)}
                          sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none', fontSize: '0.7rem' }}
                        >
                          View Details
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<DownloadIcon fontSize="small" />}
                          onClick={() => triggerPrintWindow(row)}
                          sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none', fontSize: '0.7rem' }}
                        >
                          Download PDF
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table Pagination */}
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

      {/* Dynamic Tax Invoice Detail Dialog / Modal */}
      {selectedInvoice && (
        <Dialog
          open={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: '#2563EB', color: '#fff', fontWeight: 900, width: 40, height: 40 }}>
                VS
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  {platformInfo.companyName || 'DesiTech Solutions Pvt. Ltd.'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Official B2B Tax Invoice & Receipt (SAC {platformInfo.hsnSacCode || '998313'})
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setSelectedInvoice(null)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ py: 3 }}>
            <Stack spacing={2.5}>
              {/* Receipt Header Badge */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip
                  label="TAX INVOICE PAID"
                  color="success"
                  size="small"
                  sx={{ fontWeight: 900, borderRadius: '6px', fontSize: '0.7rem' }}
                />
                <Typography variant="caption" fontFamily="monospace" fontWeight={700} color="text.secondary">
                  {selectedInvoice.invoiceNumber || `${platformInfo.invoicePrefix || 'SUB-INV'}-${invoiceYear(selectedInvoice.createdAt)}-${String(selectedInvoice.id || Date.now()).slice(-6).padStart(6, '0')}`}
                </Typography>
              </Stack>

              {/* Grid Metadata */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                      Vendor GSTIN:
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace" fontWeight={800}>
                      {platformInfo.gstin || 'GSTIN NOT CONFIGURED'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                      Payment Date:
                    </Typography>
                    <Typography variant="body2" fontWeight={800}>
                      {formatDate(selectedInvoice.createdAt)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                      Razorpay Payment ID:
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace" fontWeight={800} color="primary">
                      {selectedInvoice.razorpayPaymentId || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                      Payment Instrument:
                    </Typography>
                    <Typography variant="body2" fontWeight={800}>
                      {selectedInvoice.method || 'Razorpay AutoPay (e-Mandate)'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Line Items & GST Calculation Table */}
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>DESCRIPTION (SAC {platformInfo.hsnSacCode || '998313'})</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>TAXABLE BASE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem' }}>GST (18%)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem' }}>TOTAL</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const tot = Number(selectedInvoice.amount || 999);
                      const base = Number((tot / 1.18).toFixed(2));
                      const gst = Number((tot - base).toFixed(2));
                      return (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                            VyaparSathi {selectedInvoice.planCode || razorpayStatus?.planCode || 'PRO'} Plan ({selectedInvoice.billingCycle || razorpayStatus?.billingCycle || 'MONTHLY'})
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            ₹{base.toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            ₹{gst.toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.8rem' }}>
                            ₹{tot.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Words Box */}
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid', borderColor: '#E2E8F0' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', display: 'block' }}>
                  Amount Chargeable in Words:
                </Typography>
                <Typography variant="body2" fontWeight={800} color="primary">
                  {numberToWords(selectedInvoice.amount || 999)}
                </Typography>
              </Paper>

              {/* Total Summary Box */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: '#EFF6FF',
                  border: '1px solid',
                  borderColor: '#BFDBFE',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="#1E40AF">
                    Total Amount Paid (Incl. 18% GST)
                  </Typography>
                  <Typography variant="caption" color="#2563EB">
                    {String(platformInfo.stateCode || '27').trim() === String(selectedInvoice.shopStateCode || razorpayStatus?.shopStateCode || '27').trim()
                      ? 'CGST (9%) + SGST (9%) Applicable (Intra-State)'
                      : 'IGST (18%) Applicable (Inter-State)'}
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={900} color="#1E40AF">
                  ₹{Number(selectedInvoice.amount || 999).toFixed(2)}
                </Typography>
              </Paper>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setSelectedInvoice(null)}
              sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}
            >
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => triggerPrintWindow(selectedInvoice)}
              sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', px: 3 }}
            >
              Download PDF / Print
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Stack>
  );
}
