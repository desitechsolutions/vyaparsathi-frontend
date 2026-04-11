import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, Stack, Card, CardContent, 
  Avatar, Alert, TextField, MenuItem, CircularProgress, Divider, 
  useTheme, useMediaQuery, LinearProgress 
} from '@mui/material';
import { 
  FolderZip, VerifiedUser, BusinessCenter, AccountBalance, 
  Description, HelpOutline, CheckCircleOutline 
} from '@mui/icons-material';
import { downloadAuditPack } from '../../services/api';

const auditFiles = [
  { title: "GST Sales Register", icon: <Description color="primary" />, desc: "GSTR-1 format CSV for B2B/B2C sales." },
  { title: "HSN Summary", icon: <AccountBalance color="secondary" />, desc: "Table 12 grouping for GST compliance." },
  { title: "Purchase/ITC", icon: <BusinessCenter color="success" />, desc: "Input Tax Credit ledger for inventory." },
  { title: "P&L Statement", icon: <VerifiedUser color="warning" />, desc: "Income/Expense summary for ITR." }
];

export default function TaxComplianceHub() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for selectors
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Calculate start and end dates for the selected month
      const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const toDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Call the API
      const response = await downloadAuditPack(fromDate, toDate);

      // Handle Blob and Trigger Download
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Audit_Pack_${month}_${year}.zip`);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
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

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#1E293B">{t('taxComplianceHub.title')}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {t('taxComplianceHub.subtitle')}
          </Typography>
        </Box>
        {!isMobile && (
          <Button startIcon={<HelpOutline />} sx={{ fontWeight: 700, textTransform: 'none' }}>
            Compliance Guide
          </Button>
        )}
      </Stack>

      <Grid container spacing={4}>
        {/* Main Generator Card */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
            {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
            
            <Typography variant="h6" fontWeight={800} mb={3}>Generate New Audit Package</Typography>
            
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

            <Box sx={{ bgcolor: '#F1F5F9', p: 3, borderRadius: 4, mb: 4 }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                    Package Contents
                </Typography>
                <Typography variant="body2" color="#475569">
                    This ZIP will include a Sales Register (GSTR-1), HSN Summary (Table 12), and an ITC Purchase ledger. All data is formatted for Tally/Busy import.
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}
            {success && <Alert icon={<CheckCircleOutline fontSize="inherit" />} severity="success" sx={{ mb: 3, borderRadius: 3 }}>Pack generated successfully! Check your downloads.</Alert>}

            <Button 
              variant="contained" 
              fullWidth 
              size="large" 
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FolderZip />}
              onClick={handleExport} 
              disabled={loading} 
              sx={{ 
                py: 2, borderRadius: 4, fontWeight: 800, textTransform: 'none', fontSize: '1.1rem',
                bgcolor: '#1E293B', boxShadow: '0 10px 15px -3px rgba(30, 41, 59, 0.2)',
                '&:hover': { bgcolor: '#0F172A' }
              }}
            >
              {loading ? "Compiling Audit Data..." : "Download Export Pack (ZIP)"}
            </Button>
          </Paper>
        </Grid>

        {/* Info Sidebar */}
        <Grid item xs={12} md={5} lg={4}>
          <Typography variant="subtitle2" fontWeight={800} color="#64748B" mb={2} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Included Reports
          </Typography>
          <Stack spacing={2.5}>
            {auditFiles.map((file, i) => (
              <Card key={i} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 4, transition: '0.2s', '&:hover': { borderColor: theme.palette.primary.main } }}>
                <CardContent sx={{ display: 'flex', gap: 2.5, alignItems: 'center', py: '20px !important' }}>
                  <Avatar sx={{ bgcolor: '#F1F5F9', width: 48, height: 48 }}>{file.icon}</Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={800} color="#1E293B">{file.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{file.desc}</Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Paper elevation={0} sx={{ mt: 4, p: 3, borderRadius: 4, bgcolor: '#EFF6FF', border: '1px dashed #3B82F6' }}>
            <Typography variant="subtitle2" fontWeight={800} color="#1D4ED8" gutterBottom>CA Collaboration</Typography>
            <Typography variant="caption" color="#3B82F6" fontWeight={500}>
              You can directly email this ZIP to your CA. It includes all necessary headers for direct import into GSTR-1 offline tools.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}