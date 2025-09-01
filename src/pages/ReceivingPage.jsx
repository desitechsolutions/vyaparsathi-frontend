import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Button, CircularProgress, TextField, FormControl,
    InputLabel, Select, MenuItem, Snackbar, Alert, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, Fab, Grid, Divider, Chip, Card, CardContent, Tooltip
} from '@mui/material';
import {
    getPurchaseOrders, fetchShop, createReceiving, fetchReceiving, updateReceiving, createReceivingTicket
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
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

// --- Details Dialog Component ---
function DetailsDialog({ open, onClose, row, getPOItemById, onReceivingUpdate }) {
    // Use receivingItems instead of items
    const [receivingItems, setReceivingItems] = useState(() =>
        Array.isArray(row?.receivingItems) ? row.receivingItems.map(i => ({
            ...i,
            receivedQty: i.receivedQty || 0,
            damagedQty: i.damagedQty || 0,
            rejectedQty: i.rejectedQty || 0,
            putawayQty: i.putawayQty || 0,
        })) : []
    );
    const [isSaving, setIsSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Defensive effect: Reset items when dialog opens or new row is provided
    useEffect(() => {
        if (open && row) {
            setReceivingItems(Array.isArray(row.receivingItems) ? row.receivingItems.map(i => ({
                ...i,
                receivedQty: i.receivedQty || 0,
                damagedQty: i.damagedQty || 0,
                rejectedQty: i.rejectedQty || 0,
                putawayQty: i.putawayQty || 0,
            })) : []);
        }
    }, [open, row]);

    const handleItemChange = (index, field, value) => {
        const updated = [...receivingItems];
        const item = { ...updated[index], [field]: value };

        // Auto-calculate receiving status
        const totalAccounted = (item.receivedQty || 0) + (item.damagedQty || 0) + (item.rejectedQty || 0);
        if (totalAccounted === 0) {
            item.status = 'PENDING';
        } else if (totalAccounted < item.expectedQty) {
            item.status = 'PARTIALLY_RECEIVED';
        } else {
            item.status = 'RECEIVED';
        }

        // Auto-calculate putaway status
        if ((item.putawayQty || 0) === 0) {
            item.putAwayStatus = 'PENDING';
        } else if ((item.putawayQty || 0) < (item.receivedQty || 0)) {
            item.putAwayStatus = 'PARTIAL';
        } else {
            item.putAwayStatus = 'COMPLETED';
        }

        updated[index] = item;
        setReceivingItems(updated);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                ...row,
                receivingItems: receivingItems.map(item => ({
                    id: item.id,
                    purchaseOrderItemId: item.purchaseOrderItemId,
                    status: item.status,
                    expectedQty: item.expectedQty,
                    receivedQty: item.receivedQty,
                    damagedQty: item.damagedQty,
                    rejectedQty: item.rejectedQty,
                    putawayQty: item.putawayQty,
                    putAwayStatus: item.putAwayStatus,
                    notes: item.notes,
                })),
            };
            const updatedReceiving = await updateReceiving(row.id, payload);
            onReceivingUpdate(updatedReceiving.data);
            setSnackbar({ open: true, message: `Receiving updated successfully!`, severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: `Failed to update receiving.`, severity: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!row) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Receiving Details</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={4}>
                    {/* Supplier Details Section */}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <EmailIcon color="action" sx={{ mr: 1.5 }} />
                            <Typography variant="body2">{row.supplier?.email || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <PhoneIcon color="action" sx={{ mr: 1.5 }} />
                            <Typography variant="body2">{row.supplier?.phone || 'N/A'}</Typography>
                        </Box>
                    </Grid>
                    {/* Item Management Section */}
                    <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" gutterBottom>Item Processing</Typography>
                            <Button variant="contained" onClick={handleSave} disabled={isSaving} startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}>
                                Save Changes
                            </Button>
                        </Box>
                        {(receivingItems || []).filter(Boolean).map((item, index) => {
                            const poItem = getPOItemById(row.purchaseOrderId, item.purchaseOrderItemId);
                            const totalReceivedInvalid = (item.receivedQty + item.damagedQty + item.rejectedQty) > item.expectedQty;
                            const putawayInvalid = item.putawayQty > item.receivedQty;

                            return (
                                <Paper key={item.id || index} sx={{ p: 2, mb: 2, borderLeft: 5, borderColor: item.status === 'RECEIVED' ? 'success.main' : 'primary.main' }}>
                                    <Typography variant="subtitle1" fontWeight="bold">{poItem?.name || 'Product Name Missing'}</Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        SKU: {poItem?.sku || 'N/A'} | Expected: {item.expectedQty}
                                    </Typography>
                                    
                                    <Divider sx={{ my: 1.5 }}>
                                        <Chip label="Receiving" size="small" />
                                    </Divider>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={4}>
                                            <TextField size="small" label="Received Qty" type="number" value={item.receivedQty} onChange={e => handleItemChange(index, 'receivedQty', Number(e.target.value))} fullWidth inputProps={{ min: 0 }} />
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField size="small" label="Damaged Qty" type="number" value={item.damagedQty} onChange={e => handleItemChange(index, 'damagedQty', Number(e.target.value))} fullWidth inputProps={{ min: 0 }} />
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField size="small" label="Rejected Qty" type="number" value={item.rejectedQty} onChange={e => handleItemChange(index, 'rejectedQty', Number(e.target.value))} fullWidth inputProps={{ min: 0 }} />
                                        </Grid>
                                    </Grid>
                                    {totalReceivedInvalid && <Alert severity="error" sx={{mt:1}}>Total received, damaged, and rejected quantities cannot exceed expected quantity.</Alert>}

                                    <Divider sx={{ my: 1.5 }}>
                                        <Chip label="Putaway" size="small" color="success" />
                                    </Divider>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={6}>
                                            <TextField size="small" label="Putaway Qty" type="number" value={item.putawayQty} onChange={e => handleItemChange(index, 'putawayQty', Number(e.target.value))} fullWidth inputProps={{ min: 0, max: item.receivedQty }} disabled={item.receivedQty === 0} />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Chip icon={<ArchiveIcon />} label={item.putAwayStatus || 'PENDING'} color={item.putAwayStatus === 'COMPLETED' ? 'success' : 'warning'} variant="outlined" />
                                        </Grid>
                                    </Grid>
                                    {putawayInvalid && <Alert severity="error" sx={{mt:1}}>Putaway quantity cannot exceed received quantity.</Alert>}
                                    
                                    <TextField size="small" label="Notes" value={item.notes || ''} onChange={e => handleItemChange(index, 'notes', e.target.value)} fullWidth sx={{mt: 2}}/>
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

// --- Main Page Component ---
const ReceivingPage = () => {
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
    const [receivingForm, setReceivingForm] = useState({ purchaseOrderId: '', shopId: '', receivedBy: '', notes: '', receivingItems: [], receivedAt: dayjs() });
    const [receivingTicketForm, setReceivingTicketForm] = useState({ receivingId: '', reason: '', description: '', raisedBy: '' });
    const [detailsDialog, setDetailsDialog] = useState({ open: false, row: null });

    const getPOById = useCallback((id) => Array.isArray(purchaseOrders) ? purchaseOrders.find(po => po.id === id) : undefined, [purchaseOrders]);
    const getPOItemById = useCallback((poId, itemId) => {
        const po = getPOById(poId);
        return po?.items?.find(item => item.id === itemId);
    }, [getPOById]);
    const getShopById = useCallback((id) => Array.isArray(shops) && shops.length > 0 ? shops[0] : undefined, [shops]);

    const handleReceivingUpdate = useCallback((updatedReceiving) => {
        setReceivings(prevReceivings =>
            prevReceivings.map(r => r.id === updatedReceiving.id ? updatedReceiving : r)
        );
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [poData, shopResponse, receivingData] = await Promise.all([
                    getPurchaseOrders(),
                    fetchShop(),
                    fetchReceiving(),
                ]);
                setPurchaseOrders(Array.isArray(poData) ? poData : []);
                setShops(shopResponse.data ? (Array.isArray(shopResponse.data) ? shopResponse.data : [shopResponse.data]) : []);
                setReceivings(Array.isArray(receivingData) ? receivingData : []);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCreateReceiving = async () => {
        try {
            const response = await createReceiving({ ...receivingForm, receivedAt: receivingForm.receivedAt.toISOString() });
            setReceivings(prev => [...prev, response.data]);
            setSnackbar({ open: true, message: 'Receiving created successfully!', severity: 'success' });
            setOpenReceivingDialog(false);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to create receiving.', severity: 'error' });
        }
    };

    const handleCreateReceivingTicket = async () => {
        try {
            await createReceivingTicket(receivingTicketForm);
            setSnackbar({ open: true, message: 'Ticket created successfully!', severity: 'success' });
            setOpenReceivingTicketDialog(false);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to create ticket.', severity: 'error' });
        }
    };

    const summaryStats = useMemo(() => {
        const total = receivings.length;
        const pending = receivings.filter(r => r.status === 'PENDING').length;
        const partial = receivings.filter(r =>
            r.status === 'PARTIALLY_RECEIVED' || r.status === 'PARTIAL'
        ).length;
        return { total, pending, partial };
    }, [receivings]);

    const columns = useMemo(() => [
        {
            field: 'purchaseOrderId', headerName: 'PO Number', flex: 1,
            valueGetter: (params) => getPOById(params.row.purchaseOrderId)?.poNumber || 'N/A',
        },
        {
            field: 'supplier', headerName: 'Supplier', flex: 1.5,
            valueGetter: (params) => params.row.supplier?.name || 'N/A',
        },
        {
            field: 'shopId', headerName: 'Shop', flex: 1,
            valueGetter: (params) => getShopById(params.row.shopId)?.name || 'N/A',
        },
        {
            field: 'status', headerName: 'Status', flex: 1,
            renderCell: (params) => {
                const status = params.value;
                const chipProps = {
                    label: status,
                    size: 'small',
                    variant: 'outlined',
                    color: status === 'PENDING' ? 'primary' : status === 'PARTIALLY_RECEIVED' || status === 'PARTIAL' ? 'warning' : status === 'RECEIVED' ? 'success' : 'default'
                };
                return <Chip {...chipProps} />;
            }
        },
        { field: 'receivedBy', headerName: 'Received By', flex: 1, valueGetter: (params) => params.value || 'N/A' },
        {
            field: 'actions',
            type: 'actions',
            width: 120,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<Tooltip title="View Details"><BusinessIcon /></Tooltip>}
                    label="View Details"
                    onClick={() => setDetailsDialog({ open: true, row: params.row })}
                />,
                <GridActionsCellItem
                    icon={<Tooltip title="Raise Ticket"><ReportProblemIcon /></Tooltip>}
                    label="Raise Ticket"
                    onClick={() => {
                        setReceivingTicketForm({ ...receivingTicketForm, receivingId: params.id });
                        setOpenReceivingTicketDialog(true);
                    }}
                />,
            ],
        },
    ], [getPOById, getShopById, receivingTicketForm]);

    // Section header styles (unchanged)
    const sectionHeaderSx = { backgroundColor: 'primary.main', color: 'white', p: 1.5, borderRadius: 1, mb: 2 };

    if (error) {
        return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
                <Box sx={{ ...sectionHeaderSx, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold">Receiving Dashboard</Typography>
                    <Fab color="secondary" aria-label="add" onClick={() => setOpenReceivingDialog(true)}>
                        <AddIcon />
                    </Fab>
                </Box>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}><Card><CardContent><ReceiptLongIcon color="action" sx={{ fontSize: 40, float: 'right' }} /><Typography color="text.secondary">Total Receivings</Typography><Typography variant="h4" component="div">{summaryStats.total}</Typography></CardContent></Card></Grid>
                    <Grid item xs={12} sm={4}><Card><CardContent><PendingActionsIcon color="warning" sx={{ fontSize: 40, float: 'right' }} /><Typography color="text.secondary">Pending</Typography><Typography variant="h4" component="div">{summaryStats.pending}</Typography></CardContent></Card></Grid>
                    <Grid item xs={12} sm={4}><Card><CardContent><TaskAltIcon color="success" sx={{ fontSize: 40, float: 'right' }} /><Typography color="text.secondary">Partially Received</Typography><Typography variant="h4" component="div">{summaryStats.partial}</Typography></CardContent></Card></Grid>
                </Grid>
                <Card>
                    <Paper sx={{ height: '70vh', width: '100%' }}>
                        <DataGrid
                            rows={receivings}
                            columns={columns}
                            loading={loading}
                            getRowId={(row) => row.id}
                            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                            pageSizeOptions={[10, 25, 50]}
                            slots={{ noRowsOverlay: () => <Box sx={{ p: 3, textAlign: 'center' }}>No receivings to display.</Box>, loadingOverlay: CircularProgress }}
                            sx={{ border: 0 }}
                        />
                    </Paper>
                </Card>
                {/* Details Dialog */}
                <DetailsDialog
                    open={detailsDialog.open}
                    row={detailsDialog.row}
                    onClose={() => setDetailsDialog({ open: false, row: null })}
                    getPOItemById={getPOItemById}
                    onReceivingUpdate={handleReceivingUpdate}
                />
                {/* Create Receiving Dialog */}
                <Dialog open={openReceivingDialog} onClose={() => setOpenReceivingDialog(false)} fullWidth maxWidth="sm">
                    <DialogTitle>
                        <Box sx={sectionHeaderSx}>Create New Receiving</Box>
                    </DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth margin="dense"><InputLabel>Purchase Order</InputLabel><Select label="Purchase Order" value={receivingForm.purchaseOrderId} onChange={(e) => setReceivingForm({ ...receivingForm, purchaseOrderId: e.target.value })}>{purchaseOrders.map((po) => <MenuItem key={po.id} value={po.id}>{po.poNumber}</MenuItem>)}</Select></FormControl>
                        <FormControl fullWidth margin="dense"><InputLabel>Shop</InputLabel><Select label="Shop" value={receivingForm.shopId} onChange={(e) => setReceivingForm({ ...receivingForm, shopId: e.target.value })}>{shops.map((shop) => <MenuItem key={shop.code} value={1}>{shop.name}</MenuItem>)}</Select></FormControl>
                        <TextField label="Received By" fullWidth margin="dense" value={receivingForm.receivedBy} onChange={(e) => setReceivingForm({ ...receivingForm, receivedBy: e.target.value })} />
                        <DatePicker label="Received At" value={receivingForm.receivedAt} onChange={(newValue) => setReceivingForm({ ...receivingForm, receivedAt: newValue })} sx={{ width: '100%', mt: 1 }} />
                        <TextField label="Notes" fullWidth margin="dense" multiline rows={3} value={receivingForm.notes} onChange={(e) => setReceivingForm({ ...receivingForm, notes: e.target.value })} />
                    </DialogContent>
                    <DialogActions><Button onClick={() => setOpenReceivingDialog(false)}>Cancel</Button><Button onClick={handleCreateReceiving} color="primary" variant="contained">Create</Button></DialogActions>
                </Dialog>
                {/* Create Receiving Ticket Dialog */}
                <Dialog open={openReceivingTicketDialog} onClose={() => setOpenReceivingTicketDialog(false)} fullWidth maxWidth="sm">
                    <DialogTitle>
                        <Box sx={sectionHeaderSx}>Create Receiving Ticket</Box>
                    </DialogTitle>
                    <DialogContent>
                        <TextField label="Reason" fullWidth margin="dense" value={receivingTicketForm.reason} onChange={(e) => setReceivingTicketForm({ ...receivingTicketForm, reason: e.target.value })} />
                        <TextField label="Description" fullWidth margin="dense" multiline rows={4} value={receivingTicketForm.description} onChange={(e) => setReceivingTicketForm({ ...receivingTicketForm, description: e.target.value })} />
                        <TextField label="Raised By" fullWidth margin="dense" value={receivingTicketForm.raisedBy} onChange={(e) => setReceivingTicketForm({ ...receivingTicketForm, raisedBy: e.target.value })} />
                    </DialogContent>
                    <DialogActions><Button onClick={() => setOpenReceivingTicketDialog(false)}>Cancel</Button><Button onClick={handleCreateReceivingTicket} color="primary" variant="contained">Create Ticket</Button></DialogActions>
                </Dialog>
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default ReceivingPage;