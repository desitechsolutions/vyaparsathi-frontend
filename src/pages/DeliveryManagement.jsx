import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button, Drawer, TextField, MenuItem, Select, InputLabel, FormControl,
  Chip, Tooltip, CircularProgress, Snackbar, Alert, Autocomplete, Divider, TableSortLabel, Grid
} from '@mui/material';
import {
  Edit, Visibility, Print, Close, AssignmentInd, Send, FileDownload,
  ClearAll, Inbox
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { CSVLink } from 'react-csv';
import {
  fetchDeliveries,
  updateDeliveryDetails,
  assignDeliveryPerson,
  updateDeliveryStatus,
  fetchDeliveryPersons,
  createDeliveryPerson
} from '../services/api';
import PrintableDelivery  from '../components/PrintableDelivery';
// Adjust path if needed
import dayjs from 'dayjs';

const statusConfig = {
  PENDING: { label: "Pending", color: "default" },
  PACKED: { label: "Packed", color: "warning" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "info" },
  IN_TRANSIT: { label: "In Transit", color: "secondary" },
  DELIVERED: { label: "Delivered", color: "success" },
  CANCELLED: { label: "Cancelled", color: "error" }
};

const DeliveryManagement = () => {
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
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
  const [editMode, setEditMode] = useState(false);
  const [editDelivery, setEditDelivery] = useState(null);
  const [assignMode, setAssignMode] = useState(false);
  const [assignPerson, setAssignPerson] = useState({ name: "", phone: "", notes: "" });
  const [updateStatus, setUpdateStatus] = useState("");

  const printRef = useRef();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [deliveriesRes, personsRes] = await Promise.all([fetchDeliveries(), fetchDeliveryPersons()]);
      setDeliveries(deliveriesRes.data);
      setDeliveryPersons(personsRes.data);
    } catch (error) {
      console.error("Failed to fetch delivery data:", error);
      showSnackbar("Failed to load data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // MOVED: processedDeliveries must be declared before it is used by csvData
  const processedDeliveries = useMemo(() => {
    let filtered = deliveries.filter(d => {
      const matchesStatus = !filterStatus || d.deliveryStatus === filterStatus;
      const matchesSearch = !search ||
        (d.customerName && d.customerName.toLowerCase().includes(search.toLowerCase())) ||
        (d.deliveryAddress && d.deliveryAddress.toLowerCase().includes(search.toLowerCase())) ||
        (d.invoiceNumber && String(d.invoiceNumber).toLowerCase().includes(search.toLowerCase()));

      const deliveryDate = dayjs(d.createdAt);
      const matchesDate = (!dateRange.start || deliveryDate.isAfter(dayjs(dateRange.start).subtract(1, 'day'))) &&
        (!dateRange.end || deliveryDate.isBefore(dayjs(dateRange.end).add(1, 'day')));

      return matchesStatus && matchesSearch && matchesDate;
    });

    if (sortConfig.key !== null) {
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

  // --- Print and Export Setup ---
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const csvHeaders = [
    { label: "Delivery ID", key: "deliveryId" },
    { label: "Order #", key: "invoiceNumber" },
    { label: "Customer Name", key: "customerName" },
    { label: "Delivery Address", key: "deliveryAddress" },
    { label: "Status", key: "deliveryStatus" },
    { label: "Delivery Person", key: "deliveryPersonName" },
    { label: "Delivery Person Phone", key: "deliveryPersonPhone" },
    { label: "Delivery Charge", key: "deliveryCharge" },
    { label: "Charge Paid By", key: "deliveryPaidBy" },
    { label: "Created At", key: "createdAt" },
    { label: "Updated At", key: "updatedAt" },
  ];

  const csvData = useMemo(() => {
    return processedDeliveries.map(d => ({
      ...d,
      deliveryStatus: statusConfig[d.deliveryStatus]?.label || d.deliveryStatus,
      deliveryPersonName: d.deliveryPerson?.name || 'N/A',
      deliveryPersonPhone: d.deliveryPerson?.phone || 'N/A',
      createdAt: dayjs(d.createdAt).format('YYYY-MM-DD HH:mm'),
      updatedAt: dayjs(d.updatedAt).format('YYYY-MM-DD HH:mm'),
    }));
  }, [processedDeliveries]);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("");
    setDateRange({ start: '', end: '' });
  };

  const handleOpenDrawer = (d) => {
    setSelectedDelivery(d);
    setEditDelivery(d);
    setDrawerOpen(true);
    setEditMode(false);
    setAssignMode(false);
    setUpdateStatus("");
    setAssignPerson({ name: "", phone: "", notes: "" });
  };

  const handleCloseDrawer = () => setDrawerOpen(false);

  const handleAssignPerson = async () => {
    if (!assignPerson.name || !assignPerson.phone) {
      showSnackbar("Person's name and phone are required.", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      let personToAssign = assignPerson;
      if (!personToAssign.id) {
        const newPersonRes = await createDeliveryPerson(personToAssign);
        personToAssign = newPersonRes.data;
      }
      await assignDeliveryPerson(selectedDelivery.deliveryId, personToAssign);
      showSnackbar("Delivery person assigned successfully.", "success");
      setAssignMode(false);
      loadData();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to assign person.";
      showSnackbar(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!updateStatus) return;
    setIsSubmitting(true);
    try {
      await updateDeliveryStatus(selectedDelivery.deliveryId, updateStatus, "Admin");
      showSnackbar("Delivery status updated successfully.", "success");
      setUpdateStatus("");
      loadData();
    } catch (error) {
      showSnackbar("Failed to update status.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDelivery = async () => {
    setIsSubmitting(true);
    try {
      await updateDeliveryDetails(selectedDelivery.deliveryId, editDelivery);
      showSnackbar("Delivery details updated successfully.", "success");
      setEditMode(false);
      loadData();
    } catch (error) {
      showSnackbar("Failed to save changes.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableHeaders = [
    { id: 'invoiceNumber', label: 'Order #' },
    { id: 'deliveryStatus', label: 'Status' },
    { id: 'customerName', label: 'Customer' },
    { id: 'deliveryAddress', label: 'Address', sortable: false },
    { id: 'deliveryPerson.name', label: 'Delivery Person' },
    { id: 'updatedAt', label: 'Updated' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Hidden component for printing */}
      <Box sx={{ display: 'none' }}>
        <PrintableDelivery ref={printRef} delivery={selectedDelivery} />
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold' }}>Delivery Management</Typography>
        <CSVLink
          data={csvData}
          headers={csvHeaders}
          filename={`vyaparsathi-deliveries-${dayjs().format('YYYY-MM-DD')}.csv`}
          style={{ textDecoration: 'none' }}
        >
          <Button variant="outlined" startIcon={<FileDownload />} sx={{ mr: 1 }}>
            Export
          </Button>
        </CSVLink>
        <Button variant="outlined" startIcon={<Print />} onClick={handlePrint} disabled={!selectedDelivery}>
          Print Selected
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Search by Customer, Address, Order #" value={search} onChange={e => setSearch(e.target.value)} /></Grid>
          <Grid item xs={6} sm={2}><FormControl fullWidth size="small"><InputLabel>Status</InputLabel><Select label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><MenuItem value="">All</MenuItem>{Object.entries(statusConfig).map(([key, { label }]) => (<MenuItem key={key} value={key}>{label}</MenuItem>))}</Select></FormControl></Grid>
          <Grid item xs={6} sm={2}><TextField fullWidth size="small" type="date" label="Start Date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} sm={2}><TextField fullWidth size="small" type="date" label="End Date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} sm={2}><Button fullWidth variant="outlined" color="secondary" onClick={clearFilters} startIcon={<ClearAll />}>Clear</Button></Grid>
        </Grid>
      </Paper>

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {tableHeaders.map(header => (
                  <TableCell key={header.id} sortDirection={sortConfig.key === header.id ? sortConfig.direction : false}>
                    {header.sortable !== false ? (
                      <TableSortLabel active={sortConfig.key === header.id} direction={sortConfig.key === header.id ? sortConfig.direction : 'asc'} onClick={() => requestSort(header.id)}>
                        {header.label}
                      </TableSortLabel>
                    ) : header.label}
                  </TableCell>
                ))}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} align="center"><CircularProgress /></TableCell></TableRow>
              ) : processedDeliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <Inbox sx={{ fontSize: 48 }} />
                      <Typography variant="h6">No Deliveries Found</Typography>
                      <Typography>Try adjusting your filters or search term.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                processedDeliveries.map(d => (
                  <TableRow key={d.deliveryId} hover selected={selectedDelivery?.deliveryId === d.deliveryId} onClick={() => setSelectedDelivery(d)}>
                    <TableCell>{d.invoiceNumber || d.saleId}</TableCell>
                    <TableCell><Chip label={statusConfig[d.deliveryStatus]?.label || d.deliveryStatus} color={statusConfig[d.deliveryStatus]?.color || "default"} size="small" /></TableCell>
                    <TableCell><Tooltip title={d.customerPhone || ''}><span>{d.customerName || 'N/A'}</span></Tooltip></TableCell>
                    <TableCell><Tooltip title={d.deliveryAddress}><span>{d.deliveryAddress?.substring(0, 20) || ''}{d.deliveryAddress?.length > 20 ? '...' : ''}</span></Tooltip></TableCell>
                    <TableCell>{d.deliveryPerson ? (<Tooltip title={d.deliveryPerson.phone}><span>{d.deliveryPerson.name}</span></Tooltip>) : <Chip label="Not Assigned" size="small" variant="outlined" />}</TableCell>
                    <TableCell>{dayjs(d.updatedAt).format('DD MMM YYYY')}</TableCell>
                    <TableCell align="center"><IconButton onClick={() => handleOpenDrawer(d)} color="primary"><Visibility /></IconButton></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Drawer anchor="right" open={drawerOpen} onClose={handleCloseDrawer} PaperProps={{ sx: { width: { xs: "100vw", sm: 500 } } }}>
        {selectedDelivery && (
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: '100%' }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>Delivery #{selectedDelivery.invoiceNumber}</Typography>
              <IconButton onClick={handleCloseDrawer}><Close /></IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2"><b>Customer:</b> {selectedDelivery.customerName || 'N/A'}</Typography>
            <Typography variant="body2"><b>Address:</b> {selectedDelivery.deliveryAddress}</Typography>
            <Typography variant="body2"><b>Charge:</b> ₹{selectedDelivery.deliveryCharge || 0} (Paid by {selectedDelivery.deliveryPaidBy})</Typography>
            {selectedDelivery.deliveryNotes && <Typography variant="body2"><b>Notes:</b> {selectedDelivery.deliveryNotes}</Typography>}
            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Delivery Person</Typography>
            {selectedDelivery.deliveryPerson && !assignMode ? (
              <Box sx={{ my: 1 }}>
                <Typography><b>Name:</b> {selectedDelivery.deliveryPerson.name}</Typography>
                <Typography><b>Phone:</b> {selectedDelivery.deliveryPerson.phone}</Typography>
                <Button size="small" startIcon={<Edit />} sx={{ mt: 1 }} onClick={() => { setAssignMode(true); setAssignPerson(selectedDelivery.deliveryPerson); }}>Change</Button>
              </Box>
            ) : (
              <Box sx={{ my: 1 }}>
                {!selectedDelivery.deliveryPerson && !assignMode && <Button variant="outlined" size="small" startIcon={<AssignmentInd />} onClick={() => { setAssignMode(true); setAssignPerson({ name: "", phone: "", notes: "" }); }}>Assign</Button>}
                {assignMode && (
                  <Box sx={{ mt: 1, mb: 2, p: 2, border: "1px solid #ddd", borderRadius: 1 }}>
                    <Autocomplete freeSolo options={deliveryPersons} getOptionLabel={(option) => option.name || ""} value={deliveryPersons.find(p => p.id === assignPerson.id) || null}
                      onChange={(e, val) => val && setAssignPerson(val)}
                      inputValue={assignPerson.name} onInputChange={(e, val) => setAssignPerson(p => ({ ...p, name: val, id: undefined }))}
                      renderInput={(params) => <TextField {...params} label="Select or Add Person Name" sx={{ mb: 1 }} />}
                    />
                    <TextField label="Phone" value={assignPerson.phone} fullWidth sx={{ mb: 1 }} onChange={e => setAssignPerson(a => ({ ...a, phone: e.target.value }))} />
                    <TextField label="Notes" value={assignPerson.notes} fullWidth sx={{ mb: 2 }} onChange={e => setAssignPerson(a => ({ ...a, notes: e.target.value }))} />
                    <Button variant="contained" size="small" startIcon={<Send />} onClick={handleAssignPerson} disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={20} /> : 'Save'}</Button>
                    <Button sx={{ ml: 1 }} size="small" onClick={() => setAssignMode(false)}>Cancel</Button>
                  </Box>
                )}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Update Status</Typography>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>New Status</InputLabel>
              <Select label="New Status" value={updateStatus} onChange={e => setUpdateStatus(e.target.value)}>
                {Object.entries(statusConfig).map(([key, { label }]) => (<MenuItem key={key} value={key}>{label}</MenuItem>))}
              </Select>
            </FormControl>
            <Button variant="contained" sx={{ mt: 1 }} onClick={handleUpdateStatus} disabled={isSubmitting || !updateStatus}>{isSubmitting ? <CircularProgress size={20} /> : 'Update'}</Button>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Status History</Typography>
            <Box sx={{
              p: 1.5,
              my: 1,
              maxHeight: 200,
              overflowY: 'auto',
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              {selectedDelivery.statusHistory?.map((h, idx) => (
                <Typography key={idx} variant="body2"><b>{statusConfig[h.status]?.label || h.status}</b> - {dayjs(h.changedAt).format('DD/MM/YY hh:mm A')} by {h.changedBy}</Typography>
              ))}
            </Box>

            <Box sx={{ flexGrow: 1 }} />
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {editMode ? (
                <Box>
                  <Button variant="contained" size="small" onClick={handleEditDelivery} disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={20} /> : 'Save'}</Button>
                  <Button sx={{ ml: 1 }} size="small" onClick={() => setEditMode(false)}>Cancel</Button>
                </Box>
              ) : (
                <Button variant="outlined" startIcon={<Edit />} size="small" onClick={() => { setEditMode(true); setEditDelivery(selectedDelivery); }}>Edit Details</Button>
              )}
              <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>Print Slip</Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default DeliveryManagement;