import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Button,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Tooltip,
  IconButton,
  Container,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  WarningAmber as WarningIcon,
  Add as AddIcon,
} from '@mui/icons-material';

import useItemsLogic from './items/hooks/useItemsLogic';
import CustomToolbar from './items/components/CustomToolbar';
import VariantDetailDisplay from './items/components/VariantDetailDisplay';
import ItemDetailsForm from './items/components/ItemDetailsForm';
import VariantFormFields from './items/components/VariantFormFields';
import ReviewStepContent from './items/components/ReviewStepContent';
import ItemsAwaitingVariants from './items/components/ItemsAwaitingVariants';

export default function ItemsPage() {
  const { t } = useTranslation();

  const {
    loading,
    itemsWithVariants,
    itemsWithoutVariants,
    stockData,
    apiCategories,
    openAddDialog,
    openEditDialog,
    openDeleteConfirm,
    openViewVariantsDialog,
    variantsToView,
    setOpenDeleteConfirm,
    setOpenViewVariantsDialog,
    step,
    setStep,
    itemFormData,
    setItemFormData,
    variantList,
    setVariantList,
    currentVariant,
    setCurrentVariant,
    editingVariantIndex,
    setEditingVariantIndex,
    isSubmitting,
    dialogError,
    setDialogError,
    snackbar,
    handleSnackbarClose,
    handleDialogClose,
    handleAddItemClick,
    handleManageItem,
    handleViewVariants,
    handleDeleteVariant,
    confirmDeleteVariant,
    handleNext,
    handleBack,
    handleMultiStepSubmit,
    handleMultiStepUpdate,
    handleCurrentVariantChange,
    handleCurrentVariantFileChange,
    addOrUpdateVariantToList,
    handleEditVariantInList,
    handleDeleteVariantInList,
    columns,
  } = useItemsLogic();

  const steps = [
    t('itemsPage.stepper.itemDetails'),
    t('itemsPage.stepper.addVariants'),
    t('itemsPage.stepper.reviewAndSave'),
  ];

  const finalColumns = useMemo(
    () => [
      ...columns.slice(0, -1),
      {
        ...columns[columns.length - 1],
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={t('itemsPage.actions.viewVariants')}>
              <IconButton
                size="small"
                sx={{ color: '#6366f1', bgcolor: '#6366f110', '&:hover': { bgcolor: '#6366f120' } }}
                onClick={() => handleViewVariants(params.row)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('itemsPage.actions.manageItem')}>
              <IconButton
                size="small"
                sx={{ color: '#0f172a', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                onClick={() => handleManageItem(params.row.id)}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [columns, t, handleViewVariants, handleManageItem]
  );

  const getStepContent = (currentStep) => {
    switch (currentStep) {
      case 0:
        return <ItemDetailsForm itemFormData={itemFormData} setItemFormData={setItemFormData} apiCategories={apiCategories} />;
      case 1:
        return (
          <VariantFormFields
            currentVariant={currentVariant}
            setCurrentVariant={setCurrentVariant}
            variantList={variantList}
            setVariantList={setVariantList}
            editingVariantIndex={editingVariantIndex}
            setEditingVariantIndex={setEditingVariantIndex}
            handleCurrentVariantChange={handleCurrentVariantChange}
            handleCurrentVariantFileChange={handleCurrentVariantFileChange}
            addOrUpdateVariantToList={addOrUpdateVariantToList}
            handleEditVariantInList={handleEditVariantInList}
            handleDeleteVariantInList={handleDeleteVariantInList}
          />
        );
      case 2:
        return <ReviewStepContent itemFormData={itemFormData} variantList={variantList} apiCategories={apiCategories} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 5 }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        
        {/* Page Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={900} color="#0f172a">
              {t('itemsPage.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your product catalog and variants
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddItemClick}
            sx={{ borderRadius: 2, px: 3, py: 1.2, fontWeight: 700, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}
          >
            {t('itemsPage.actions.addItem')}
          </Button>
        </Stack>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress thickness={5} size={50} />
          </Box>
        ) : (
          <>
            {/* Quick Stats Grid */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={4}>
                <StatCard 
                  icon={<InventoryIcon sx={{ color: '#6366f1' }} />} 
                  label="Total Items" 
                  value={itemsWithVariants.length} 
                  color="#6366f1" 
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard 
                  icon={<CategoryIcon sx={{ color: '#10b981' }} />} 
                  label="Categories" 
                  value={apiCategories.length} 
                  color="#10b981" 
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard 
                  icon={<WarningIcon sx={{ color: '#f59e0b' }} />} 
                  label="Awaiting Variants" 
                  value={itemsWithoutVariants.length} 
                  color="#f59e0b" 
                />
              </Grid>
            </Grid>

            {itemsWithoutVariants.length > 0 && (
              <Box mb={4}>
                <ItemsAwaitingVariants
                  itemsWithoutVariants={itemsWithoutVariants}
                  handleManageItem={handleManageItem}
                />
              </Box>
            )}

            <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <DataGrid
                rows={itemsWithVariants}
                columns={finalColumns}
                autoHeight
                getRowId={(row) => row.id}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                slots={{ toolbar: CustomToolbar }}
                slotProps={{ toolbar: { onAddItemClick: handleAddItemClick } }}
                sx={{
                  border: 0,
                  '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' },
                  '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9' },
                  '& .MuiDataGrid-cell:focus': { outline: 'none' },
                }}
              />
            </Paper>
          </>
        )}
      </Container>

      {/* Multi-Step Add/Edit Dialog */}
      <Dialog 
        open={openAddDialog || openEditDialog} 
        onClose={handleDialogClose} 
        fullWidth 
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ p: 3, fontWeight: 800, fontSize: '1.5rem' }}>
          {openAddDialog ? t('itemsPage.addDialogTitle') : t('itemsPage.editDialogTitle')}
        </DialogTitle>
        <Divider />
        
        <DialogContent sx={{ px: 4, py: 3 }}>
          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {dialogError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setDialogError(null)}>
              {dialogError}
            </Alert>
          )}

          <Box sx={{ minHeight: '300px' }}>
            {getStepContent(step)}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', gap: 1 }}>
          <Button onClick={handleDialogClose} disabled={isSubmitting} sx={{ fontWeight: 700, color: 'text.secondary' }}>
            {t('itemsPage.actions.cancel')}
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" disabled={step === 0 || isSubmitting} onClick={handleBack} sx={{ fontWeight: 700, borderRadius: 2 }}>
            {t('itemsPage.actions.back')}
          </Button>
          <Button
            variant="contained"
            onClick={
              step === steps.length - 1
                ? (openAddDialog ? handleMultiStepSubmit : handleMultiStepUpdate)
                : handleNext
            }
            disabled={isSubmitting}
            sx={{ fontWeight: 700, borderRadius: 2, px: 4 }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : step === steps.length - 1 ? (
              openAddDialog ? t('itemsPage.actions.save') : t('itemsPage.actions.update')
            ) : (
              t('itemsPage.actions.next')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{t('itemsPage.deleteDialogTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('itemsPage.deleteDialogText')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteConfirm(false)}>{t('itemsPage.actions.cancel')}</Button>
          <Button onClick={confirmDeleteVariant} color="error" variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}>
            {t('itemsPage.actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Variants Slider/Dialog */}
      <Dialog
        open={openViewVariantsDialog}
        onClose={() => setOpenViewVariantsDialog(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ p: 3, borderBottom: '1px solid #e2e8f0', fontWeight: 800 }}>
          {t('itemsPage.variant.reviewTitle')} — {variantsToView?.name || ''}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <VariantDetailDisplay
            item={variantsToView}
            stockData={stockData}
            onDeleteVariant={handleDeleteVariant}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button variant="outlined" onClick={() => setOpenViewVariantsDialog(false)} sx={{ fontWeight: 700, borderRadius: 2 }}>
            {t('itemsPage.actions.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Sub-component for Stats Cards
const StatCard = ({ icon, label, value, color }) => (
  <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: '20px !important' }}>
      <Box sx={{ bgcolor: `${color}10`, p: 2, borderRadius: 3, display: 'flex' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={900}>
          {value}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);