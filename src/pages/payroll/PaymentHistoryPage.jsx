import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Chip, Stack, Breadcrumbs, Link, 
  CircularProgress, Grid, Card, CardContent, Avatar
} from '@mui/material';
import { Download, Share, ArrowBack, Payments, EventNote, TrendingUp } from '@mui/icons-material';
import { fetchStaffPaymentHistory } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PaymentHistoryPage() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [staffId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchStaffPaymentHistory(staffId);
      // Handles both direct array response or Page object with .content
      setHistory(data.content || data || []);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Summary Calculations for the Cards ---
  const stats = useMemo(() => {
    const dataArray = Array.isArray(history) ? history : [];
    const total = dataArray.reduce((sum, rec) => sum + (Number(rec.netAmount) || 0), 0);
    const count = dataArray.length;
    return {
      totalPaid: total,
      avgSalary: count > 0 ? total / count : 0,
      lastPaid: dataArray[0]?.netAmount || 0,
      staffName: dataArray[0]?.staffName || "Staff Member",
    };
  }, [history]);

  // === YOUR ORIGINAL PDF LOGIC (UNTOUCHED) ===
  const generatePayslip = (record) => {
    const doc = new jsPDF();

    // === Safety fallbacks ===
    const employeeName   = record?.staffName   || "Employee Name";
    const role           = record?.staffRole        || "N/A";
    const paymentDate    = record?.paymentDate || "N/A";
    const period         = `${record?.salaryMonth || "N/A"} ${record?.salaryYear || ""}`;
    const baseSalary     = Number(record?.baseSalaryAtTime   || 0);
    const bonus          = Number(record?.bonus              || 0);
    const deductions     = Number(record?.deductions         || 0);
    const advanceDeduct  = Number(record?.advanceDeduction   || 0);
    const netAmount      = Number(record?.netAmount          || 0);
    const paymentMode    = record?.paymentMode || "Cash / Bank Transfer";

    const primary    = [59, 130, 246];   
    const grey       = [117, 117, 117];
    const lightGrey  = [245, 245, 245];

    // Header
    doc.setFillColor(...primary);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("VYAPARSATHI", 20, 22);
    doc.setFontSize(14);
    doc.text("Payslip", 20, 32);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 165, 22, { align: "right" });
    doc.text(`Payslip No: ${record?.id || '—'}`, 165, 32, { align: "right" });

    // Company Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DesiTech Solutions Pvt Ltd", 20, 60);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grey);
    doc.text("Gurgaon, Haryana, India", 20, 67);
    doc.text("GSTIN: 10XXXXX1234X1Z5", 20, 74);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Details", 20, 90);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grey);
    autoTable(doc, {
      startY: 95,
      theme: 'plain',
      margin: { left: 20, right: 20 },
      styles: { fontSize: 10, cellPadding: 2, textColor: [0,0,0] },
      columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' }, 1: { cellWidth: 100 } },
      body: [
        ["Name", employeeName],
        ["Role", role],
        ["Payment Period", period],
        ["Payment Date", paymentDate],
        ["Mode", paymentMode],
      ],
    });

    const tableStartY = doc.lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Salary Breakdown", 20, tableStartY - 5);

    autoTable(doc, {
      startY: tableStartY,
      theme: 'grid',
      head: [['Description', 'Amount (₹)']],
      body: [
        ['Basic Salary', baseSalary.toLocaleString('en-IN')],
        ['Bonus / Incentives', bonus.toLocaleString('en-IN')],
        ['Advance Recovery', `-${advanceDeduct.toLocaleString('en-IN')}`],
        ['Other Deductions', `-${deductions.toLocaleString('en-IN')}`],
        ['NET PAYABLE', netAmount.toLocaleString('en-IN')],
      ],
      foot: [['Total Disbursed', netAmount.toLocaleString('en-IN')]],
      styles: { fontSize: 10, cellPadding: 4, lineColor: [200,200,200], lineWidth: 0.1 },
      headStyles: { fillColor: [...primary, 0.9], textColor: [255,255,255], fontStyle: 'bold' },
      footStyles: { fillColor: lightGrey, textColor: [0,0,0], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 120, halign: 'left' }, 1: { cellWidth: 60, halign: 'right' } },
      margin: { left: 20, right: 20 },
    });

    const finalY = doc.lastAutoTable.finalY + 25;
    doc.setDrawColor(...grey);
    doc.line(20, finalY, 190, finalY);
    doc.setFontSize(9);
    doc.setTextColor(...grey);
    doc.text("This is a computer-generated payslip and does not require signature.", 105, finalY + 10, { align: "center" });
    doc.text("Thank you for your dedication & hard work!", 105, finalY + 18, { align: "center" });

    doc.save(`Payslip_${employeeName.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.pdf`);
  };

  const handleShare = async (record) => {
    const name = record?.staffName || "Staff";
    const amount = record?.netAmount || 0;
    const period = `${record?.salaryMonth || 'month'} ${record?.salaryYear || ''}`;
    const shareText = `Hello ${name},\n\nYour salary for ${period} of ₹${amount.toLocaleString('en-IN')} has been successfully processed.\n\nVyaparSathi Team`;

    if (navigator.share) {
      try { await navigator.share({ title: 'Salary Update', text: shareText }); } catch (err) {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
      <Stack spacing={4}>
        {/* Navigation & Breadcrumbs */}
        <Box>
          <Breadcrumbs sx={{ mb: 1 }}>
            <Link underline="hover" color="inherit" onClick={() => navigate('/admin/payroll')} sx={{ cursor: 'pointer' }}>Payroll</Link>
            <Typography color="text.primary">Staff Ledger</Typography>
          </Breadcrumbs>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'white', boxShadow: 1 }}><ArrowBack /></IconButton>
            <Box>
              <Typography variant="h4" fontWeight={900} color="#1e293b">{stats.staffName}</Typography>
              <Typography variant="body2" color="text.secondary">Detailed Payment Records</Typography>
            </Box>
          </Stack>
        </Box>

        {/* Summary Cards */}
        {!loading && history.length > 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#eff6ff', color: '#1e40af' }}><Payments /></Avatar>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">TOTAL PAID</Typography>
                    <Typography variant="h5" fontWeight={800}>₹{stats.totalPaid.toLocaleString('en-IN')}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#f0fdf4', color: '#166534' }}><TrendingUp /></Avatar>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">AVG. MONTHLY</Typography>
                    <Typography variant="h5" fontWeight={800}>₹{Math.round(stats.avgSalary).toLocaleString('en-IN')}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#fff7ed', color: '#9a3412' }}><EventNote /></Avatar>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">LAST PAYOUT</Typography>
                    <Typography variant="h5" fontWeight={800}>₹{stats.lastPaid.toLocaleString('en-IN')}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Main History Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>PERIOD</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>PAY DATE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>NET PAID</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>MODE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748b' }} align="right">ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
              ) : history.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}><Typography color="text.secondary">No payment history available.</Typography></TableCell></TableRow>
              ) : (
                history.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell><Typography fontWeight={700}>{record?.salaryMonth} {record?.salaryYear}</Typography></TableCell>
                    <TableCell>{record?.paymentDate || 'N/A'}</TableCell>
                    <TableCell><Typography fontWeight={800} color="primary.main">₹{(record?.netAmount || 0).toLocaleString('en-IN')}</Typography></TableCell>
                    <TableCell><Chip label={record?.paymentMode || 'CASH'} size="small" variant="outlined" sx={{ fontWeight: 600 }} /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton onClick={() => generatePayslip(record)} color="primary" sx={{ bgcolor: '#f0f7ff' }}><Download fontSize="small" /></IconButton>
                        <IconButton onClick={() => handleShare(record)} color="secondary" sx={{ bgcolor: '#fdf2f8' }}><Share fontSize="small" /></IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Box>
  );
}