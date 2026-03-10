import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Snackbar, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Backdrop, CircularProgress
} from '@mui/material';

// Components
import ReceivingList from '../components/receiving/ReceivingList';
import ReceivingForm from '../components/receiving/ReceivingForm';
import ReceivingDetails from '../components/receiving/ReceivingDetails';
import ReceiveGoodsForm from '../components/receiving/ReceiveGoodsForm';
import EditReceiveGoodsForm from '../components/receiving/EditReceiveGoodsForm';
import ReceivingTicketForm from '../components/receiving/ReceivingTicketForm';
import ReceivingTicketList from '../components/receiving/ReceivingTicketList'; // Added tracker

// API Services
import {
  getPurchaseOrderById, initiateReceivingFromPO, fetchReceiving, 
  createReceiving, updateReceiving, createReceivingTicket, 
  addAttachmentToTicket, deleteReceiving, fetchReceivingByPoId, 
  fetchReceivingByPoNumber, fetchReceivingTicketById,
  fetchReceivingById, pendingPurchaseOrders, fetchAllTickets // Added fetchAllTickets (assumed API)
} from '../services/api';
import { useShop } from '../context/ShopContext';

const Receiving = () => {
  const { isPharmacy } = useShop();
  // View State
  const [view, setView] = useState('list'); // 'list', 'create', 'details', 'receive_goods', 'edit_receive_goods', 'ticket_form', 'ticket_list'
  const [receivings, setReceivings] = useState([]);
  const [tickets, setTickets] = useState([]); // State to hold support tickets
  const [currentReceiving, setCurrentReceiving] = useState(null);
  const [poItems, setPoItems] = useState([]);
  const [pendingPOs, setPendingPOs] = useState([]);

  // UI Feedback State
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'info' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  
  // Table state managed here for persistence across view swaps
  const [filters, setFilters] = useState({ poNumber: '', status: '', supplier: '', dateFrom: '', dateTo: '' });
  const [sort, setSort] = useState({ field: 'receivedAt', direction: 'desc' });

  // Notification Helper
  const showMessage = (msg, severity = 'success') => {
    setSnackbar({ open: true, msg, severity });
  };

  // API Wrapper
  const api = useMemo(() => ({
    getReceivings: async () => {
      const res = await fetchReceiving();
      return res?.content || (Array.isArray(res) ? res : []);
    },
    getPoItems: async (poId) => {
      const po = await getPurchaseOrderById(poId);
      if (!po?.items) throw new Error("PO Items not found");
      return po.items;
    },
    getTickets: async () => {
      // Logic for fetching tickets - assuming API exists
      try {
        const res = await fetchAllTickets(); 
        return Array.isArray(res) ? res : [];
      } catch (e) { return []; }
    }
  }), []);

  // Data Fetching
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, pos, ticketList] = await Promise.all([
        api.getReceivings(),
        pendingPurchaseOrders(),
        api.getTickets()
      ]);
      setReceivings(list);
      setPendingPOs(pos || []);
      setTickets(ticketList || []);
    } catch (err) {
      showMessage('Failed to sync with server', 'error');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { refreshData(); }, [refreshData]);

  // Handler: View Details
  const handleViewDetails = async (rec) => {
    setLoading(true);
    try {
      const items = await api.getPoItems(rec.purchaseOrderId);
      setPoItems(items);
      setCurrentReceiving(rec);
      setView('details');
    } catch (err) {
      showMessage('Error loading PO items', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Save / Update Received Goods
  const handleUpdateReceivedGoods = async (receivingId, items) => {
    setLoading(true);
    try {
      const receiving = receivings.find(r => r.id === receivingId);
      const payload = {
        id: receiving.id,
        purchaseOrderId: receiving.purchaseOrderId,
        shopId: receiving.shopId,
        receivingItems: items,
      };
      const updated = await updateReceiving(receivingId, payload);
      setReceivings(prev => prev.map(r => r.id === receivingId ? updated : r));
      setView('list');
      showMessage('Inventory updated successfully');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Delete
  const handleDeleteConfirm = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    setLoading(true);
    try {
      await deleteReceiving(id);
      setReceivings(prev => prev.filter(r => r.id !== id));
      showMessage('Record deleted');
    } catch (err) {
      showMessage('Cannot delete record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    const commonProps = { onCancel: () => setView('list') };

    switch (view) {
      case 'create':
        return <ReceivingForm {...commonProps} pendingPOs={pendingPOs} 
                  onSubmit={async (dto) => {
                    setLoading(true);
                    try {
                      const res = await initiateReceivingFromPO(dto);
                      setReceivings(p => [res, ...p]);
                      setView('list');
                      showMessage('Draft created');
                    } catch(e) { showMessage('Creation failed', 'error'); }
                    setLoading(false);
                  }} />;
      
      case 'edit_receive_goods':
        return <EditReceiveGoodsForm {...commonProps} receiving={currentReceiving} 
                  onSubmit={handleUpdateReceivedGoods} getPoItems={api.getPoItems} />;
      
      case 'details':
        return <ReceivingDetails {...commonProps} receiving={currentReceiving} poItems={poItems} onBack={commonProps.onCancel} />;
      
      case 'receive_goods':
        return <ReceiveGoodsForm {...commonProps} 
                  getReceivings={api.getReceivings} 
                  getReceivingById={fetchReceivingById}
                  getPoItems={api.getPoItems}
                  isPharmacy={isPharmacy}
                  onSubmit={async (dto) => {
                    setLoading(true);
                    try {
                       const res = await initiateReceivingFromPO(dto);
                       setReceivings(p => p.map(r => r.id === res.id ? res : r));
                       setView('list');
                       showMessage('Goods processed successfully');
                    } catch(e) { showMessage('Processing failed', 'error'); }
                    setLoading(false);
                  }} />;

      case 'ticket_form':
        return <ReceivingTicketForm {...commonProps} title="New Support Ticket" 
                  addAttachmentToTicket={addAttachmentToTicket}
                  onSubmit={async (dto) => {
                    setLoading(true);
                    try {
                      const ticket = await createReceivingTicket(dto);
                      // If there's an attachment logic in the ticket form, it's handled there
                      setView('ticket_list'); // Switch to tracker to see results
                      refreshData(); // Refresh to show new ticket
                      showMessage('Ticket raised');
                    } catch(e) { showMessage('Ticket error', 'error'); }
                    setLoading(false);
                  }} />;

      case 'ticket_list':
        return <ReceivingTicketList 
                  tickets={tickets} 
                  onBack={() => setView('list')} 
                  onViewDetails={(ticket) => showMessage(`Viewing ticket ${ticket.id} details (Feature Coming Soon)`)} 
               />;

      default:
        return (
          <ReceivingList
            receivings={receivings}
            loading={loading}
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            onViewDetails={handleViewDetails}
            onEdit={(rec) => { setCurrentReceiving(rec); setView('edit_receive_goods'); }}
            onDelete={(id) => setDeleteConfirm({ open: true, id })}
            onReceiveGoods={() => setView('receive_goods')}
            onCreateNew={() => setView('create')}
            onCreateTicket={() => setView('ticket_form')}
            onViewTickets={() => setView('ticket_list')} // Added this prop
          />
        );
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', p: { xs: 2, md: 4 } }}>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Paper sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, md: 3 }, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {renderView()}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert variant="filled" severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.msg}
        </Alert>
      </Snackbar>

      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>This will remove the receiving record. Inventory changes already committed will not be reversed automatically. Continue?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })} variant="outlined">Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">Confirm Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Receiving;