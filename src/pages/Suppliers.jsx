import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Typography, Box, Stack, Button, TextField, Modal, IconButton, Snackbar,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Tooltip, CircularProgress, Divider, Avatar, Card, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Business as BusinessIcon, Email as EmailIcon, Phone as PhoneIcon,
  LocationOn as LocationOnIcon, Person as PersonIcon,
  Assignment as AssignmentIcon, Search as SearchIcon,
  Verified as VerifiedIcon, WarningAmber as WarningIcon,
  Group as GroupIcon
} from "@mui/icons-material";
import { styled } from "@mui/system";

// API helpers
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "../services/api";

const StyledModal = styled(Modal)({
  display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)",
});

const ModalContent = styled(Box)(({ theme }) => ({
  backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  padding: "2rem", width: "95%", maxWidth: "550px", position: "relative",
  border: "1px solid rgba(0,0,0,0.05)"
}));

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2.5, borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
    <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 52, height: 52 }}>
      {icon}
    </Avatar>
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</Typography>
      <Typography variant="h5" fontWeight={900}>{value}</Typography>
    </Box>
  </Card>
);

const initialForm = { name: "", contactPerson: "", phone: "", email: "", address: "", gstin: "" };

const Suppliers = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); 
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [search, setSearch] = useState("");

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await getSuppliers();
      setSuppliers(res || []);
    } catch (e) {
      showSnackbar(t('suppliersPage.errorFetch'), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenModal = (mode, supplier = null) => {
    setModalMode(mode);
    setSelectedSupplier(supplier);
    setForm(supplier ? { ...supplier } : initialForm);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
        showSnackbar(t('suppliersPage.errorRequired'), "warning");
        return;
    }

    try {
      if (modalMode === "add") await createSupplier(form);
      else await updateSupplier(selectedSupplier.id, form);
      showSnackbar(modalMode === "add" ? t('suppliersPage.successCreate') : t('suppliersPage.successUpdate'), "success");
      fetchSuppliers();
      setModalOpen(false);
    } catch (e) {
      showSnackbar(t('suppliersPage.errorSave'), "error");
    }
  };

  const confirmDelete = (supplier) => {
    setSelectedSupplier(supplier);
    setDeleteDialogOpen(true);
  };

  const handleActualDelete = async () => {
    try {
      await deleteSupplier(selectedSupplier.id);
      showSnackbar(t('suppliersPage.successDelete'), "success");
      fetchSuppliers();
    } catch (e) {
      showSnackbar(t('suppliersPage.errorDelete'), "error");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    Object.values(s).some(val => String(val).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: "#fcfcfc", minHeight: "100vh" }}>
      <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
        
        {/* Header Section */}
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="flex-end" spacing={2} sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ color: "#1a1a1a", display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <BusinessIcon fontSize="large" color="primary" /> {t('suppliersPage.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" fontWeight={500}>{t('suppliersPage.subtitle')}</Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenModal("add")}
            sx={{ borderRadius: 2.5, px: 4, py: 1.4, fontWeight: 800, textTransform: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.08)' }}
          >
            {t('suppliersPage.addSupplier')}
          </Button>
        </Stack>

        {/* Stats Row */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6}>
            <StatCard title={t('suppliersPage.totalSuppliers')} value={suppliers.length} icon={<GroupIcon />} color="primary" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StatCard title={t('suppliersPage.verifiedSuppliers')} value={suppliers.filter(s => s.gstin).length} icon={<VerifiedIcon />} color="success" />
          </Grid>
        </Grid>

        {/* List Section */}
        <Paper sx={{ borderRadius: 4, overflow: "hidden", border: '1px solid', borderColor: '#eee', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <Box sx={{ p: 3, bgcolor: "#fff", borderBottom: '1px solid #f1f5f9' }}>
            <TextField
              placeholder={t('suppliersPage.searchPlaceholder')}
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "text.disabled", mr: 1.5 }} />,
              }}
              sx={{ maxWidth: 500, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f9f9f9' } }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#fafafa" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', py: 2 }}>{t('suppliersPage.columns.supplier').toUpperCase()}</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('suppliersPage.contactPerson').toUpperCase()}</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('suppliersPage.columns.contact').toUpperCase()}</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('suppliersPage.columns.gstin').toUpperCase()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', pr: 4 }}>{t('suppliersPage.columns.actions').toUpperCase()}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 12 }}><CircularProgress size={35} /></TableCell></TableRow>
                ) : filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((s) => (
                    <TableRow key={s.id} hover sx={{ '&:hover': { bgcolor: '#fcfdfe !important' } }}>
                      <TableCell sx={{ py: 2.5 }}>
                        <Typography variant="body1" fontWeight={800} color="#1a1a1a">{s.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 13 }} /> {s.address || "No address provided"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.85rem', fontWeight: 800, bgcolor: 'primary.main', border: '2px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                            {s.contactPerson?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{s.contactPerson}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="primary.main">{s.phone}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.email || "N/A"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ 
                          bgcolor: s.gstin ? "#e8f5e9" : "#f5f5f5", 
                          color: s.gstin ? "#2e7d32" : "#9e9e9e", 
                          px: 1.5, py: 0.6, borderRadius: 1.5, display: 'inline-block', fontSize: '0.7rem', fontWeight: 900, border: '1px solid', borderColor: s.gstin ? "#c8e6c9" : "#eee"
                        }}>
                          {s.gstin || "UNREGISTERED"}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <Stack direction="row" justifyContent="flex-end" spacing={1}>
                          <Tooltip title={t('suppliersPage.tooltips.view')}><IconButton size="small" onClick={() => handleOpenModal("view", s)} sx={{ bgcolor: '#f5f5f5' }}><AssignmentIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={t('suppliersPage.tooltips.edit')}><IconButton size="small" onClick={() => handleOpenModal("edit", s)} color="primary" sx={{ bgcolor: '#e3f2fd' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={t('suppliersPage.tooltips.delete')}><IconButton size="small" onClick={() => confirmDelete(s)} color="error" sx={{ bgcolor: '#ffebee' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      <Typography variant="body1" color="text.secondary">No matching suppliers found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Profile/Entry Modal */}
      <StyledModal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalContent>
          <Typography variant="h5" fontWeight={900} color="primary.main" gutterBottom>
            {modalMode === "add" ? t('suppliersPage.addSupplier') : modalMode === "edit" ? t('suppliersPage.editSupplier') : t('suppliersPage.viewSupplier')}
          </Typography>
          <Divider sx={{ mb: 4, opacity: 0.6 }} />
          <Box component="form" onSubmit={handleFormSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}><TextField label={t('suppliersPage.name')} fullWidth value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={modalMode === 'view'} size="small" required /></Grid>
              <Grid item xs={6}><TextField label={t('suppliersPage.contactPerson')} fullWidth value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} disabled={modalMode === 'view'} size="small" /></Grid>
              <Grid item xs={6}><TextField label={t('suppliersPage.phone')} fullWidth value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} disabled={modalMode === 'view'} size="small" required /></Grid>
              <Grid item xs={12}><TextField label={t('suppliersPage.email')} fullWidth value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={modalMode === 'view'} size="small" /></Grid>
              <Grid item xs={12}><TextField label={t('suppliersPage.address')} multiline rows={3} fullWidth value={form.address} onChange={e => setForm({...form, address: e.target.value})} disabled={modalMode === 'view'} size="small" /></Grid>
              <Grid item xs={12}><TextField label={t('suppliersPage.gstin')} fullWidth value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value})} disabled={modalMode === 'view'} size="small" /></Grid>
            </Grid>
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 5 }}>
              <Button onClick={() => setModalOpen(false)} variant="outlined" color="inherit" sx={{ borderRadius: 2, fontWeight: 700 }}>{modalMode === 'view' ? t('common.close') : t('common.cancel')}</Button>
              {modalMode !== 'view' && <Button type="submit" variant="contained" sx={{ fontWeight: 800, px: 5, borderRadius: 2 }}>{modalMode === 'add' ? t('suppliersPage.createSupplier') : t('suppliersPage.saveChanges')}</Button>}
            </Stack>
          </Box>
        </ModalContent>
      </StyledModal>

      {/* Professional Deletion Prompt */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1.5, maxWidth: 450 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 900, color: 'error.main' }}>
          <WarningIcon /> {t('suppliersPage.confirmDelete')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: 'text.primary', mt: 1 }}>
            {t('suppliersPage.confirmDeleteText', { name: selectedSupplier?.name })}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2, bgcolor: '#fff3e0', p: 1.5, borderRadius: 2, border: '1px solid #ffe0b2' }}>
            {t('suppliersPage.deleteWarning')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="text" color="inherit" sx={{ fontWeight: 700 }}>{t('common.cancel')}</Button>
          <Button onClick={handleActualDelete} variant="contained" color="error" sx={{ fontWeight: 800, px: 3, borderRadius: 2 }}>{t('suppliersPage.deleteSupplier')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open: false})} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 3, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Suppliers;