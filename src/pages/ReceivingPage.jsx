import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Fab,
} from '@mui/material';
import {
    getPurchaseOrders,
    fetchShop,
    createReceiving,
    fetchReceiving,
    updateReceiving,
    createReceivingTicket,
} from '../services/api'; // Replace with your actual API calls
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

const ReceivingPage = () => {
    const [receivings, setReceivings] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [receivingForm, setReceivingForm] = useState({
        purchaseOrderId: '',
        shopId: '',
        receivedBy: '',
        notes: '',
        items: [],
        receivedAt: dayjs(),
    });

    const [receivingTicketForm, setReceivingTicketForm] = useState({
        receivingId: '',
        reason: '',
        description: '',
        raisedBy: '',
    });

    const [openReceivingDialog, setOpenReceivingDialog] = useState(false);
    const [openReceivingItemDialog, setOpenReceivingItemDialog] = useState(false);
    const [openReceivingTicketDialog, setOpenReceivingTicketDialog] = useState(false);
    const [selectedReceivingId, setSelectedReceivingId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [poResponse, shopResponse, receivingResponse] = await Promise.all([
                    getPurchaseOrders(),
                    fetchShop(),
                    fetchReceiving(),
                ]);

                setPurchaseOrders(poResponse.data);
                setShops(shopResponse.data);
                setReceivings(receivingResponse.data);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please try again.");
                setSnackbar({ open: true, message: 'Failed to load data.', severity: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleOpenReceivingItemDialog = (receivingId) => {
        setSelectedReceivingId(receivingId);
        setOpenReceivingItemDialog(true);
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'purchaseOrder',
            headerName: 'Purchase Order',
            flex: 1,
            valueGetter: (params) => params.row.purchaseOrder?.poNumber || 'N/A',
        },
        {
            field: 'shop',
            headerName: 'Shop',
            flex: 1,
            valueGetter: (params) => params.row.shop?.name || 'N/A',
        },
        { field: 'receivedBy', headerName: 'Received By', flex: 1 },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 1,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton size="small" onClick={() => handleOpenReceivingItemDialog(params.row.id)} title="Manage Items">
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => {
                            setSelectedReceivingId(params.row.id);
                            setReceivingTicketForm({ ...receivingTicketForm, receivingId: params.row.id });
                            setOpenReceivingTicketDialog(true);
                        }}
                        title="Raise Ticket"
                    >
                        <ReportProblemIcon />
                    </IconButton>
                </Box>
            ),
        },
    ];

    const handleCreateReceiving = async () => {
        try {
            const response = await createReceiving({
                ...receivingForm,
                receivedAt: receivingForm.receivedAt.toISOString(),
            });
            setReceivings([...receivings, response.data]);
            setSnackbar({ open: true, message: 'Receiving created successfully!', severity: 'success' });
            setOpenReceivingDialog(false);
            setReceivingForm({
                purchaseOrderId: '',
                shopId: '',
                receivedBy: '',
                notes: '',
                items: [],
                receivedAt: dayjs(),
            });
        } catch (err) {
            console.error("Error creating receiving:", err);
            setError("Failed to create receiving. Please try again.");
            setSnackbar({ open: true, message: 'Failed to create receiving.', severity: 'error' });
        }
    };

    const handleCreateReceivingTicket = async () => {
        try {
            await createReceivingTicket(receivingTicketForm);
            setSnackbar({ open: true, message: 'Receiving ticket created successfully!', severity: 'success' });
            setOpenReceivingTicketDialog(false);
            setReceivingTicketForm({
                receivingId: '',
                reason: '',
                description: '',
                raisedBy: '',
            });
        } catch (err) {
            console.error("Error creating receiving ticket:", err);
            setError("Failed to create receiving ticket. Please try again.");
            setSnackbar({ open: true, message: 'Failed to create receiving ticket.', severity: 'error' });
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    if (loading && receivings.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
                {error && <Typography sx={{ ml: 2 }}>{error}</Typography>}
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Receiving Management
                </Typography>

                <Fab color="primary" aria-label="add" onClick={() => setOpenReceivingDialog(true)} sx={{ position: 'fixed', bottom: 32, right: 32 }}>
                    <AddIcon />
                </Fab>

                <Paper sx={{ height: '75vh', width: '100%', mt: 2 }}>
                    <DataGrid
                        rows={receivings}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        disableSelectionOnClick
                        loading={loading}
                    />
                </Paper>

                {/* Create Receiving Dialog */}
                <Dialog open={openReceivingDialog} onClose={() => setOpenReceivingDialog(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Create Receiving</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth margin="dense">
                            <InputLabel id="purchase-order-label">Purchase Order</InputLabel>
                            <Select
                                labelId="purchase-order-label"
                                value={receivingForm.purchaseOrderId}
                                label="Purchase Order"
                                onChange={(e) => setReceivingForm({ ...receivingForm, purchaseOrderId: e.target.value })}
                            >
                                {purchaseOrders.map((po) => (
                                    <MenuItem key={po.id} value={po.id}>{po.poNumber}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth margin="dense">
                            <InputLabel id="shop-label">Shop</InputLabel>
                            <Select
                                labelId="shop-label"
                                value={receivingForm.shopId}
                                label="Shop"
                                onChange={(e) => setReceivingForm({ ...receivingForm, shopId: e.target.value })}
                            >
                                {shops.map((shop) => (
                                    <MenuItem key={shop.id} value={shop.id}>{shop.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Received By"
                            fullWidth
                            margin="dense"
                            value={receivingForm.receivedBy}
                            onChange={(e) => setReceivingForm({ ...receivingForm, receivedBy: e.target.value })}
                        />
                        <DatePicker
                            label="Received At"
                            value={receivingForm.receivedAt}
                            onChange={(newValue) => setReceivingForm({ ...receivingForm, receivedAt: newValue })}
                            renderInput={(props) => <TextField {...props} margin="dense" fullWidth />}
                        />
                        <TextField
                            label="Notes"
                            fullWidth
                            margin="dense"
                            multiline
                            rows={4}
                            value={receivingForm.notes}
                            onChange={(e) => setReceivingForm({ ...receivingForm, notes: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenReceivingDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateReceiving} color="primary">
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Manage Receiving Items Dialog */}
                <Dialog open={openReceivingItemDialog} onClose={() => setOpenReceivingItemDialog(false)} fullWidth maxWidth="md">
                    <DialogTitle>Manage Receiving Items</DialogTitle>
                    <DialogContent>
                        {/* Implement UI for managing receiving items (add, edit, delete) */}
                        <Typography>Receiving Items Management UI for Receiving ID: {selectedReceivingId}</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenReceivingItemDialog(false)}>Cancel</Button>
                        <Button color="primary">Save</Button>
                    </DialogActions>
                </Dialog>

                {/* Create Receiving Ticket Dialog */}
                <Dialog open={openReceivingTicketDialog} onClose={() => setOpenReceivingTicketDialog(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Create Receiving Ticket</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Reason"
                            fullWidth
                            margin="dense"
                            value={receivingTicketForm.reason}
                            onChange={(e) => setReceivingTicketForm({ ...receivingTicketForm, reason: e.target.value })}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            margin="dense"
                            multiline
                            rows={4}
                            value={receivingTicketForm.description}
                            onChange={(e) => setReceivingTicketForm({ ...receivingTicketForm, description: e.target.value })}
                        />
                        <TextField
                            label="Raised By"
                            fullWidth
                            margin="dense"
                            value={receivingTicketForm.raisedBy}
                            onChange={(e) => setReceivingTicketForm({ ...receivingTicketForm, raisedBy: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenReceivingTicketDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateReceivingTicket} color="primary">
                            Create Ticket
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default ReceivingPage;