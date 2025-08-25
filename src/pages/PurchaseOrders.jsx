import React, { useState } from 'react';
import { Container, Typography, Box, Snackbar, Alert, Button } from '@mui/material';
import { ShoppingBag as ShoppingBagIcon, Add as AddIcon } from '@mui/icons-material';

import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import PurchaseOrderFilters from '../components/po/PurchaseOrderFilters';
import PurchaseOrderList from '../components/po/PurchaseOrderList';
import PurchaseOrderModal from '../components/po/PurchaseOrderModal';

const PurchaseOrders = () => {
  const {
    isLoading,
    allSuppliers,
    filteredOrders,
    snackbar,
    search,
    setSearch,
    handleDelete,
    handleReceive,
    handleCreateOrUpdate,
    handleSnackbarClose,
    showSnackbar,
  } = usePurchaseOrders();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedPo, setSelectedPo] = useState(null);

  const handleOpenModal = (mode, po = null) => {
    setModalMode(mode);
    setSelectedPo(po);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPo(null);
  };

  const renderContent = () => {
    if (!isLoading && filteredOrders.length === 0 && (search.poNumber || search.supplierId || search.status)) {
      return (
        <>
          <PurchaseOrderList orders={[]} allSuppliers={allSuppliers} onView={handleOpenModal} onEdit={handleOpenModal} onDelete={handleDelete} onReceive={handleReceive} />
          <Box textAlign="center" mt={5} p={3}>
            <Typography variant="h6" color="text.secondary">
              No purchase orders match your search.
            </Typography>
          </Box>
        </>
      );
    }
    
    if (!isLoading && filteredOrders.length === 0) {
      return (
        <Box textAlign="center" mt={8} p={4} sx={{ bgcolor: 'grey.100', borderRadius: 2 }}>
          <ShoppingBagIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" mb={2}>
            No Purchase Orders Yet
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Get started by creating your first purchase order.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal('create')}
          >
            Create Purchase Order
          </Button>
        </Box>
      );
    }
    
    return (
      <PurchaseOrderList
        isLoading={isLoading}
        orders={filteredOrders}
        allSuppliers={allSuppliers}
        onView={(po) => handleOpenModal('view', po)}
        onEdit={(po) => handleOpenModal('edit', po)}
        onDelete={handleDelete}
        onReceive={handleReceive}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ShoppingBagIcon color="primary" sx={{ fontSize: '2.5rem', mr: 1.5 }} />
        <Typography variant="h4" fontWeight={700}>
          Purchase Orders
        </Typography>
      </Box>

      {/* Always render filters */}
      <PurchaseOrderFilters
        search={search}
        setSearch={setSearch}
        allSuppliers={allSuppliers}
        onAddNew={() => handleOpenModal('create')}
      />

      {renderContent()}

      <PurchaseOrderModal
        open={modalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        selectedPo={selectedPo}
        onSubmit={handleCreateOrUpdate}
        allSuppliers={allSuppliers}
        showSnackbar={showSnackbar}
      />
    </Container>
  );
};

export default PurchaseOrders;