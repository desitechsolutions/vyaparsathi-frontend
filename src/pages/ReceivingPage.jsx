import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box, Typography, Paper, Button, CircularProgress, TextField, FormControl,
    InputLabel, Select, MenuItem, Snackbar, Alert, Dialog, DialogTitle,
    DialogContent, DialogActions, Fab, Grid, Divider, Chip, Card, CardContent, Tooltip
} from '@mui/material';
import {
    getPurchaseOrders, fetchShop, initiateReceivingFromPO, fetchReceiving, updateReceiving, createReceivingTicket, addAttachmentToTicket,
    deleteReceiving, fetchReceivingByPoId, fetchReceivingTicketById
} from '../services/api';
import AddIcon from '@mui/icons-material/Add';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import SaveIcon from '@mui/icons-material/Save';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

// Minimal helper for current user
const getCurrentUser = () => ({ username: 'current-user' });

// Aggregate previous receivings for given po items (returns map keyed by purchaseOrderItemId)
const aggregateReceivingsForPO = (receivings = [], poItems = []) => {
    const agg = {};
    (poItems || []).forEach(it => {
        agg[it.id] = { receivedQty: 0, damagedQty: 0, rejectedQty: 0, orderedQty: it.quantity || 0 };
    });
    (receivings || []).forEach(rec => {
        (rec.receivingItems || []).forEach(ri => {
            if (!agg[ri.purchaseOrderItemId]) {
                agg[ri.purchaseOrderItemId] = { receivedQty: 0, damagedQty: 0, rejectedQty: 0, orderedQty: 0 };
            }
            agg[ri.purchaseOrderItemId].receivedQty += Number(ri.receivedQty || 0);
            agg[ri.purchaseOrderItemId].damagedQty += Number(ri.damagedQty || 0);
            agg[ri.purchaseOrderItemId].rejectedQty += Number(ri.rejectedQty || 0);
        });
    });
    return agg;
};

// ---------- CreateReceivingDialog (unchanged minimal) ----------
function CreateReceivingDialog({ open, onClose, purchaseOrders, shops, onCreate }) {
    const [form, setForm] = useState({
        purchaseOrderId: '',
        shopId: '',
        receivedBy: getCurrentUser().username,
        notes: '',
        receivedAt: dayjs(),
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            setForm({
                purchaseOrderId: '',
                shopId: '',
                receivedBy: getCurrentUser().username,
                notes: '',
                receivedAt: dayjs(),
            });
            setValidationErrors({});
        }
    }, [open]);

    const validateForm = () => {
        const errors = {};
        if (!form.purchaseOrderId) errors.purchaseOrderId = 'Purchase Order is required';
        if (!form.shopId) errors.shopId = 'Shop is required';
        if (!form.receivedBy.trim()) errors.receivedBy = 'Received By is required';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setSnackbar({ open: true, message: 'Please fix validation errors', severity: 'error' });
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await initiateReceivingFromPO({ purchaseOrderId: form.purchaseOrderId });
            if (response && response.id) {
                onCreate({ ...response, shopId: form.shopId, receivedBy: form.receivedBy, notes: form.notes });
            } else {
                const byPo = await fetchReceivingByPoId(form.purchaseOrderId);
                const created = Array.isArray(byPo) ? byPo[0] : byPo;
                if (!created?.id) throw new Error('Receiving creation failed (no id returned)');
                onCreate({ ...created, shopId: form.shopId, receivedBy: form.receivedBy, notes: form.notes });
            }
            setSnackbar({ open: true, message: 'Receiving created successfully!', severity: 'success' });
            onClose();
        } catch (err) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create receiving record.';
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Create New Receiving</DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="dense" error={!!validationErrors.purchaseOrderId}>
                    <InputLabel>Purchase Order</InputLabel>
                    <Select value={form.purchaseOrderId} onChange={e => setForm({ ...form, purchaseOrderId: e.target.value })} label="Purchase Order">
                        {purchaseOrders.map(po => <MenuItem key={po.id} value={po.id}>{po.poNumber}</MenuItem>)}
                    </Select>
                    {validationErrors.purchaseOrderId && <Typography color="error">{validationErrors.purchaseOrderId}</Typography>}
                </FormControl>
                <FormControl fullWidth margin="dense" error={!!validationErrors.shopId}>
                    <InputLabel>Shop</InputLabel>
                    <Select value={form.shopId} onChange={e => setForm({ ...form, shopId: e.target.value })} label="Shop">
                        {shops.map(shop => <MenuItem key={shop.id} value={shop.id}>{shop.name}</MenuItem>)}
                    </Select>
                    {validationErrors.shopId && <Typography color="error">{validationErrors.shopId}</Typography>}
                </FormControl>
                <TextField label="Received By" fullWidth margin="dense" value={form.receivedBy} onChange={e => setForm({ ...form, receivedBy: e.target.value })} error={!!validationErrors.receivedBy} helperText={validationErrors.receivedBy || 'Enter the name of the person receiving the items'} />
                <TextField label="Notes" fullWidth margin="dense" multiline rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                <DatePicker label="Received At" value={form.receivedAt} onChange={value => setForm({ ...form, receivedAt: value })} sx={{ mt: 2, width: '100%' }} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} color="primary" variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={20} /> : 'Create'}</Button>
            </DialogActions>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Dialog>
    );
}

