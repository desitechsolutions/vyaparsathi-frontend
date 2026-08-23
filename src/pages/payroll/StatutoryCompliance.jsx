import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Tabs, Tab, TextField, Button, Stack, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  CircularProgress, Snackbar, Typography, MenuItem, LinearProgress
} from '@mui/material';
import { Save as SaveIcon, Download as DownloadIcon, Check as CheckIcon } from '@mui/icons-material';
import * as api from '../../services/api';

export default function StatutoryCompliance() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const [config, setConfig] = useState({
    pfUan: '',
    esicCode: '',
    ptState: 'MH',
    taxRegime: 'NEW_REGIME',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      // GET statutory config from backend
      const data = await api.getStatutoryConfig ? api.getStatutoryConfig() : null;
      if (data) setConfig(prev => ({ ...prev, ...data }));
    } catch (err) {
      // Config may not exist yet — continue with defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      if (api.saveStatutoryConfig) {
        await api.saveStatutoryConfig(config);
      }
      setToast({ open: true, message: 'Statutory configuration saved successfully', severity: 'success' });
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Failed to save config', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (field, value) => setConfig({ ...config, [field]: value });

  const indianStates = [
    { code: 'MH', name: 'Maharashtra' }, { code: 'DL', name: 'Delhi' },
    { code: 'KA', name: 'Karnataka' }, { code: 'TN', name: 'Tamil Nadu' },
    { code: 'AP', name: 'Andhra Pradesh' }, { code: 'TS', name: 'Telangana' },
    { code: 'WB', name: 'West Bengal' }, { code: 'GJ', name: 'Gujarat' },
    { code: 'RJ', name: 'Rajasthan' }, { code: 'UP', name: 'Uttar Pradesh' },
  ];

  // Static slab display (managed via backend config)
  const pfSlabs = [{ id: 1, effectiveFrom: '2024-04-01', wageLimit: '₹15,000', eeRate: '12%', erRate: '12%', epfRate: '3.67%', epsRate: '8.33%' }];
  const esiSlabs = [{ id: 1, effectiveFrom: '2024-04-01', ceiling: '₹21,000', eeRate: '0.75%', erRate: '3.25%' }];
  const ptSlabs = [
    { id: 1, state: 'MH', effectiveFrom: '2024-04-01', salaryFrom: '₹0', salaryTo: '₹10,000', ptAmount: '₹0' },
    { id: 2, state: 'MH', effectiveFrom: '2024-04-01', salaryFrom: '₹10,001', salaryTo: '₹25,000', ptAmount: '₹150' },
    { id: 3, state: 'MH', effectiveFrom: '2024-04-01', salaryFrom: '₹25,001', salaryTo: 'Above', ptAmount: '₹200' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Statutory Compliance Configuration</Typography>

      <Snackbar open={toast.open} autoHideDuration={5000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Organization Details" />
        <Tab label="PF Slabs" />
        <Tab label="ESI Slabs" />
        <Tab label="PT Slabs" />
        <Tab label="Submissions" />
      </Tabs>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Organization Details</Typography>
            <Stack spacing={2} sx={{ maxWidth: 600 }}>
              <TextField label="PF Registration Number (PF UAN)"
                value={config.pfUan}
                onChange={(e) => handleConfigChange('pfUan', e.target.value)}
                fullWidth placeholder="UP/DBN/2024/00001" />
              <TextField label="ESIC Code"
                value={config.esicCode}
                onChange={(e) => handleConfigChange('esicCode', e.target.value)}
                fullWidth placeholder="AP1234567800000" />
              <TextField label="Professional Tax State" select
                value={config.ptState}
                onChange={(e) => handleConfigChange('ptState', e.target.value)}
                fullWidth>
                {indianStates.map(s => (
                  <MenuItem key={s.code} value={s.code}>{s.name} ({s.code})</MenuItem>
                ))}
              </TextField>
              <TextField label="Default Tax Regime" select
                value={config.taxRegime}
                onChange={(e) => handleConfigChange('taxRegime', e.target.value)}
                fullWidth>
                <MenuItem value="NEW_REGIME">New Regime (Default from FY 2024-25)</MenuItem>
                <MenuItem value="OLD_REGIME">Old Regime</MenuItem>
              </TextField>
              <TextField label="Bank Name"
                value={config.bankName}
                onChange={(e) => handleConfigChange('bankName', e.target.value)}
                fullWidth />
              <TextField label="Bank Account Number"
                value={config.bankAccount}
                onChange={(e) => handleConfigChange('bankAccount', e.target.value)}
                fullWidth />
              <TextField label="Bank IFSC Code"
                value={config.bankIfsc}
                onChange={(e) => handleConfigChange('bankIfsc', e.target.value)}
                fullWidth />
              <Button
                variant="contained" startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
                onClick={handleSaveConfig} disabled={saving} sx={{ alignSelf: 'flex-start' }}>
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">PF Contribution Slabs</Typography>
              <Chip label="FY 2024-25" size="small" />
            </Stack>
            <Alert severity="info" sx={{ mb: 2 }}>
              PF slabs are defined by EPFO. Employee and employer each contribute 12% of basic + DA, capped at ₹15,000.
            </Alert>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Effective From</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Wage Limit</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>EE Rate</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ER Rate</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>EPF (ER)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>EPS (ER)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pfSlabs.map(slab => (
                    <TableRow key={slab.id}>
                      <TableCell>{slab.effectiveFrom}</TableCell>
                      <TableCell>{slab.wageLimit}</TableCell>
                      <TableCell>{slab.eeRate}</TableCell>
                      <TableCell>{slab.erRate}</TableCell>
                      <TableCell>{slab.epfRate}</TableCell>
                      <TableCell>{slab.epsRate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>ESI Contribution Slabs</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              ESI applies to employees with gross salary ≤ ₹21,000/month. Employee: 0.75%, Employer: 3.25%.
            </Alert>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Effective From</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Wage Ceiling</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>EE Rate</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ER Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {esiSlabs.map(slab => (
                    <TableRow key={slab.id}>
                      <TableCell>{slab.effectiveFrom}</TableCell>
                      <TableCell>{slab.ceiling}</TableCell>
                      <TableCell>{slab.eeRate}</TableCell>
                      <TableCell>{slab.erRate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Professional Tax Slabs — {config.ptState}</Typography>
            </Stack>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>State</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Effective From</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Salary From</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Salary To</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>PT Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ptSlabs.map(slab => (
                    <TableRow key={slab.id}>
                      <TableCell>{slab.state}</TableCell>
                      <TableCell>{slab.effectiveFrom}</TableCell>
                      <TableCell>{slab.salaryFrom}</TableCell>
                      <TableCell>{slab.salaryTo}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{slab.ptAmount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Pending Statutory Submissions</Typography>
            <Stack spacing={2}>
              <Alert severity="warning">
                ECR (PF) and ESIC returns should be filed by the 15th of each month.
              </Alert>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Filing</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { type: 'ECR (EPFO)', period: 'Aug 2026', due: '15 Sep 2026', status: 'PENDING' },
                      { type: 'ESIC Return', period: 'Aug 2026', due: '15 Sep 2026', status: 'PENDING' },
                      { type: 'PT Return', period: 'Aug 2026', due: '30 Sep 2026', status: 'PENDING' },
                    ].map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell fontWeight={600}>{item.type}</TableCell>
                        <TableCell>{item.period}</TableCell>
                        <TableCell>{item.due}</TableCell>
                        <TableCell>
                          <Chip label={item.status} color="warning" size="small" />
                        </TableCell>
                        <TableCell>
                          <Button size="small" startIcon={<DownloadIcon />} variant="outlined">
                            Generate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
