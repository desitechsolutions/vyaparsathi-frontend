import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, Snackbar, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ShoppingBag as ShoppingBagIcon, Add as AddIcon } from '@mui/icons-material';

import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import PurchaseOrderFilters from '../components/po/PurchaseOrderFilters';
import PurchaseOrderList from '../components/po/PurchaseOrderList';
import PurchaseOrderModal from '../components/po/PurchaseOrderModal';

const PurchaseOrders = () => {
  const { t } = useTranslation();
  const {
    isLoading,
    filteredOrders,
    orders,
    allSuppliers,
    snackbar,
    search,
    setSearch,
    handleDelete,
    handleCreateOrUpdate,
    handleSubmitPO, // <-- Added
    handleSnackbarClose,
    refreshData,
    deleteDialog,
    confirmDelete,
    cancelDelete,
  } = usePurchaseOrders();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedPo, setSelectedPo] = useState(null);
  const [submitDialog, setSubmitDialog] = useState(false);
  const [poToSubmit, setPoToSubmit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const variantId = searchParams.get('variantId');
    const supplierId = searchParams.get('supplierId');

    if (variantId) {
      // We have a variantId, so open the create modal
      // We pass the IDs to the selectedPo state, which will then be passed to the modal
      setSelectedPo({
        initialVariantId: variantId,
        initialSupplierId: supplierId || null,
      });
      setModalMode('create');
      setModalOpen(true);

      // Clean up the URL so it doesn't trigger again on refresh
      searchParams.delete('variantId');
      searchParams.delete('supplierId');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on component mount

  const handleOpenModal = (mode, po = null) => {
    setModalMode(mode);
    setSelectedPo(po);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPo(null);
  };

  // Use React Router navigation for "Go to Receiving"
  const handleGoToReceiving = (poId) => {
    navigate(`/receiving/${poId}`);
  };

  // --- SUBMIT PO HANDLER for Card view ---
  const handleCardSubmit = (po) => {
    setPoToSubmit(po);
    setSubmitDialog(true);
  };

  const confirmCardSubmit = async () => {
    if (!poToSubmit) return;
    setIsSubmitting(true);
    await handleSubmitPO(poToSubmit.id);
    setIsSubmitting(false);
    setSubmitDialog(false);
    setPoToSubmit(null);
    refreshData();
  };

  const cancelCardSubmit = () => {
    setSubmitDialog(false);
    setPoToSubmit(null);
  };

  const renderContent = () => {
    if (!isLoading && filteredOrders.length === 0 && (search.poNumber || search.supplierId || search.status)) {
      return (
        <>
          <PurchaseOrderList
            orders={[]}
            allSuppliers={allSuppliers}
            onView={handleOpenModal}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            onGoToReceiving={handleGoToReceiving}
            onSubmit={handleCardSubmit} // <-- new prop
          />
          <Box textAlign="center" mt={5} p={3}>
            <Typography variant="h6" color="text.secondary">
              {t('purchaseOrdersPage.noOrders')}
            </Typography>
          </Box>
        </>
      );
    }

    if (!isLoading && orders.length === 0) {
      return (
        <Box textAlign="center" mt={8} p={4} sx={{ bgcolor: 'grey.100', borderRadius: 2 }}>
          <ShoppingBagIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" mb={2}>
            {t('purchaseOrdersPage.noOrders')}
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Get started by creating your first purchase order.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal('create')}
          >
            {t('purchaseOrdersPage.createOrder')}
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
        onGoToReceiving={handleGoToReceiving}
        onSubmit={handleCardSubmit} // <-- new prop
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, bgcolor: 'grey.50', minHeight: '100vh' }}>
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
          {t('purchaseOrdersPage.title')}
        </Typography>
      </Box>

      <PurchaseOrderFilters
        search={search}
        setSearch={setSearch}
        allSuppliers={allSuppliers}
        onAddNew={() => handleOpenModal('create')}
      />

      {renderContent()}

      {modalOpen && (
        <PurchaseOrderModal
          open={modalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedPo={selectedPo}
          onSubmit={handleCreateOrUpdate}
          allSuppliers={allSuppliers}
          showSnackbar={handleSnackbarClose}
          onSubmitPO={handleSubmitPO} // <-- for modal edit submit
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialog?.open || false} onClose={cancelDelete}>
        <DialogTitle>{t('purchaseOrdersPage.deleteOrder')}</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this purchase order?
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit PO confirmation dialog for Card */}
      <Dialog open={submitDialog} onClose={cancelCardSubmit}>
        <DialogTitle>{t('purchaseOrdersPage.title')}</DialogTitle>
        <DialogContent>
          Are you sure you want to submit this purchase order?
          <br />
          <strong>Once submitted, it cannot be edited.</strong>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelCardSubmit} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={confirmCardSubmit}
            color="primary"
            variant="contained"
            disabled={isSubmitting}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PurchaseOrders;