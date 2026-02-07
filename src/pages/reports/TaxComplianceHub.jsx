import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Button, Stack, Card, CardContent, Avatar, Alert, TextField, MenuItem } from '@mui/material';
import { FolderZip, VerifiedUser, BusinessCenter, AccountBalance, Description, CloudDownload } from '@mui/icons-material';

const auditFiles = [
  { title: "GST Sales Register", icon: <Description color="primary" />, desc: "Invoices with GSTINs for GSTR-1." },
  { title: "HSN Summary", icon: <AccountBalance color="secondary" />, desc: "Mandatory HSN-wise tax grouping." },
  { title: "ITC Register", icon: <BusinessCenter color="success" />, desc: "Purchase data for Input Tax Credit." },
  { title: "P&L Statement", icon: <VerifiedUser color="warning" />, desc: "Income/Expense summary for ITR." }
];

export default function TaxComplianceHub() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight={900} gutterBottom>Tax & Compliance Hub</Typography>
      <Typography color="text.secondary" mb={4}>Download audit-ready packages for your Chartered Accountant (CA).</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" fontWeight={800} mb={3}>Generate Audit Pack</Typography>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}><TextField select fullWidth label="Financial Year" defaultValue="2025-26"><MenuItem value="2025-26">2025-26</MenuItem></TextField></Grid>
              <Grid item xs={6}><TextField select fullWidth label="Period" defaultValue="Jan"><MenuItem value="Jan">January 2026</MenuItem><MenuItem value="Q3">Q3 (Oct-Dec)</MenuItem></TextField></Grid>
            </Grid>
            <Button 
              variant="contained" fullWidth size="large" startIcon={<FolderZip />}
              onClick={handleExport} disabled={loading} sx={{ py: 2, borderRadius: 3, fontWeight: 800 }}
            >
              {loading ? "Preparing Audit Pack..." : "Download CA Export Pack (ZIP)"}
            </Button>
            {success && <Alert severity="success" sx={{ mt: 2 }}>Pack Ready! Audit_Pack_Jan_2026.zip has been generated.</Alert>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {auditFiles.map((file, i) => (
              <Card key={i} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'transparent' }}>{file.icon}</Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800}>{file.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{file.desc}</Typography>
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