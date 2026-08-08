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
        <Box textAlign="center" mt={8} p={4} sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <ShoppingBagIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" color="text.primary" fontWeight={700} mb={1}>
            {t('purchaseOrdersPage.noOrders')}
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Get started by creating your first purchase order.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal('create')}
            sx={{ borderRadius: 2, fontWeight: 700 }}
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
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
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
          <Typography variant="h4" fontWeight={800} color="text.primary">
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
        <Dialog
          open={deleteDialog?.open || false}
          onClose={cancelDelete}
          PaperProps={{ sx: { borderRadius: 3, p: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>{t('purchaseOrdersPage.deleteOrder')}</DialogTitle>
          <DialogContent sx={{ color: 'text.primary' }}>
            Are you sure you want to delete this purchase order?
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={cancelDelete} color="inherit" sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} color="error" variant="contained" sx={{ fontWeight: 800, borderRadius: 2 }}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Submit PO confirmation dialog for Card */}
        <Dialog
          open={submitDialog}
          onClose={cancelCardSubmit}
          PaperProps={{ sx: { borderRadius: 3, p: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>{t('purchaseOrdersPage.title')}</DialogTitle>
          <DialogContent sx={{ color: 'text.primary' }}>
            Are you sure you want to submit this purchase order?
            <br />
            <Typography component="span" fontWeight="bold" color="warning.main">
              Once submitted, it cannot be edited.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={cancelCardSubmit} color="inherit" sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              onClick={confirmCardSubmit}
              color="primary"
              variant="contained"
              disabled={isSubmitting}
              sx={{ fontWeight: 800, borderRadius: 2 }}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default PurchaseOrders;