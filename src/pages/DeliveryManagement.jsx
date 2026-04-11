import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button, Drawer, TextField, MenuItem, Select, InputLabel, FormControl,
  Chip, CircularProgress, Snackbar, Alert, Autocomplete, Divider, 
  Grid, Card, CardContent, Stack
} from '@mui/material';
import {
  Visibility, Print, Close, FileDownload,
  ClearAll, Inbox, LocalShipping, CheckCircle, AccessTime, Search
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { CSVLink } from 'react-csv';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  fetchDeliveries, assignDeliveryPerson,
  updateDeliveryStatus, fetchDeliveryPersons, createDeliveryPerson
} from '../services/api';
import PrintableDelivery from '../components/PrintableDelivery';

const DeliveryManagement = () => {
  const { t } = useTranslation();

  // Memoized config to react to language changes
  const statusConfig = useMemo(() => ({
    PENDING: { label: t('deliveryPage.statusPENDING'), color: "default", icon: <AccessTime fontSize="small" />, order: 1 },
    PACKED: { label: t('deliveryPage.statusPACKED'), color: "warning", icon: <Inbox fontSize="small" />, order: 2 },
    OUT_FOR_DELIVERY: { label: t('deliveryPage.statusOUT_FOR_DELIVERY'), color: "info", icon: <LocalShipping fontSize="small" />, order: 3 },
    IN_TRANSIT: { label: t('deliveryPage.statusIN_TRANSIT'), color: "secondary", icon: <LocalShipping fontSize="small" />, order: 4 },
    DELIVERED: { label: t('deliveryPage.statusDELIVERED'), color: "success", icon: <CheckCircle fontSize="small" />, order: 5 },
    CANCELLED: { label: t('deliveryPage.statusCANCELLED'), color: "error", icon: <Close fontSize="small" />, order: 0 }
  }), [t]);

  // --- State Management ---
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
  const [assignMode, setAssignMode] = useState(false);
  const [assignPerson, setAssignPerson] = useState({ name: "", phone: "", notes: "" });
  const [updateStatus, setUpdateStatus] = useState("");

  const printRef = useRef();

  // --- Data Loading ---
  const loadData = useCallback(async (updateSelectedId = null) => {
    setLoading(updateSelectedId ? false : true); 
    try {
      const [deliveriesRes, personsRes] = await Promise.all([fetchDeliveries(), fetchDeliveryPersons()]);
      const normalizedDeliveries = deliveriesRes.data.map(d => ({
        ...d,
        deliveryId: d.deliveryId || d.id
      }));
      setDeliveries(normalizedDeliveries);
      setDeliveryPersons(personsRes.data);

      if (updateSelectedId) {
        const updated = normalizedDeliveries.find(d => d.deliveryId === updateSelectedId);
        if (updated) setSelectedDelivery(updated);
      }
    } catch (error) {
      showSnackbar(t('deliveryPage.msgLoadError'), "error");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- Search & Filtering Logic ---
  const processedDeliveries = useMemo(() => {
    let filtered = deliveries.filter(d => {
      const matchesStatus = !filterStatus || d.deliveryStatus === filterStatus;
      const matchesSearch = !search ||
        d.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        d.deliveryAddress?.toLowerCase().includes(search.toLowerCase()) ||
        String(d.invoiceNumber).toLowerCase().includes(search.toLowerCase());

      const deliveryDate = dayjs(d.createdAt);
      const matchesDate = (!dateRange.start || deliveryDate.isAfter(dayjs(dateRange.start).subtract(1, 'day'))) &&
        (!dateRange.end || deliveryDate.isBefore(dayjs(dateRange.end).add(1, 'day')));

      return matchesStatus && matchesSearch && matchesDate;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const keyA = sortConfig.key.split('.').reduce((o, i) => o?.[i], a);
        const keyB = sortConfig.key.split('.').reduce((o, i) => o?.[i], b);
        if (keyA < keyB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (keyA > keyB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [deliveries, filterStatus, search, dateRange, sortConfig]);

  const stats = useMemo(() => ({
    total: processedDeliveries.length,
    pending: processedDeliveries.filter(d => d.deliveryStatus === 'PENDING').length,
    delivered: processedDeliveries.filter(d => d.deliveryStatus === 'DELIVERED').length,
  }), [processedDeliveries]);

  // --- Handlers ---
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedDelivery ? `Delivery_${selectedDelivery.invoiceNumber}` : 'Delivery',
    onAfterPrint: () => showSnackbar(t('deliveryPage.msgPrintSuccess'), "success"),
  });

  const showSnackbar = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("");
    setDateRange({ start: '', end: '' });
  };

  const handleOpenDrawer = (d) => {
    setSelectedDelivery(d);
    setDrawerOpen(true);
    setAssignMode(false);
    setUpdateStatus("");
    setAssignPerson({ name: "", phone: "", notes: "" });
  };

  const handleAssignPerson = async () => {
    if (!assignPerson.name || !assignPerson.phone) return showSnackbar(t('deliveryPage.msgAssignReq'), "warning");
    setIsSubmitting(true);
    try {
      let personToAssign = assignPerson;
      if (!personToAssign.id) {
        const newPersonRes = await createDeliveryPerson({
          name: assignPerson.name,
          phone: assignPerson.phone,
          notes: assignPerson.notes
        });
        personToAssign = newPersonRes.data;
      }
      await assignDeliveryPerson(selectedDelivery.deliveryId, personToAssign);
      showSnackbar(t('deliveryPage.msgAssignSuccess'), "success");
      setAssignMode(false);
      await loadData(selectedDelivery.deliveryId);
    } catch (e) { showSnackbar(t('deliveryPage.msgAssignError'), "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateStatus = async () => {
    if (!updateStatus || updateStatus === selectedDelivery.deliveryStatus) return;
    setIsSubmitting(true);
    try {
      await updateDeliveryStatus(selectedDelivery.deliveryId, updateStatus, "Admin");
      showSnackbar(t('deliveryPage.msgUpdateSuccess'), "success");
      setUpdateStatus("");
      await loadData(selectedDelivery.deliveryId);
    } catch (e) { showSnackbar(t('deliveryPage.msgUpdateError'), "error"); }
    finally { setIsSubmitting(false); }
  };

  const canTransitionTo = (targetStatus) => {
    if (!selectedDelivery) return true;
    const currentStatus = selectedDelivery.deliveryStatus;
    if (targetStatus === currentStatus) return false;
    if (currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED') return false;
    const currentOrder = statusConfig[currentStatus]?.order || 0;
    const targetOrder = statusConfig[targetStatus]?.order || 0;
    if (targetStatus === 'CANCELLED') return true;
    return targetOrder > currentOrder;
  };

  const csvHeaders = [
    { label: t('deliveryPage.tableOrder'), key: "invoiceNumber" },
    { label: t('deliveryPage.tableCustomer'), key: "customerName" },
    { label: t('deliveryPage.tableStatus'), key: "deliveryStatus" },
    { label: t('deliveryPage.tableDate'), key: "updatedAt" }
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f5f7f9', minHeight: '100vh' }}>
      <Box sx={{ display: 'none' }}><PrintableDelivery ref={printRef} delivery={selectedDelivery} /></Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e' }}>{t('deliveryPage.title')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('deliveryPage.subtitle')}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <CSVLink data={processedDeliveries} headers={csvHeaders} filename="deliveries.csv" style={{ textDecoration: 'none' }}>
            <Button variant="outlined" startIcon={<FileDownload />}>{t('deliveryPage.export')}</Button>
          </CSVLink>
          <Button variant="contained" startIcon={<Print />} onClick={handlePrint} disabled={!selectedDelivery}>{t('deliveryPage.printLabel')}</Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: t('deliveryPage.statsTotal'), val: stats.total, color: '#1a237e', icon: <LocalShipping /> },
          { label: t('deliveryPage.statsPending'), val: stats.pending, color: '#ed6c02', icon: <AccessTime /> },
          { label: t('deliveryPage.statsDelivered'), val: stats.delivered, color: '#2e7d32', icon: <CheckCircle /> }
        ].map((stat, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e4e8' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: stat.color }}>{stat.icon}</Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{stat.val}</Typography>
                  <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e0e4e8' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" placeholder={t('deliveryPage.searchPlaceholder')} 
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('deliveryPage.filterStatus')}</InputLabel>
              <Select label={t('deliveryPage.filterStatus')} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <MenuItem value="">{t('deliveryPage.filterAllStatus')}</MenuItem>
                {Object.entries(statusConfig).map(([key, { label }]) => (<MenuItem key={key} value={key}>{label}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}><TextField fullWidth size="small" type="date" label={t('deliveryPage.filterStart')} value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} md={2}><TextField fullWidth size="small" type="date" label={t('deliveryPage.filterEnd')} value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} md={2}><Button fullWidth variant="text" onClick={clearFilters} startIcon={<ClearAll />}>{t('deliveryPage.filterReset')}</Button></Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e4e8' }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('deliveryPage.tableOrder')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('deliveryPage.tableStatus')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('deliveryPage.tableCustomer')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('deliveryPage.tableAgent')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('deliveryPage.tableDate')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('deliveryPage.tableAction')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress size={30} /></TableCell></TableRow>
            ) : processedDeliveries.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><Typography color="text.secondary">{t('deliveryPage.tableNoResults')}</Typography></TableCell></TableRow>
            ) : processedDeliveries.map(d => (
              <TableRow key={d.deliveryId} hover onClick={() => handleOpenDrawer(d)} sx={{ cursor: 'pointer' }}>
                <TableCell><b>#{d.invoiceNumber || d.saleId}</b></TableCell>
                <TableCell>
                  <Chip icon={statusConfig[d.deliveryStatus]?.icon} 
                    label={statusConfig[d.deliveryStatus]?.label} 
                    color={statusConfig[d.deliveryStatus]?.color} size="small" variant="contained" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.customerName}</Typography>
                  <Typography variant="caption" color="text.secondary">{d.customerPhone}</Typography>
                </TableCell>
                <TableCell>
                  {d.deliveryPerson ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{d.deliveryPerson.name[0]}</Avatar>
                      <Typography variant="body2">{d.deliveryPerson.name}</Typography>
                    </Box>
                  ) : <Typography variant="caption" color="error">{t('deliveryPage.tableNotAssigned')}</Typography>}
                </TableCell>
                <TableCell>{dayjs(d.updatedAt).format('DD MMM, YYYY')}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" size="small"><Visibility fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer 
        anchor="right" 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        PaperProps={{ sx: { width: { xs: "100vw", sm: 450 }, p: 0, mt: '64px', height: 'calc(100% - 64px)' } }}
      >
        {selectedDelivery && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, bgcolor: '#1a237e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6">{t('deliveryPage.drawerDetailsTitle')}</Typography>
                <Typography variant="caption">{t('deliveryPage.tableOrder')} #{selectedDelivery.invoiceNumber}</Typography>
              </Box>
              <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}><Close /></IconButton>
            </Box>

            <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
              <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="primary" gutterBottom>{t('deliveryPage.drawerCustomerInfo')}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedDelivery.customerName}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{selectedDelivery.deliveryAddress}</Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">{t('deliveryPage.drawerShippingFee')}:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₹{selectedDelivery.deliveryCharge}</Typography>
                  </Stack>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>{t('deliveryPage.drawerFulfillmentStatus')}</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <Select value={updateStatus} onChange={e => setUpdateStatus(e.target.value)} displayEmpty>
                    <MenuItem value="" disabled>{t('deliveryPage.drawerChangeStatus')}</MenuItem>
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <MenuItem key={k} value={k} disabled={!canTransitionTo(k)}>
                        {v.label} {k === selectedDelivery.deliveryStatus ? t('deliveryPage.drawerCurrent') : !canTransitionTo(k) ? t('deliveryPage.drawerRestricted') : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" disabled={!updateStatus || updateStatus === selectedDelivery.deliveryStatus || isSubmitting} onClick={handleUpdateStatus}>
                    {t('deliveryPage.drawerUpdateBtn')}
                </Button>
              </Stack>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>{t('deliveryPage.drawerAgentTitle')}</Typography>
              {!assignMode ? (
                <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    {selectedDelivery.deliveryPerson ? selectedDelivery.deliveryPerson.name : t('deliveryPage.drawerNoAgent')}
                  </Typography>
                  <Button size="small" onClick={() => setAssignMode(true)} disabled={selectedDelivery.deliveryStatus === 'DELIVERED'}>{selectedDelivery.deliveryPerson ? t('deliveryPage.drawerChange') : t('deliveryPage.drawerAssign')}</Button>
                </Box>
              ) : (
                <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                  <Autocomplete 
                    freeSolo 
                    options={deliveryPersons} 
                    getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.name || ""} 
                    onInputChange={(e, v) => setAssignPerson(p => ({ ...p, name: v }))}
                    onChange={(e, v) => {
                        if (typeof v === 'string') {
                            setAssignPerson(p => ({ ...p, name: v, id: null }));
                        } else if (v && v.name) {
                            setAssignPerson(v);
                        }
                    }}
                    renderInput={(params) => <TextField {...params} label={t('deliveryPage.drawerAgentNameLabel')} size="small" placeholder={t('deliveryPage.drawerAgentNamePlaceholder')} />}
                  />
                  <TextField fullWidth size="small" label={t('deliveryPage.drawerPhoneLabel')} sx={{ my: 1 }} value={assignPerson.phone} onChange={e => setAssignPerson(p => ({ ...p, phone: e.target.value }))} />
                  <Stack direction="row" spacing={1}>
                    <Button fullWidth variant="contained" size="small" onClick={handleAssignPerson} disabled={isSubmitting}>
                      {isSubmitting ? <CircularProgress size={20} /> : t('deliveryPage.drawerSaveAssignBtn')}
                    </Button>
                    <Button fullWidth variant="outlined" size="small" onClick={() => setAssignMode(false)}>{t('deliveryPage.drawerCancelBtn')}</Button>
                  </Stack>
                </Box>
              )}

              <Typography variant="subtitle2" sx={{ mt: 4, mb: 1, fontWeight: 'bold' }}>{t('deliveryPage.drawerHistoryTitle')}</Typography>
              <Box sx={{ pl: 2, borderLeft: '2px solid #e0e0e0' }}>
                {selectedDelivery.statusHistory?.slice().reverse().map((h, i) => (
                  <Box key={i} sx={{ position: 'relative', mb: 2, pl: 2 }}>
                    <Box sx={{ position: 'absolute', left: -25, top: 4, width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                    <Typography variant="caption" color="text.secondary">{dayjs(h.changedAt).format('DD MMM, hh:mm A')}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{statusConfig[h.status]?.label}</Typography>
                    <Typography variant="caption">by {h.changedBy}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
              <Button fullWidth variant="contained" startIcon={<Print />} onClick={handlePrint} sx={{ py: 1.5, borderRadius: 2 }}>{t('deliveryPage.drawerPrintFullLabel')}</Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

const Avatar = ({ children, sx }) => (
  <Box sx={{ 
    width: 36, height: 36, borderRadius: '50%', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', ...sx 
  }}>
    {children}
  </Box>
);

export default DeliveryManagement;