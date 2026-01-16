import React, { useState, useEffect, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ReceivingList from '../components/receiving/ReceivingList';
import ReceivingForm from '../components/receiving/ReceivingForm';
import ReceivingDetails from '../components/receiving/ReceivingDetails';
import ReceiveGoodsForm from '../components/receiving/ReceiveGoodsForm';
import EditReceiveGoodsForm from '../components/receiving/EditReceiveGoodsForm';
import ReceivingTicketForm from '../components/receiving/ReceivingTicketForm';


import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import {
  getPurchaseOrderById,initiateReceivingFromPO, fetchReceiving, createReceiving, updateReceiving, createReceivingTicket, addAttachmentToTicket,
  deleteReceiving, fetchReceivingByPoId, fetchReceivingByPoNumber, fetchReceivingTicketById,
  fetchReceivingById, updateReceivingTicket, deleteReceivingTicket, pendingPurchaseOrders
} from '../services/api';

const getPendingPurchaseOrders = async () => {
  return await pendingPurchaseOrders();
}

const api = {
  getReceivings: async () => {
    const response = await fetchReceiving();
    return Array.isArray(response?.content) ? response.content : (Array.isArray(response) ? response : []);
  },
  getReceivingById: async (id) => await fetchReceivingById(id),
  getReceivingByPurchaseOrderId: async (poId) => await fetchReceivingByPoId(poId),
  getReceivingByPoNumber: async (poNumber) => await fetchReceivingByPoNumber(poNumber),
  getPoItems: async (poId) => {
    const po = await getPurchaseOrderById(poId);
    if (!po || !po.items) {
      throw new Error("No items found for this PO ID.");
    }
    return po.items;
  },
  createReceiving: async (dto) => await createReceiving(dto),
  updateReceiving: async (id, dto) => await updateReceiving(id, dto),
  deleteReceiving: async (id) => await deleteReceiving(id),
  createReceivingTicket: async (dto) => await createReceivingTicket(dto),
  getReceivingTicketById: async (id) => await fetchReceivingTicketById(id),
  updateReceivingTicket: async (id, dto) => await updateReceivingTicket(id, dto), // Assume you have this import or add it
  deleteReceivingTicket: async (id) => await deleteReceivingTicket(id), // Assume you have this import or add it
  receiveGoods: async (dto) => await initiateReceivingFromPO(dto), // Align with real
  updateReceivedGoods: async (receivingId, payload) => await updateReceiving(receivingId, payload),
  addAttachmentToTicket: async (id, file) => await addAttachmentToTicket(id, file),
  getPendingPOs: async () => await getPendingPurchaseOrders(),
};

const Receiving = () => {
  const [view, setView] = useState('list');
  const [receivings, setReceivings] = useState([]);
  const [currentReceiving, setCurrentReceiving] = useState(null);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingPOs, setPendingPOs] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [sort, setSort] = useState({ field: '', direction: 'asc' });
  const [poItems, setPoItems] = useState([]);

  const [filters, setFilters] = useState({
    poNumber: '',
    status: '',
    supplier: '',
    dateFrom: '',
    dateTo: '',
    // Add more fields as needed
  });

  const fetchData = useCallback(async (action) => {
    setLoading(true);
    setError('');
    try {
      if (action === 'all') {
        const result = await api.getReceivings();
        setReceivings(Array.isArray(result) ? result : []);
      }
      else if (action === 'pendingPOs') {
        const result = await api.getPendingPOs();
        setPendingPOs(Array.isArray(result) ? result : []);
      }
    } catch (err) {
      setSnackbarMsg('Failed to fetch data. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setError('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData('all');
    fetchData('pendingPOs');
  }, [fetchData]);

  const handleViewDetails = async (rec) => {
  setCurrentReceiving(rec);
  setLoading(true);
  try {
    const items = await api.getPoItems(rec.purchaseOrderId);
    setPoItems(items);
  } catch (err) {
    setPoItems([]);
  }
  setLoading(false);
  setView('details');
  };

  const handleCreate = async (dto) => {
    setLoading(true);
    setError('');
    try {
      const newRec = await api.receiveGoods(dto);
      setReceivings(prev => [...prev, newRec]);
      setView('list');
      setSnackbarMsg('Receiving created successfully.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Failed to create receiving.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, dto) => {
    setLoading(true);
    setError('');
    try {
      const updatedRec = await api.updateReceiving(id, dto);
      setReceivings(prev => prev.map(rec => rec.id === id ? updatedRec : rec));
      setView('list');
      setSnackbarMsg('Receiving updated successfully.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Failed to update receiving.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReceivedGoods = async (receivingId, items) => {
    setLoading(true);
    setError('');
    try {
      const receiving = receivings.find(r => r.id === receivingId);
      const payload = {
        id: receiving.id,
        purchaseOrderId: receiving.purchaseOrderId,
        shopId: receiving.shopId,
        receivingItems: items,
      };
      const updatedRec = await api.updateReceivedGoods(receivingId, payload);
      setReceivings(prev => prev.map(rec => rec.id === receivingId ? updatedRec : rec));
      setView('list');
      setSnackbarMsg('Received goods updated successfully.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Failed to update received goods.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    setLoading(true);
    setError('');
    try {
      await api.deleteReceiving(deleteId);
      setReceivings(prev => prev.filter(rec => rec.id !== deleteId));
      setSnackbarMsg('Receiving deleted successfully.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Failed to delete receiving.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setError('');
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleReceiveGoods = async (dto) => {
    setLoading(true);
    setError('');
    try {
      const newRec = await api.receiveGoods(dto);
      setReceivings(prev => [...prev, newRec]);
      setView('list');
      setSnackbarMsg('Goods received successfully.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Failed to receive goods.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (dto) => {
    setLoading(true);
    setError('');
    try {
      await api.createReceivingTicket(dto);
      setView('list');
      setSnackbarMsg('Ticket created successfully.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
     setSnackbarMsg('Failed to create receiving ticket.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceiving = (receiving) => {
    const printContent = document.getElementById(`print-receiving-${receiving.id}`);
    const printWindow = window.open('', '', 'height=500, width=800');
    printWindow.document.write('<html><head><title>Receiving Report</title></head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const renderView = () => {
    switch (view) {
      case 'create':
        return (
          <ReceivingForm
            onSubmit={handleCreate}
            onCancel={() => setView('list')}
            title="Create New Receiving"
            pendingPOs={pendingPOs}
          />
        );
      case 'edit_receive_goods':
        return (
          <EditReceiveGoodsForm
            receiving={currentReceiving}
            onSubmit={handleUpdateReceivedGoods}
            onCancel={() => setView('list')}
            getPoItems={api.getPoItems}
          />
        );
      case 'details':
        return (
          <ReceivingDetails
            receiving={currentReceiving}
            poItems={poItems}
            onBack={() => setView('list')}
          />
        );
      case 'receive_goods':
        return (
          <ReceiveGoodsForm
            onSubmit={handleReceiveGoods}
            onCancel={() => setView('list')}
            getReceivings={api.getReceivings}
            getReceivingById={api.getReceivingById}
            getPoItems={api.getPoItems}
          />
        );
      case 'ticket_form':
        return (
          <ReceivingTicketForm
            onSubmit={handleCreateTicket}
            onCancel={() => setView('list')}
            title="Create Receiving Ticket"
            addAttachmentToTicket={api.addAttachmentToTicket}
          />
        );
      default:
        return (
          <ReceivingList
            receivings={receivings}
            loading={loading}
            error={error}
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            onViewDetails={handleViewDetails} 
            onEdit={(rec) => { setCurrentReceiving(rec); setView('edit_receive_goods'); }}
            onDelete={handleDeleteRequest}
            onReceiveGoods={() => setView('receive_goods')}
            onCreateNew={() => setView('create')}
            onCreateTicket={() => setView('ticket_form')}
          />
        );
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 4 }}>
      <Paper sx={{ maxWidth: 1100, mx: 'auto', p: 4, borderRadius: 2, boxShadow: 3 }}>
        {renderView()}
      </Paper>
    <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMsg}
        </MuiAlert>
      </Snackbar>
    <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Receiving</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this receiving record?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} variant="outlined">Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default Receiving;