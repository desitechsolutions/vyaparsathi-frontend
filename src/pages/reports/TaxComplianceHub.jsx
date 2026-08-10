import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, Stack, Card, CardContent, 
  Avatar, Alert, TextField, MenuItem, CircularProgress, Divider, 
  useTheme, useMediaQuery, LinearProgress, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import { 
  FolderZip, VerifiedUser, BusinessCenter, AccountBalance, 
  Description, HelpOutline, CheckCircleOutline, Download, ReceiptLong
} from '@mui/icons-material';
import { downloadAuditPack, getRequest } from '../../services/api';

const auditFiles = [
  { title: "GST Sales Register", icon: <Description color="primary" />, desc: "GSTR-1 format CSV for B2B/B2C sales." },
  { title: "HSN Summary", icon: <AccountBalance color="secondary" />, desc: "Table 12 grouping for GST compliance." },
  { title: "Purchase/ITC", icon: <BusinessCenter color="success" />, desc: "Input Tax Credit ledger for inventory." },
  { title: "P&L Statement", icon: <VerifiedUser color="warning" />, desc: "Income/Expense summary for ITR." }
];

export default function TaxComplianceHub() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [gstr3bData, setGstr3bData] = useState(null);
  const [loadingGstr3b, setLoadingGstr3b] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const toDate = new Date(year, month, 0).toISOString().split('T')[0];

      const response = await downloadAuditPack(fromDate, toDate);

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Audit_Pack_${month}_${year}.zip`);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess(true);
    } catch (err) {
      console.error("Export Error:", err);
      setError(err.response?.data?.message || "Failed to generate audit pack. Please ensure you have data for this period.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadGstr1Json = async () => {
    try {
      const res = await getRequest(`/api/v1/gst/gstr1?year=${year}&month=${month}`);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(res.data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `GSTR1_${String(month).padStart(2, '0')}_${year}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download GSTR-1 JSON");
    }
  };

  const handleFetchGstr3b = async () => {
    setLoadingGstr3b(true);
    setError('');
    try {
      const res = await getRequest(`/api/v1/gst/gstr3b?year=${year}&month=${month}`);
      setGstr3bData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch GSTR-3B tax summary");
    } finally {
      setLoadingGstr3b(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="text.primary">{t('taxComplianceHub.title') || "GST & Tax Compliance Hub"}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {t('taxComplianceHub.subtitle') || "Generate GSTR-1 JSON, compute GSTR-3B tax liability, and export CA audit packs."}
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={4}>
        {/* Main Generator Card */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
            {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
            
            <Typography variant="h6" fontWeight={800} color="text.primary" mb={3}>GST Portal Filing & Export Package</Typography>
            
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Select Month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                >
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                    <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Financial Year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                >
                  <MenuItem value={2024}>FY 2023-24</MenuItem>
                  <MenuItem value={2025}>FY 2024-25</MenuItem>
                  <MenuItem value={2026}>FY 2025-26</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}
            {success && <Alert icon={<CheckCircleOutline fontSize="inherit" />} severity="success" sx={{ mb: 3, borderRadius: 3 }}>Pack generated successfully! Check your downloads.</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
              <Button 
                variant="contained" 
                fullWidth 
                size="large" 
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FolderZip />}
                onClick={handleExport} 
                disabled={loading} 
                sx={{ py: 1.8, borderRadius: 3, fontWeight: 800, textTransform: 'none' }}
              >
                {loading ? "Compiling..." : "Download CA Audit Pack (ZIP)"}
              </Button>
              
              <Button 
                variant="outlined" 
                fullWidth 
                size="large" 
                startIcon={<Download />}
                onClick={handleDownloadGstr1Json} 
                sx={{ py: 1.8, borderRadius: 3, fontWeight: 800, textTransform: 'none' }}
              >
                GSTR-1 Portal JSON
              </Button>

              <Button 
                variant="outlined" 
                color="secondary"
                fullWidth 
                size="large" 
                startIcon={<ReceiptLong />}
                onClick={handleFetchGstr3b} 
                disabled={loadingGstr3b}
                sx={{ py: 1.8, borderRadius: 3, fontWeight: 800, textTransform: 'none' }}
              >
                Calculate GSTR-3B
              </Button>
            </Stack>

            {/* GSTR-3B Tax Summary Table */}
            {gstr3bData && (
              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={800} gutterBottom>
                  GSTR-3B Summary ({gstr3bData.monthYear})
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Tax Component</strong></TableCell>
                      <TableCell align="right"><strong>Outward Tax</strong></TableCell>
                      <TableCell align="right"><strong>Eligible ITC</strong></TableCell>
                      <TableCell align="right"><strong>Net Liability</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>CGST</TableCell>
                      <TableCell align="right">₹{gstr3bData.outwardTaxableSupplies?.cgst?.toFixed(2)}</TableCell>
                      <TableCell align="right">₹{gstr3bData.itcAvailable?.cgst?.toFixed(2)}</TableCell>
                      <TableCell align="right"><strong>₹{gstr3bData.netTaxLiability?.cgstPayable?.toFixed(2)}</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>SGST</TableCell>
                      <TableCell align="right">₹{gstr3bData.outwardTaxableSupplies?.sgst?.toFixed(2)}</TableCell>
                      <TableCell align="right">₹{gstr3bData.itcAvailable?.sgst?.toFixed(2)}</TableCell>
                      <TableCell align="right"><strong>₹{gstr3bData.netTaxLiability?.sgstPayable?.toFixed(2)}</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>IGST</TableCell>
                      <TableCell align="right">₹{gstr3bData.outwardTaxableSupplies?.igst?.toFixed(2)}</TableCell>
                      <TableCell align="right">₹{gstr3bData.itcAvailable?.igst?.toFixed(2)}</TableCell>
                      <TableCell align="right"><strong>₹{gstr3bData.netTaxLiability?.igstPayable?.toFixed(2)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Info Sidebar */}
        <Grid item xs={12} md={5} lg={4}>
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" mb={2} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Included Reports
          </Typography>
          <Stack spacing={2.5}>
            {auditFiles.map((file, i) => (
              <Card key={i} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 4, transition: '0.2s', '&:hover': { borderColor: theme.palette.primary.main } }}>
                <CardContent sx={{ display: 'flex', gap: 2.5, alignItems: 'center', py: '20px !important' }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', width: 48, height: 48 }}>{file.icon}</Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={800} color="text.primary">{file.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{file.desc}</Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}