import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  fetchItems,
  createItem,
  updateItem,
  deleteItemVariant,
  deleteItemsBulk,
  fetchStock,
  fetchCategories,
  searchItemsPage,
} from '../../../services/api';
import { useShop } from '../../../context/ShopContext';

import { initialVariantState, initialItemFormData } from '../constants/initialStates';
import { itemSchemaFor, variantSchemaFor, validate } from '../validation/itemSchema';

export default function useItemsLogic() {
  const { t } = useTranslation();

  // Industry context comes from ShopContext — a single source of truth for the whole app.
  const { industryType, industryConfig } = useShop();
  const shopCategory = industryType || 'GENERAL';

  // ── Data States ────────────────────────────────────────
  const [allItems, setAllItems] = useState([]);
  const [itemsWithVariants, setItemsWithVariants] = useState([]);
  const [itemsWithoutVariants, setItemsWithoutVariants] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);

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

  // ── Bulk Selection ─────────────────────────────────────
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [openBulkDeleteConfirm, setOpenBulkDeleteConfirm] = useState(false);

  // ── Server-side pagination / search ────────────────────
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategoryId, setSearchCategoryId] = useState(null);
  const [rowCount, setRowCount] = useState(0);

  // ── Client-side stock filter (over current page) ───────
  // 'ALL' | 'IN_STOCK' | 'LOW' | 'OUT' | 'AWAITING'
  const [stockFilter, setStockFilter] = useState('ALL');

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

  const loadPage = useCallback(async () => {
    try {
      const res = await searchItemsPage({
        q: searchQuery || '',
        categoryId: searchCategoryId || undefined,
        page: paginationModel.page,
        size: paginationModel.pageSize,
      });
      const data = res?.data || {};
      const rows = Array.isArray(data.content) ? data.content : [];
      setItemsWithVariants(rows);
      setRowCount(typeof data.totalElements === 'number' ? data.totalElements : rows.length);
    } catch (err) {
      console.error('Server search failed:', err);
    }
  }, [searchQuery, searchCategoryId, paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    const t = setTimeout(() => { loadPage(); }, 250);
    return () => clearTimeout(t);
  }, [loadPage]);

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

  const validatePayload = async () => {
    const itemErr = await validate(itemSchemaFor(industryConfig), itemFormData);
    if (itemErr) {
      setDialogError(itemErr.message);
      return false;
    }
    const vSchema = variantSchemaFor(industryConfig);
    for (let i = 0; i < variantList.length; i++) {
      const vErr = await validate(vSchema, variantList[i]);
      if (vErr) {
        setDialogError(`Variant ${i + 1}: ${vErr.message}`);
        return false;
      }
    }
    return true;
  };

  const handleMultiStepSubmit = async () => {
    if (!(await validatePayload())) return;
    setIsSubmitting(true);
    try {
      await createItem(prepareFormData(false));
      showSnackbar('Item created successfully!', 'success');
      handleDialogClose();
      loadData();
      loadPage();
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
    if (!(await validatePayload())) return;
    setIsSubmitting(true);
    try {
      await updateItem(selectedItemId, prepareFormData(true));
      showSnackbar('Item updated successfully!', 'success');
      handleDialogClose();
      loadData();
      loadPage();
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

  const confirmBulkDelete = async () => {
    if (!selectedItemIds.length) {
      setOpenBulkDeleteConfirm(false);
      return;
    }
    try {
      const res = await deleteItemsBulk(selectedItemIds);
      const deleted = res?.data?.deleted ?? selectedItemIds.length;
      showSnackbar(`Deleted ${deleted} item${deleted === 1 ? '' : 's'}.`, 'success');
      setSelectedItemIds([]);
      setOpenBulkDeleteConfirm(false);
      loadData();
      loadPage();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete selected items.';
      showSnackbar(msg, 'error');
    }
  };

  const confirmDeleteVariant = async () => {
    try {
      await deleteItemVariant(selectedVariantId);
      showSnackbar('Variant deleted!', 'success');
      setOpenDeleteConfirm(false);
      setOpenViewVariantsDialog(false);
      loadData();
      loadPage();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete variant.';
      showSnackbar(msg, 'error');
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
    { field: 'name', headerName: t('itemsPage.columns.name'), flex: 1.4, minWidth: 180 },
    {
      field: 'sku',
      headerName: 'SKU',
      flex: 0.9,
      minWidth: 130,
      sortable: false,
      valueGetter: (params) => {
        const vs = params?.row?.variants || [];
        if (vs.length === 0) return '—';
        if (vs.length === 1) return vs[0].sku || '—';
        return `${vs[0].sku} +${vs.length - 1}`;
      },
    },
    { field: 'categoryName', headerName: t('itemsPage.columns.category'), flex: 1, minWidth: 130 },
    { field: 'brandName', headerName: t('itemsPage.columns.brand'), flex: 0.9, minWidth: 120 },
    {
      field: 'variants',
      headerName: 'Variants',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (params) => params?.row?.variants?.length || 0,
    },
    {
      field: 'priceRange',
      headerName: 'Price',
      width: 130,
      sortable: false,
      valueGetter: (params) => {
        const vs = params?.row?.variants || [];
        if (vs.length === 0) return { min: null, max: null, label: '—' };
        const prices = vs.map((v) => Number(v.pricePerUnit || 0)).filter((n) => !isNaN(n));
        if (prices.length === 0) return { min: null, max: null, label: '—' };
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;
        return { min, max, label: min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}` };
      },
    },
    {
      field: 'stockStatus',
      headerName: 'Stock',
      width: 130,
      sortable: false,
      valueGetter: (params) => {
        const variants = params?.row?.variants || [];
        if (variants.length === 0) return { label: 'No variants', level: 'empty', total: 0 };
        const total = variants.reduce((s, v) => s + Number(v.currentStock || 0), 0);
        const anyLow = variants.some((v) => {
          const cur = Number(v.currentStock || 0);
          const thr = Number(v.lowStockThreshold || 5);
          return cur > 0 && cur <= thr;
        });
        if (total === 0) return { label: 'Out', level: 'out', total };
        if (anyLow)     return { label: 'Low', level: 'low', total };
        return { label: 'In stock', level: 'ok', total };
      },
    },
    { field: 'actions', headerName: '', width: 100, sortable: false, filterable: false, disableColumnMenu: true },
  ], [t]);

  // Client-side stock filter applied over the current server page.
  // Server-side filter is a follow-up; for now the chips filter what's
  // already loaded, which is fine for the typical page size.
  const displayItems = useMemo(() => {
    if (stockFilter === 'ALL') return itemsWithVariants;
    return itemsWithVariants.filter((row) => {
      const variants = row.variants || [];
      if (stockFilter === 'AWAITING') return variants.length === 0;
      if (variants.length === 0) return false;
      const total = variants.reduce((s, v) => s + Number(v.currentStock || 0), 0);
      const anyLow = variants.some((v) => {
        const cur = Number(v.currentStock || 0);
        const thr = Number(v.lowStockThreshold || 5);
        return cur > 0 && cur <= thr;
      });
      if (stockFilter === 'OUT')      return total === 0;
      if (stockFilter === 'LOW')      return anyLow;
      if (stockFilter === 'IN_STOCK') return total > 0 && !anyLow;
      return true;
    });
  }, [itemsWithVariants, stockFilter]);

  return {
    // Data States
    loading, itemsWithVariants, itemsWithoutVariants, stockData, apiCategories, loadData,
    // Industry context (sourced from ShopContext)
    industryType, industryConfig, shopCategory,
    // Bulk selection
    selectedItemIds, setSelectedItemIds,
    openBulkDeleteConfirm, setOpenBulkDeleteConfirm, confirmBulkDelete,
    // Server-side pagination / search
    paginationModel, setPaginationModel,
    searchQuery, setSearchQuery,
    searchCategoryId, setSearchCategoryId,
    rowCount,
    loadPage,
    // Client-side stock filter over current page
    stockFilter, setStockFilter, displayItems,
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