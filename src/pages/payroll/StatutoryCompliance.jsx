import React, { useState } from 'react';
import {
  Box, Card, CardContent, Tabs, Tab, TextField, Button, Stack, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import { Download as DownloadIcon, Check as CheckIcon } from '@mui/icons-material';

export default function StatutoryCompliance() {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState({
    pfUan: 'UP/DBN/2024/00001',
    esicCode: 'AP1234567800000',
    ptState: 'MH',
    taxRegime: 'NEW_REGIME',
    bankName: 'ICICI Bank',
    bankAccount: '1234567890',
    bankIfsc: 'ICIC0000001',
  });

  const [slabs, setSlabs] = useState({
    pf: [
      { id: 1, effectiveFrom: '2024-04-01', wageLimit: 50000, eeRate: 12, erRate: 12, epfRate: 3.67, epsRate: 8.33 }
    ],
    esi: [
      { id: 1, effectiveFrom: '2024-04-01', ceiling: 21000, eeRate: 0.75, erRate: 3.25 }
    ],
    pt: [
      { id: 1, state: 'MH', effectiveFrom: '2024-04-01', salaryFrom: 0, salaryTo: 10000, ptAmount: 0 },
      { id: 2, state: 'MH', effectiveFrom: '2024-04-01', salaryFrom: 10001, salaryTo: 25000, ptAmount: 150 }
    ]
  });

  const handleConfigChange = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  const handleSaveConfig = () => {
    alert('Statutory configuration saved');
  };

  return (
    <Box>
      <h1>Statutory Compliance Configuration</h1>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Organization Details" />
        <Tab label="PF Slabs" />
        <Tab label="ESI Slabs" />
        <Tab label="PT Slabs" />
        <Tab label="Submissions" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <CardContent>
            <h3>Organization Details</h3>
            <Stack spacing={2}>
              <TextField
                label="PF UAN"
                value={config.pfUan}
                onChange={(e) => handleConfigChange('pfUan', e.target.value)}
                fullWidth
              />
              <TextField
                label="ESIC Code"
                value={config.esicCode}
                onChange={(e) => handleConfigChange('esicCode', e.target.value)}
                fullWidth
              />
              <TextField
                label="PT State"
                select
                value={config.ptState}
                onChange={(e) => handleConfigChange('ptState', e.target.value)}
                fullWidth
                SelectProps={{ native: true }}
              >
                <option>MH</option>
                <option>DL</option>
                <option>KA</option>
                <option>TN</option>
              </TextField>
              <TextField
                label="Tax Regime"
                select
                value={config.taxRegime}
                onChange={(e) => handleConfigChange('taxRegime', e.target.value)}
                fullWidth
                SelectProps={{ native: true }}
              >
                <option>NEW_REGIME</option>
                <option>OLD_REGIME</option>
              </TextField>
              <TextField
                label="Bank Name"
                value={config.bankName}
                onChange={(e) => handleConfigChange('bankName', e.target.value)}
                fullWidth
              />
              <TextField
                label="Bank Account"
                value={config.bankAccount}
                onChange={(e) => handleConfigChange('bankAccount', e.target.value)}
                fullWidth
              />
              <TextField
                label="Bank IFSC"
                value={config.bankIfsc}
                onChange={(e) => handleConfigChange('bankIfsc', e.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={handleSaveConfig}>Save Configuration</Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <h3>PF Contribution Slabs</h3>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Effective From</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Wage Limit</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>EE Rate %</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ER Rate %</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>EPF %</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>EPS %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slabs.pf.map(slab => (
                    <TableRow key={slab.id}>
                      <TableCell>{slab.effectiveFrom}</TableCell>
                      <TableCell>₹{slab.wageLimit}</TableCell>
                      <TableCell>{slab.eeRate}%</TableCell>
                      <TableCell>{slab.erRate}%</TableCell>
                      <TableCell>{slab.epfRate}%</TableCell>
                      <TableCell>{slab.epsRate}%</TableCell>
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
            <h3>ESI Contribution Slabs</h3>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Effective From</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Wage Ceiling</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>EE Rate %</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ER Rate %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slabs.esi.map(slab => (
                    <TableRow key={slab.id}>
                      <TableCell>{slab.effectiveFrom}</TableCell>
                      <TableCell>₹{slab.ceiling}</TableCell>
                      <TableCell>{slab.eeRate}%</TableCell>
                      <TableCell>{slab.erRate}%</TableCell>
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
            <h3>Professional Tax Slabs (Maharashtra)</h3>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Salary From</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Salary To</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>PT Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slabs.pt.map(slab => (
                    <TableRow key={slab.id}>
                      <TableCell>₹{slab.salaryFrom}</TableCell>
                      <TableCell>₹{slab.salaryTo}</TableCell>
                      <TableCell>₹{slab.ptAmount}</TableCell>
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
            <h3>Compliance Submissions</h3>
            <Alert severity="info" sx={{ mb: 2 }}>
              Track PF ECR, ESIC, PT, and TDS submissions
            </Alert>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>PF ECR</TableCell>
                    <TableCell>2024-09</TableCell>
                    <TableCell><Chip label="SUBMITTED" color="success" size="small" /></TableCell>
                    <TableCell><Button size="small" startIcon={<DownloadIcon />}>Download</Button></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>ESIC Return</TableCell>
                    <TableCell>2024-09</TableCell>
                    <TableCell><Chip label="PENDING" color="warning" size="small" /></TableCell>
                    <TableCell><Button size="small" startIcon={<DownloadIcon />}>Export</Button></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
