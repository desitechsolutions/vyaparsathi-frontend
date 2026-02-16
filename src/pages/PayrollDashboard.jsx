import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, Typography, Paper, Button, Stack, Divider, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem 
} from '@mui/material';
import { Add, Payments, Download, CalendarMonth } from '@mui/icons-material';

// API Functions
import { 
  fetchStaff, 
  addStaff, 
  processBulkSalary, 
  processSalary, 
  issueStaffAdvance 
} from '../services/api'; 

// Sub-components
import PayrollTable from './payroll/PayrollTable';
import SalarySummaryCards from './payroll/SalarySummaryCards';
import AdvancePaymentModal from './payroll/AdvancePaymentModal';
import ProcessSalaryModal from './payroll/ProcessSalaryModal';

const ROLES = ['Sales Admin', 'Inventory Manager', 'Delivery Lead', 'Store Keeper', 'Accountant'];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function PayrollDashboard() {
  const { t } = useTranslation();
  
  // --- State Management ---
  const [staffList, setStaffList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [activeStaff, setActiveStaff] = useState(null);

  // Period Selection
  const [period, setPeriod] = useState({
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear()
  });

  // Modal Visibility States
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openAdvanceModal, setOpenAdvanceModal] = useState(false);
  const [openProcessModal, setOpenProcessModal] = useState(false);

  const [newStaff, setNewStaff] = useState({
    name: '', phone: '', role: '', baseSalary: '', joiningDate: new Date().toISOString().split('T')[0]
  });

  // --- Data Fetching ---
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchStaff(period.month, period.year, 0, 100);
      setStaffList(data.content || []);
    } catch (error) {
      setToast({ open: true, message: "Failed to load staff data", severity: 'error' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { 
  loadData(); 
}, [period.month, period.year]);

  // --- Action Handlers ---

  const handleIssueAdvance = async (staffId, amount, remarks) => {
    try {
      await issueStaffAdvance(staffId, amount, remarks);
      setToast({ open: true, message: "Advance payment recorded!", severity: 'success' });
      setOpenAdvanceModal(false);
      loadData();
    } catch (err) {
      setToast({ open: true, message: "Error issuing advance", severity: 'error' });
    }
  };

  const handleProcessSingleSalary = async (payload) => {
    try {
      await processSalary(payload);
      setToast({ open: true, message: `Salary disbursed for ${activeStaff.name}`, severity: 'success' });
      setOpenProcessModal(false);
      loadData();
    } catch (err) {
      setToast({ open: true, message: "Payment failed. Check if already paid.", severity: 'error' });
    }
  };

  const handleBulkPay = async () => {
    const selectedStaff = staffList.filter(s => selectedIds.includes(s.id));
    const payload = selectedStaff.map(s => ({
      staffId: s.id,
      salaryMonth: period.month,
      salaryYear: period.year,
      bonus: 0,
      deductions: 0,
      advanceDeduction: 0,
      paymentMode: 'CASH'
    }));

    try {
      await processBulkSalary(payload);
      setToast({ open: true, message: `Bulk processed ${selectedIds.length} payments!`, severity: 'success' });
      setSelectedIds([]);
      loadData();
    } catch (err) {
      setToast({ open: true, message: "Bulk processing failed", severity: 'error' });
    }
  };

  const handleAddStaffSubmit = async () => {
    try {
      await addStaff(newStaff);
      setOpenAddModal(false);
      loadData();
      setToast({ open: true, message: "Staff added successfully!", severity: 'success' });
    } catch (error) {
      setToast({ open: true, message: "Error adding staff", severity: 'error' });
    }
  };

  // --- Modal Helpers ---
  const handleOpenAdvance = (staff) => {
    setActiveStaff(staff);
    setOpenAdvanceModal(true);
  };

  const handleOpenProcess = (staff) => {
    setActiveStaff(staff);
    setOpenProcessModal(true);
  };

  const totalSelectedPay = staffList
    .filter(i => selectedIds.includes(i.id))
    .reduce((a, b) => a + Number(b.baseSalary), 0);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header & Controls */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#1e293b">Payroll Dashboard</Typography>
          <Stack direction="row" spacing={1} alignItems="center" mt={1}>
            <CalendarMonth fontSize="small" color="action" />
            <TextField
              select
              size="small"
              variant="standard"
              value={period.month}
              onChange={(e) => setPeriod({...period, month: e.target.value})}
              sx={{ minWidth: 100 }}
            >
              {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
            <Typography variant="body2" color="text.secondary">{period.year}</Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={2}>
          {selectedIds.length > 0 && (
            <Button 
              variant="contained" color="success" startIcon={<Payments />}
              onClick={handleBulkPay}
              sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
            >
              Bulk Pay (₹{totalSelectedPay.toLocaleString()})
            </Button>
          )}
          <Button 
            variant="contained" startIcon={<Add />} onClick={() => setOpenAddModal(true)}
            sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', bgcolor: '#1e293b' }}
          >
            Add Staff
          </Button>
        </Stack>
      </Stack>

      <SalarySummaryCards data={staffList} />

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', mt: 4, overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white' }}>
          <Typography variant="h6" fontWeight={800}>Staff Management</Typography>
          <Button startIcon={<Download />} size="small">Export CSV</Button>
        </Box>
        <Divider />
        <PayrollTable 
          data={staffList} 
          selectedIds={selectedIds} 
          setSelectedIds={setSelectedIds}
          loading={loading}
          onOpenAdvance={handleOpenAdvance}
          onOpenProcess={handleOpenProcess}
        />
      </Paper>

      {/* MODALS */}
      <AdvancePaymentModal 
        open={openAdvanceModal} 
        onClose={() => setOpenAdvanceModal(false)} 
        staff={activeStaff} 
        onConfirm={handleIssueAdvance} 
      />

      <ProcessSalaryModal 
        open={openProcessModal} 
        onClose={() => setOpenProcessModal(false)} 
        staff={activeStaff} 
        period={period} 
        onConfirm={handleProcessSingleSalary} 
      />

      {/* --- ADD STAFF DIALOG --- */}
      <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Create Staff Profile</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Full Name" fullWidth size="small" onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}/>
            <TextField label="Phone Number" fullWidth size="small" onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}/>
            <TextField select label="Role" fullWidth size="small" value={newStaff.role} onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}>
              {ROLES.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
            </TextField>
            <TextField label="Monthly Base Salary" type="number" fullWidth size="small" onChange={(e) => setNewStaff({...newStaff, baseSalary: e.target.value})}/>
            <TextField label="Joining Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={newStaff.joiningDate} onChange={(e) => setNewStaff({...newStaff, joiningDate: e.target.value})}/>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenAddModal(false)} color="inherit">Cancel</Button>
          <Button onClick={handleAddStaffSubmit} variant="contained">Save Staff</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}