// ---------- DetailsDialog (clean two-state model) ----------
function DetailsDialog({ open, onClose, row, getPOItemById, onReceivingUpdate }) {
    // editable items for only this receiving (edit state)
    const [editItems, setEditItems] = useState([]); // each: { id, purchaseOrderItemId, expectedQty, editReceivedQty, editDamagedQty, editRejectedQty, editPutawayQty, ... }
    // cumulative from previous receivings (readonly)
    const [cumulativePrev, setCumulativePrev] = useState({}); // map purchaseOrderItemId -> { receivedQty, damagedQty, rejectedQty, orderedQty }
    const [receivedBy, setReceivedBy] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [errors, setErrors] = useState({}); // keyed by index

    useEffect(() => {
        if (!open || !row) return;
        let mounted = true;

        const prepare = async () => {
            // Build editItems from row.receivingItems but use separate "edit..." fields
            const items = (row.receivingItems || []).filter(Boolean).map(i => ({
                id: i.id,
                purchaseOrderItemId: i.purchaseOrderItemId,
                expectedQty: Number(i.expectedQty || 0),
                editReceivedQty: Number(i.receivedQty || 0),
                editDamagedQty: Number(i.damagedQty || 0),
                editRejectedQty: Number(i.rejectedQty || 0),
                editPutawayQty: Number(i.putawayQty || 0),
                putAwayStatus: i.putAwayStatus || 'PENDING',
                status: i.status || 'PENDING',
                notes: i.notes || '',
                damageReason: i.damageReason || '',
                rejectReason: i.rejectReason || '',
                batchNumber: i.batchNumber || '',
                manufacturingDate: i.manufacturingDate || '',
                expiryDate: i.expiryDate || '',
            }));

            // Fetch previous receivings for this PO, exclude current receiving
            let allReceivings = [];
            try {
                const resp = await fetchReceivingByPoId(row.purchaseOrderId);
                if (Array.isArray(resp)) allReceivings = resp;
                else if (resp && resp.receivingItems) allReceivings = [resp];
                else if (resp && resp.content) allReceivings = resp.content;
            } catch (e) {
                console.warn('fetchReceivingByPoId failed', e);
            }
            const prevReceivings = (allReceivings || []).filter(r => r && r.id && r.id !== row.id);

            // Build PO items metadata from getPOItemById where possible, else fallback to expectedQty
            const poItems = [];
            for (const it of items) {
                const meta = getPOItemById ? getPOItemById(row.purchaseOrderId, it.purchaseOrderItemId) : null;
                poItems.push({
                    id: it.purchaseOrderItemId,
                    quantity: (meta && meta.quantity) ? meta.quantity : it.expectedQty
                });
            }

            const aggPrev = aggregateReceivingsForPO(prevReceivings, poItems);

            if (!mounted) return;
            setEditItems(items);
            setCumulativePrev(aggPrev);
            setReceivedBy(row.receivedBy || getCurrentUser().username);
            setErrors({});
        };

        prepare();
        return () => { mounted = false; };
    }, [open, row, getPOItemById]);

    // remaining before editing = ordered - (prev.received + prev.damaged + prev.rejected)
    const remainingBefore = (purchaseOrderItemId, expectedQty) => {
        const prev = cumulativePrev[purchaseOrderItemId] || { receivedQty: 0, damagedQty: 0, rejectedQty: 0, orderedQty: expectedQty || 0 };
        const ordered = prev.orderedQty || expectedQty || 0;
        const already = (prev.receivedQty || 0) + (prev.damagedQty || 0) + (prev.rejectedQty || 0);
        return Math.max(0, ordered - already);
    };

    const validateSingle = (item) => {
        const rem = remainingBefore(item.purchaseOrderItemId, item.expectedQty);
        const errs = {};
        const totalEdit = Number(item.editReceivedQty || 0) + Number(item.editDamagedQty || 0) + Number(item.editRejectedQty || 0);
        if (totalEdit > rem) errs.total = `Sum exceeds remaining (${rem})`;
        if (Number(item.editPutawayQty || 0) > Number(item.editReceivedQty || 0)) errs.putaway = 'Putaway cannot exceed received';
        if (item.status === 'RECEIVED') errs.locked = 'Item already fully received';
        return errs;
    };

    const handleEditChange = (index, field, value) => {
        setEditItems(prev => {
            const arr = prev.map(it => ({ ...it }));
            const it = arr[index];
            if (!it) return prev;
            // do not mutate cumulativePrev
            if (['editReceivedQty', 'editDamagedQty', 'editRejectedQty', 'editPutawayQty'].includes(field)) {
                const parsed = Number(value);
                it[field] = Number.isNaN(parsed) ? 0 : Math.max(0, Math.trunc(parsed));
            } else {
                it[field] = value;
            }
            // validate this item immediately
            const itemErrors = validateSingle(it);
            setErrors(prevErr => ({ ...prevErr, [index]: itemErrors }));
            // update derived statuses locally (purely UI)
            const total = (it.editReceivedQty || 0) + (it.editDamagedQty || 0) + (it.editRejectedQty || 0);
            it.status = total === 0 ? 'PENDING' : (total < it.expectedQty ? 'PARTIALLY_RECEIVED' : 'RECEIVED');
            it.putAwayStatus = (it.editPutawayQty || 0) === 0 ? 'PENDING' : ((it.editPutawayQty || 0) < (it.editReceivedQty || 0) ? 'PARTIAL' : 'COMPLETED');
            return arr;
        });
    };

    const anyErrors = useMemo(() => Object.values(errors).some(e => e && Object.keys(e).length > 0), [errors]);

    const handleSave = async () => {
        if (!receivedBy || !receivedBy.trim()) {
            setErrors(prev => ({ ...prev, receivedBy: 'Received By is required' }));
            setSnackbar({ open: true, message: 'Received By is required', severity: 'error' });
            return;
        }
        if (anyErrors) {
            setSnackbar({ open: true, message: 'Fix errors before saving', severity: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            // Map editItems back to server shape (receivedQty etc)
            const payload = {
                ...row,
                receivedBy,
                notes: row.notes || '',
                receivingItems: editItems.map(it => ({
                    id: it.id,
                    purchaseOrderItemId: it.purchaseOrderItemId,
                    expectedQty: it.expectedQty,
                    receivedQty: it.editReceivedQty || 0,
                    damagedQty: it.editDamagedQty || 0,
                    rejectedQty: it.editRejectedQty || 0,
                    putawayQty: it.editPutawayQty || 0,
                    status: it.status,
                    putAwayStatus: it.putAwayStatus,
                    notes: it.notes,
                    damageReason: it.damageReason || null,
                    rejectReason: it.rejectReason || null,
                    batchNumber: it.batchNumber || null,
                    manufacturingDate: it.manufacturingDate || null,
                    expiryDate: it.expiryDate || null,
                }))
            };
            const updated = await updateReceiving(row.id, payload);
            const result = updated?.data || updated;
            if (!result?.id) throw new Error('Invalid update response');
            onReceivingUpdate(result);
            setSnackbar({ open: true, message: 'Saved successfully', severity: 'success' });
            onClose();
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || 'Save failed';
            setSnackbar({ open: true, message: msg, severity: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!row) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>Receiving Details</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>Supplier Details</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <BusinessIcon color="action" sx={{ mr: 1.5 }} />
                            <Typography variant="body1" fontWeight="bold">{row.supplier?.name || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <PersonIcon color="action" sx={{ mr: 1.5 }} />
                            <Typography variant="body2">{row.supplier?.contactPerson || 'N/A'}</Typography>
                        </Box>
                        <TextField label="Received By" fullWidth margin="dense" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} error={!!errors.receivedBy} helperText={errors.receivedBy || ''} />
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">Item Processing</Typography>
                            <Button variant="contained" color="success" onClick={handleSave} disabled={isSaving || anyErrors} startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}>Save Changes</Button>
                        </Box>

                        <Box sx={{ my: 2 }}>
                            <Typography variant="subtitle2">Aggregated previous receipts (excluding this receiving)</Typography>
                            {(Object.keys(cumulativePrev).length === 0) && <Typography variant="body2" color="text.secondary">No previous receipts.</Typography>}
                            {Object.entries(cumulativePrev).map(([poItemId, ag]) => (
                                <Box key={poItemId} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                                    <Chip label={`Item ${poItemId}`} size="small" />
                                    <Chip label={`Received ${ag.receivedQty}`} size="small" color="success" />
                                    <Chip label={`Damaged ${ag.damagedQty}`} size="small" color="error" />
                                    <Chip label={`Rejected ${ag.rejectedQty}`} size="small" color="warning" />
                                </Box>
                            ))}
                        </Box>

                        {editItems.map((item, idx) => {
                            const meta = getPOItemById ? getPOItemById(row.purchaseOrderId, item.purchaseOrderItemId) : null;
                            const ordered = (meta && meta.quantity) ? meta.quantity : item.expectedQty;
                            const remBefore = remainingBefore(item.purchaseOrderItemId, item.expectedQty);
                            const totalEdit = (item.editReceivedQty || 0) + (item.editDamagedQty || 0) + (item.editRejectedQty || 0);
                            const itemErr = errors[idx] || {};

                            return (
                                <Paper key={item.id || `${item.purchaseOrderItemId}-${idx}`} sx={{ p: 2, mb: 2, borderLeft: 5, borderColor: item.status === 'RECEIVED' ? 'success.main' : 'primary.main' }}>
                                    <Typography variant="subtitle1" fontWeight="bold">{meta?.name || 'Item'}</Typography>
                                    <Typography variant="body2" color="text.secondary">SKU: {meta?.sku || 'N/A'} | Ordered: {ordered}</Typography>

                                    <Box sx={{ mt: 1, mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Backend cumulative — Received: <strong>{(cumulativePrev[item.purchaseOrderItemId]?.receivedQty || 0)}</strong>, Damaged: <strong>{(cumulativePrev[item.purchaseOrderItemId]?.damagedQty || 0)}</strong>, Rejected: <strong>{(cumulativePrev[item.purchaseOrderItemId]?.rejectedQty || 0)}</strong></Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                        <Typography variant="body2" color="success.main">Received Qty (this edit): <strong>{item.editReceivedQty}</strong></Typography>
                                        <Typography variant="body2" color="error.main">Damaged Qty (this edit): <strong>{item.editDamagedQty}</strong></Typography>
                                        <Typography variant="body2" color={remBefore - totalEdit > 0 ? 'warning.main' : 'success.main'}>Remaining after this edit: <strong>{Math.max(0, remBefore - totalEdit)}</strong></Typography>
                                    </Box>

                                    <Divider sx={{ my: 1 }} />

                                    <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                            <TextField size="small" label="Received Qty" type="number" value={String(item.editReceivedQty ?? 0)} onChange={e => handleEditChange(idx, 'editReceivedQty', e.target.value)} fullWidth inputProps={{ min: 0, max: remBefore }} error={!!itemErr.total} helperText={itemErr.total || ''} disabled={item.status === 'RECEIVED'} />
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField size="small" label="Damaged Qty" type="number" value={String(item.editDamagedQty ?? 0)} onChange={e => handleEditChange(idx, 'editDamagedQty', e.target.value)} fullWidth inputProps={{ min: 0, max: remBefore }} error={!!itemErr.total} helperText={itemErr.total || ''} disabled={item.status === 'RECEIVED'} />
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField size="small" label="Rejected Qty" type="number" value={String(item.editRejectedQty ?? 0)} onChange={e => handleEditChange(idx, 'editRejectedQty', e.target.value)} fullWidth inputProps={{ min: 0, max: remBefore }} error={!!itemErr.total} helperText={itemErr.total || ''} disabled={item.status === 'RECEIVED'} />
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ mt: 2 }}>
                                        <TextField size="small" label="Putaway Qty" type="number" value={String(item.editPutawayQty ?? 0)} onChange={e => handleEditChange(idx, 'editPutawayQty', e.target.value)} fullWidth inputProps={{ min: 0, max: item.editReceivedQty ?? 0 }} error={!!itemErr.putaway} helperText={itemErr.putaway || ''} disabled={item.editReceivedQty === 0 || item.status === 'RECEIVED'} />
                                    </Box>

                                    <Box sx={{ mt: 2 }}>
                                        <TextField size="small" label="Notes" value={item.notes} onChange={e => handleEditChange(idx, 'notes', e.target.value)} fullWidth />
                                    </Box>

                                    {/* Pharmacy batch fields */}
                                    <Grid container spacing={1} sx={{ mt: 1 }}>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                size="small"
                                                label="Batch Number"
                                                value={item.batchNumber || ''}
                                                onChange={e => handleEditChange(idx, 'batchNumber', e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                size="small"
                                                label="Mfg. Date"
                                                type="date"
                                                value={item.manufacturingDate || ''}
                                                onChange={e => handleEditChange(idx, 'manufacturingDate', e.target.value)}
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                size="small"
                                                label="Expiry Date"
                                                type="date"
                                                value={item.expiryDate || ''}
                                                onChange={e => handleEditChange(idx, 'expiryDate', e.target.value)}
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            );
                        })}
                    </Grid>
                </Grid>

                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
                </Snackbar>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

// ---------- ReceivingTicketDialog (unchanged) ----------
function ReceivingTicketDialog({ open, onClose, receivingId, onTicketCreate }) {
    const [ticketForm, setTicketForm] = useState({ reason: '', description: '', raisedBy: getCurrentUser().username });
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (!open) {
            setTicketForm({ reason: '', description: '', raisedBy: getCurrentUser().username });
            setFile(null);
            setValidationErrors({});
        }
    }, [open]);

    const validateForm = () => {
        const errors = {};
        if (!ticketForm.reason.trim()) errors.reason = 'Reason is required';
        if (!ticketForm.description.trim()) errors.description = 'Description is required';
        if (!ticketForm.raisedBy.trim()) errors.raisedBy = 'Raised By is required';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setSnackbar({ open: true, message: 'Please fix validation errors', severity: 'error' });
            return;
        }
        setIsSubmitting(true);
        try {
            const ticketData = { receivingId, ...ticketForm };
            const createdTicket = await createReceivingTicket(ticketData);
            if (file) await addAttachmentToTicket(createdTicket.id, file);
            onTicketCreate(createdTicket);
            setSnackbar({ open: true, message: 'Ticket created successfully!', severity: 'success' });
            onClose();
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to create ticket: ' + (err?.message || ''), severity: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Create Receiving Ticket</DialogTitle>
            <DialogContent>
                <TextField label="Reason" fullWidth margin="dense" value={ticketForm.reason} onChange={e => setTicketForm({ ...ticketForm, reason: e.target.value })} error={!!validationErrors.reason} helperText={validationErrors.reason} />
                <TextField label="Description" fullWidth margin="dense" multiline rows={4} value={ticketForm.description} onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} error={!!validationErrors.description} helperText={validationErrors.description} />
                <TextField label="Raised By" fullWidth margin="dense" value={ticketForm.raisedBy} onChange={e => setTicketForm({ ...ticketForm, raisedBy: e.target.value })} error={!!validationErrors.raisedBy} helperText={validationErrors.raisedBy || 'Enter the name of the person raising the ticket'} />
                <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" component="label" startIcon={<AttachFileIcon />}>Upload Attachment<input type="file" hidden onChange={e => setFile(e.target.files[0])} /></Button>
                    {file && <Typography variant="body2" sx={{ mt: 1 }}>{file.name}</Typography>}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} color="primary" variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={20} /> : 'Create Ticket'}</Button>
            </DialogActions>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Dialog>
    );
}

// ---------- Main ReceivingPage (kept simple) ----------
const ReceivingPage = () => {
    const { t } = useTranslation();
    const { poId } = useParams();
    const navigate = useNavigate();
    const [receivings, setReceivings] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [openReceivingDialog, setOpenReceivingDialog] = useState(false);
    const [openReceivingTicketDialog, setOpenReceivingTicketDialog] = useState(false);
    const [receivingTicketForm, setReceivingTicketForm] = useState({ receivingId: '', reason: '', description: '', raisedBy: getCurrentUser().username });
    const [detailsDialog, setDetailsDialog] = useState({ open: false, row: null });
    const [fromDate, setFromDate] = useState(dayjs().subtract(7, 'day'));
    const [toDate, setToDate] = useState(dayjs());

    const getPOById = useCallback((id) => Array.isArray(purchaseOrders) ? purchaseOrders.find(po => po.id === id) || null : null, [purchaseOrders]);
    const getPOItemById = useCallback((poId, itemId) => {
        const po = getPOById(poId);
        if (!itemId) return po ? { poNumber: po.poNumber, poItems: po.items } : null;
        return po?.items?.find(item => item.id === itemId) || null;
    }, [getPOById]);
    const getShopById = useCallback((id) => Array.isArray(shops) && shops.length > 0 ? shops.find(shop => shop.id === id) || null : null, [shops]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [poData, shopResp, receivingData] = await Promise.all([getPurchaseOrders(), fetchShop(), fetchReceiving()]);
                setPurchaseOrders(Array.isArray(poData) ? poData : []);
                setShops(shopResp?.data ? (Array.isArray(shopResp.data) ? shopResp.data : [shopResp.data]) : []);
                let recs = [];
                if (Array.isArray(receivingData)) recs = receivingData;
                else if (Array.isArray(receivingData?.content)) recs = receivingData.content;
                else if (Array.isArray(receivingData?.data)) recs = receivingData.data;
                setReceivings(recs.filter(r => r?.id));
            } catch (e) {
                console.error(e);
                setError(t('receivingPage.errorFetch'));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleReceivingUpdate = useCallback((updated) => {
        if (!updated?.id) return setSnackbar({ open: true, message: 'Invalid update', severity: 'error' });
        setReceivings(prev => {
            const arr = Array.isArray(prev) ? prev.filter(r => r?.id) : [];
            const found = arr.find(r => r.id === updated.id);
            return found ? arr.map(r => r.id === updated.id ? updated : r) : [...arr, updated];
        });
    }, []);

    const handleCreateReceiving = useCallback((newRec) => {
        if (!newRec?.id) return setSnackbar({ open: true, message: t('receivingPage.errorSave'), severity: 'error' });
        setReceivings(prev => [...(Array.isArray(prev) ? prev : []), newRec]);
        setOpenReceivingDialog(false);
    }, []);

    const handleDeleteReceiving = async (id, status) => {
        if (status === 'COMPLETED' || status === 'PARTIALLY_RECEIVED') {
            setSnackbar({ open: true, message: 'Cannot delete received record', severity: 'warning' });
            return;
        }
        if (!window.confirm('Delete this receiving?')) return;
        try {
            await deleteReceiving(id);
            setReceivings(prev => prev.filter(r => r.id !== id));
            setSnackbar({ open: true, message: t('receivingPage.successSave'), severity: 'success' });
        } catch (e) {
            setSnackbar({ open: true, message: t('receivingPage.errorSave'), severity: 'error' });
        }
    };

    const columns = useMemo(() => [
        { field: 'purchaseOrderId', headerName: 'PO Number', flex: 1, valueGetter: params => getPOById(params.row.purchaseOrderId)?.poNumber || 'N/A' },
        { field: 'supplier', headerName: 'Supplier', flex: 1.5, valueGetter: params => params.row.supplier?.name || 'N/A' },
        { field: 'shopId', headerName: 'Shop', flex: 1, valueGetter: params => getShopById(params.row.shopId)?.name || 'N/A' },
        {
            field: 'status', headerName: 'Status', flex: 1,
            renderCell: params => {
                const status = params.value === 'COMPLETED' ? 'RECEIVED' : params.value;
                return <Chip label={status} size="small" variant="outlined" color={status === 'PENDING' ? 'primary' : status === 'PARTIALLY_RECEIVED' ? 'warning' : status === 'RECEIVED' ? 'success' : 'default'} />;
            }
        },
        { field: 'receivedBy', headerName: 'Received By', flex: 1, valueGetter: params => params.value || 'N/A' },
        {
            field: 'actions', type: 'actions', width: 150, getActions: (params) => [
                <GridActionsCellItem icon={<Tooltip title="View/Edit"><BusinessIcon /></Tooltip>} label="View" onClick={() => setDetailsDialog({ open: true, row: params.row })} />,
                <GridActionsCellItem icon={<Tooltip title="Raise Ticket"><ReportProblemIcon /></Tooltip>} label="Ticket" onClick={() => { setReceivingTicketForm({ ...receivingTicketForm, receivingId: params.id }); setOpenReceivingTicketDialog(true); }} />,
                <GridActionsCellItem icon={<Tooltip title="Delete"><DeleteIcon /></Tooltip>} label="Delete" onClick={() => handleDeleteReceiving(params.id, params.row.status)} disabled={params.row.status === 'COMPLETED' || params.row.status === 'PARTIALLY_RECEIVED'} sx={{ color: params.row.status === 'COMPLETED' || params.row.status === 'PARTIALLY_RECEIVED' ? 'grey.500' : 'error.main' }} />
            ]
        }
    ], [getPOById, getShopById, receivingTicketForm, handleDeleteReceiving]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">{t('receivingPage.title')}</Typography>
                    <Tooltip title="Create a new receiving record"><Fab color="primary" onClick={() => setOpenReceivingDialog(true)}><AddIcon /></Fab></Tooltip>
                </Box>

                <Card sx={{ mb: 3 }}>
                    <Paper sx={{ height: '60vh' }}>
                        <DataGrid rows={receivings} columns={columns} loading={loading} getRowId={row => row.id} pageSizeOptions={[10]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} />
                    </Paper>
                </Card>

                <DetailsDialog open={detailsDialog.open} row={detailsDialog.row} onClose={() => setDetailsDialog({ open: false, row: null })} getPOItemById={getPOItemById} onReceivingUpdate={handleReceivingUpdate} />
                <CreateReceivingDialog open={openReceivingDialog} onClose={() => setOpenReceivingDialog(false)} purchaseOrders={purchaseOrders} shops={shops} onCreate={handleCreateReceiving} />
                <ReceivingTicketDialog open={openReceivingTicketDialog} onClose={() => setOpenReceivingTicketDialog(false)} receivingId={receivingTicketForm.receivingId} onTicketCreate={() => setSnackbar({ open: true, message: 'Ticket created', severity: 'success' })} />

                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default ReceivingPage;