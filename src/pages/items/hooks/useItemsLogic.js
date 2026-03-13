import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  fetchItems,
  createItem,
  updateItem,
  deleteItemVariant,
  fetchStock,
  fetchCategories,
} from '../../../services/api';

import { initialVariantState, initialItemFormData } from '../constants/initialStates';

export default function useItemsLogic() {
  const { t } = useTranslation();

  // ── Data States ────────────────────────────────────────
  const [allItems, setAllItems] = useState([]);
  const [itemsWithVariants, setItemsWithVariants] = useState([]);
  const [itemsWithoutVariants, setItemsWithoutVariants] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);

  // ── Industry Context State ──────────────────────────────
  // Detects shop type (CLOTHING, PHARMACY, etc.) for UI labels
  const [shopCategory, setShopCategory] = useState('CLOTHING');

  // ── UI / Loading States ────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [dialogError, setDialogError] = useState(null);

  // ── Dialog Control ─────────────────────────────────────
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openViewVariantsDialog, setOpenViewVariantsDialog] = useState(false);
  const [variantsToView, setVariantsToView] = useState({ name: '', variants: [] });
  const [selectedVariantId, setSelectedVariantId] = useState(null);

  // ── Duplicate Item Warning Dialog ──────────────────────
  const [duplicateWarning, setDuplicateWarning] = useState({
    open: false,
    existingItem: null,
    message: '',
  });

  // ── Form & Multi-step States ───────────────────────────
  const [step, setStep] = useState(0);
  const [itemFormData, setItemFormData] = useState(initialItemFormData);
  const [variantList, setVariantList] = useState([]);
  const [currentVariant, setCurrentVariant] = useState({ ...initialVariantState });
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);

  // ── Snackbar Helpers ───────────────────────────────────
  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleSnackbarClose = useCallback((event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // ── Data Loading ───────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, stockRes, categoriesRes] = await Promise.all([
        fetchItems(),
        fetchStock(),
        fetchCategories(),
      ]);

      const items = Array.isArray(itemsRes.data) ? itemsRes.data : [];
      setAllItems(items);
      setItemsWithVariants(items.filter((item) => item.variants?.length > 0));
      setItemsWithoutVariants(items.filter((item) => !item.variants?.length));

      setStockData(Array.isArray(stockRes.data) ? stockRes.data : []);
      
      const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
      setApiCategories(categories);

      // Detect Industry from Categories: Find the root industry category
      if (categories.length > 0) {
        const rootCat = categories.find(c => !c.parentId || c.parentName === null);
        if (rootCat) {
          setShopCategory(rootCat.name.toUpperCase());
        }
      }

    } catch (err) {
      console.error('Data fetch error:', err);
      showSnackbar('Failed to load data. Please check API service.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup Preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (currentVariant.photoPreviewUrl) {
        URL.revokeObjectURL(currentVariant.photoPreviewUrl);
      }
    };
  }, [currentVariant.photoPreviewUrl]);

  // ── Form Handlers ──────────────────────────────────────
  const handleCurrentVariantChange = (e) => {
    const { name, value } = e.target;
    setCurrentVariant((prev) => ({ ...prev, [name]: value }));
    setDialogError(null);
  };

  const handleCurrentVariantFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentVariant.photoPreviewUrl) URL.revokeObjectURL(currentVariant.photoPreviewUrl);

    const previewUrl = URL.createObjectURL(file);
    setCurrentVariant((prev) => ({
      ...prev,
      photoFile: file,
      photoPreviewUrl: previewUrl,
    }));
    setDialogError(null);
  };

  const addOrUpdateVariantToList = () => {
    if (!currentVariant.unit || !currentVariant.pricePerUnit) {
      setDialogError('Unit and Price per Unit are required.');
      return;
    }

    if (editingVariantIndex !== null) {
      setVariantList((prev) =>
        prev.map((v, idx) => (idx === editingVariantIndex ? { ...currentVariant } : v))
      );
      setEditingVariantIndex(null);
    } else {
      setVariantList((prev) => [...prev, { ...currentVariant, id: `local_${Date.now()}` }]);
    }

    setCurrentVariant({ ...initialVariantState });
    setDialogError(null);
  };

  const handleEditVariantInList = (index) => {
    setCurrentVariant({ ...variantList[index] });
    setEditingVariantIndex(index);
    setDialogError(null);
  };

  const handleDeleteVariantInList = (index) => {
    setVariantList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ── Submit Logic ───────────────────────────────────────
  const prepareFormData = (isUpdate = false) => {
    const formData = new FormData();
    const variantsPayload = variantList.map((variant, index) => {
      const { photoFile, photoPreviewUrl, id, photoUrl, ...rest } = variant;
      
      const cleanVariant = { ...rest };
      if (id && !String(id).startsWith('local_')) {
        cleanVariant.id = id;
      }

      if (photoFile) {
        formData.append(`variant_photo_${index}`, photoFile);
      }
      return cleanVariant;
    });

    const itemDto = { 
      ...(isUpdate && { id: selectedItemId }), 
      ...itemFormData, 
      variants: variantsPayload 
    };

    formData.append('itemDto', new Blob([JSON.stringify(itemDto)], { type: 'application/json' }));
    return formData;
  };

  const handleMultiStepSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createItem(prepareFormData(false));
      showSnackbar('Item created successfully!', 'success');
      handleDialogClose();
      loadData();
    } catch (err) {
      const serverMessage = err.response?.data?.message || '';
      // Check if backend says item with this brand already exists
      if (
        serverMessage.toLowerCase().includes('already exists') ||
        serverMessage.toLowerCase().includes('duplicate')
      ) {
        // Try to find the matching existing item in our loaded list
        const matchingItem = allItems.find(
          (i) =>
            i.name?.toLowerCase() === itemFormData.name?.toLowerCase() &&
            i.brandName?.toLowerCase() === itemFormData.brandName?.toLowerCase()
        );
        setDuplicateWarning({
          open: true,
          existingItem: matchingItem || null,
          message: serverMessage || 'An item with this name and brand already exists.',
        });
      } else {
        setDialogError(serverMessage || 'Failed to create item.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultiStepUpdate = async () => {
    setIsSubmitting(true);
    try {
      await updateItem(selectedItemId, prepareFormData(true));
      showSnackbar('Item updated successfully!', 'success');
      handleDialogClose();
      loadData();
    } catch (err) {
      setDialogError('Failed to update item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Action Handlers ────────────────────────────────────
  const handleAddItemClick = () => {
    handleDialogClose();
    setOpenAddDialog(true);
  };

  const handleManageItem = (itemId) => {
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;

    setItemFormData({
      name: item.name || '',
      description: item.description || '',
      categoryId: item.categoryId || '',
      brandName: item.brandName || '',
      attribute1: item.attribute1 || '',
      attribute2: item.attribute2 || '',
      drugSchedule: item.drugSchedule || '',
      requiresPrescription: !!item.requiresPrescription,
    });

    setVariantList(item.variants.map(v => ({
      ...v,
      photoUrl: v.photoPath,
      lowStockThreshold: v.lowStockThreshold || '5',
      batchNumber: v.batchNumber || '',
      manufacturingDate: v.manufacturingDate || '',
      expiryDate: v.expiryDate || '',
      mrp: v.mrp || '',
    })));

    setSelectedItemId(itemId);
    setOpenEditDialog(true);
  };

  const handleViewVariants = (item) => {
    setVariantsToView(item);
    setOpenViewVariantsDialog(true);
  };

  const handleDeleteVariant = (variantId) => {
    setSelectedVariantId(variantId);
    setOpenDeleteConfirm(true);
  };

  const confirmDeleteVariant = async () => {
    try {
      await deleteItemVariant(selectedVariantId);
      showSnackbar('Variant deleted!', 'success');
      setOpenDeleteConfirm(false);
      setOpenViewVariantsDialog(false);
      loadData();
    } catch (err) {
      showSnackbar('Failed to delete variant.', 'error');
    }
  };

  const handleDialogClose = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
    setStep(0);
    setItemFormData(initialItemFormData);
    setVariantList([]);
    setCurrentVariant(initialVariantState);
    setDialogError(null);
    setEditingVariantIndex(null);
    setSelectedItemId(null);
  };

  const handleDuplicateViewUpdate = (mode) => {
    const { existingItem } = duplicateWarning;
    setDuplicateWarning({ open: false, existingItem: null, message: '' });
    if (!existingItem) return;

    if (mode === 'update') {
      // Preserve any variants the user already added in the add-item flow.
      // Deep-copy each object so downstream mutations can't affect both arrays.
      const pendingVariants = variantList.map((v) => ({ ...v }));
      handleDialogClose();

      // Reload the existing item's data into the edit form
      const item = allItems.find((i) => i.id === existingItem.id);
      if (!item) return;
      setItemFormData({
        name: item.name || '',
        description: item.description || '',
        categoryId: item.categoryId || '',
        brandName: item.brandName || '',
        attribute1: item.attribute1 || '',
        attribute2: item.attribute2 || '',
        drugSchedule: item.drugSchedule || '',
        requiresPrescription: !!item.requiresPrescription,
      });
      const existingVariants = item.variants.map((v) => ({
        ...v,
        photoUrl: v.photoPath,
        lowStockThreshold: v.lowStockThreshold || '5',
        batchNumber: v.batchNumber || '',
        manufacturingDate: v.manufacturingDate || '',
        expiryDate: v.expiryDate || '',
        mrp: v.mrp || '',
      }));
      // Append user's pending variants (the ones they were adding) after existing ones
      setVariantList([...existingVariants, ...pendingVariants]);
      setSelectedItemId(existingItem.id);
      setOpenEditDialog(true);
    } else {
      // 'view' – open the view dialog WITHOUT closing the add-item dialog so that
      // closing the view dialog returns the user to their in-progress add form.
      handleViewVariants(existingItem);
    }
  };

  const closeDuplicateWarning = () => {
    setDuplicateWarning({ open: false, existingItem: null, message: '' });
  };

  const handleNext = () => {
    if (step === 0 && (!itemFormData.name || !itemFormData.categoryId)) {
      setDialogError('Name and Category are required.');
      return;
    }
    if (step === 1 && variantList.length === 0) {
      setDialogError('At least one variant is required.');
      return;
    }
    setStep((prev) => prev + 1);
    setDialogError(null);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const columns = useMemo(() => [
    { field: 'name', headerName: t('itemsPage.columns.name'), flex: 1.5 },
    { field: 'categoryName', headerName: t('itemsPage.columns.category'), flex: 1 },
    { field: 'brandName', headerName: t('itemsPage.columns.brand'), flex: 1 },
    {
      field: 'variants',
      headerName: t('itemsPage.columns.variants'),
      width: 110,
      renderCell: (params) => params.row.variants?.length || 0,
    },
    { field: 'actions', headerName: t('itemsPage.columns.actions'), width: 140, sortable: false },
  ], [t]);

  return {
    // Data States
    loading, itemsWithVariants, itemsWithoutVariants, stockData, apiCategories, shopCategory,
    // Dialog States
    openAddDialog, setOpenAddDialog, openEditDialog, setOpenEditDialog,
    openDeleteConfirm, setOpenDeleteConfirm, openViewVariantsDialog, setOpenViewVariantsDialog,
    // Duplicate warning
    duplicateWarning, handleDuplicateViewUpdate, closeDuplicateWarning,
    // Form States
    variantsToView, step, setStep, itemFormData, setItemFormData,
    variantList, setVariantList, currentVariant, setCurrentVariant,
    editingVariantIndex, setEditingVariantIndex, isSubmitting, dialogError, setDialogError,
    // Helpers
    snackbar, showSnackbar, handleSnackbarClose, handleDialogClose,
    handleAddItemClick, handleManageItem, handleViewVariants, handleDeleteVariant,
    confirmDeleteVariant, handleNext, handleBack, handleMultiStepSubmit, handleMultiStepUpdate,
    columns, handleCurrentVariantChange, handleCurrentVariantFileChange,
    addOrUpdateVariantToList, handleEditVariantInList, handleDeleteVariantInList,
  };
}