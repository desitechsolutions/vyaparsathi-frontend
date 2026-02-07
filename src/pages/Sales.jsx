import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Box, Snackbar, Alert, CircularProgress, Divider, Chip, Container, 
  Typography, Paper, Button, Tooltip, Stack
} from '@mui/material';
import SalesTabs from '../components/Sales/SalesTabs';
import CustomerSection from '../components/Sales/CustomerSection';
import ItemSection from '../components/Sales/ItemSection';
import SalesSummary from '../components/Sales/SalesSummary';
import InvoiceModal from '../components/Sales/InvoiceModal';
import SalesHistory from '../components/Sales/SalesHistory';
import ReviewPaymentPage from '../components/Sales/ReviewPaymentPage';
import { buildSalePayload }  from '../utils/salesUtils';
import { 
  fetchCustomers, createSale, fetchItemVariants, createCustomer, 
  draftSale, getSaleById, completeDraftSale 
} from '../services/api';
import { useSearchParams } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const SIDEBAR_WIDTH = '280px'; 

const initialItem = {
  id: '', sku: '', qty: '', unitPrice: 0, itemName: '', description: '',
  color: [], size: [], brand: '', design: '', currentStock: 0,
};

const initialCustomer = {
  name: '', phone: '', addressLine1: '', addressLine2: '', city: '',
  state: '', postalCode: '', country: '', gstNumber: '', panNumber: '',
  notes: '', creditBalance: 0,
};

const initialFormData = {
  id: null, 
  customerId: '', items: [], totalAmount: 0, isGstRequired: 'no',
  discount: 0, paymentMethods: [{ method: 'Cash', amount: 0 }],
  remaining: 0, paymentStatus: 'Pending', deliveryRequired: false,
  deliveryAddress: '', deliveryCharge: 0, deliveryPaidBy: null,
  deliveryNotes: '', deliveryStatus: "PACKED",
};

const Sales = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [item, setItem] = useState(initialItem);
  const [customers, setCustomers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
const [urlParams, setUrlParams] = useSearchParams();
const tabParam = urlParams.get("tab");
const tabValue = tabParam === "history" ? 1 : 0;

  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState(initialCustomer);
  const [lastSaleId, setLastSaleId] = useState(null);
  const [lastInvoiceNo, setLastInvoiceNo] = useState(null);
  const [signedInvoiceUrl, setSignedInvoiceUrl] = useState(null);
  const hasShownMissingUrlWarning = useRef(false);
  const resumeId = urlParams.get('resumeId');

  const [searchParams, setSearchParams] = useState({
    name: '', sku: '', color: [], size: [], design: '',
    category: '', fabric: '', season: '', fit: '',
  });
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editIndex, setEditIndex] = useState(null);
  const [itemError, setItemError] = useState('');

  // --- RESUME DRAFT LOGIC ---
  const handleLoadDraft = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await getSaleById(id);
      const draft = res.data;

      const resumedItems = (draft.items || []).map(si => {
        const actualVariantId = si.id || si.itemId || si.itemVariantId || (si.itemVariant && si.itemVariant.id);
        const v = si.itemVariant || {};
        const itemDetail = v.item || {};
        
        return {
          id: actualVariantId ? Number(actualVariantId) : null,
          variantId: actualVariantId ? Number(actualVariantId) : null,
          saleItemId: si.saleItemId || si.id,
          sku: v.sku || '',
          qty: Number(si.qty || 0),
          unitPrice: Number(si.unitPrice || 0),
          itemName: itemDetail.name || v.itemName || 'Item',
          description: itemDetail.description || '',
          color: v.color || '',
          size: v.size || '',
          brand: itemDetail.brandName || v.brand || '',
          design: v.design || '',
          currentStock: Number(v.currentStock || 0),
          discount: Number(si.discount || 0)
        };
      });

      if (draft.customer) {
        setSelectedCustomer({
          value: draft.customer.id,
          label: `${draft.customer.name} | Phone: ${draft.customer.phone || 'N/A'}`,
          ...draft.customer
        });
      }

      setFormData(prev => ({
        ...prev,
        id: draft.id,
        customerId: draft.customer?.id || '',
        items: resumedItems,
        isGstRequired: draft.isGstRequired ? 'yes' : 'no',
        discount: draft.discount || 0,
        totalAmount: draft.totalAmount || 0,
        deliveryRequired: !!draft.delivery,
        deliveryAddress: draft.delivery?.deliveryAddress || '',
        deliveryCharge: draft.delivery?.deliveryCharge || '',
        deliveryStatus: draft.delivery?.deliveryStatus || 'PACKED',
        deliveryPaidBy : draft.delivery?.deliveryPaidBy || ''
      }));

      setShowReviewPage(false);
      setUrlParams({}); 
      setSnackbar({ open: true, message: `Draft ${draft.invoiceNo || 'Loaded'} successfully!`, severity: 'success' });

    } catch (err) {
      console.error("Resume Error:", err);
      setSnackbar({ open: true, message: 'Failed to load draft data.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [setUrlParams]);

  useEffect(() => {
    if (resumeId) handleLoadDraft(resumeId);
  }, [resumeId, handleLoadDraft]);

  useEffect(() => {
  if (!urlParams.get("tab")) {
    setUrlParams({ tab: "sale" }, { replace: true });
  }
}, []);
  const loadVariants = useCallback(() => {
    setLoading(true);
    fetchItemVariants({})
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setVariants(res.data.map((v) => ({
            value: v.id, 
            label: `${v.itemName} (${v.color}, ${v.size}) - SKU: ${v.sku}`, 
            ...v,
          })));
        } else { setVariants([]); }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to load items.', severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadVariants();
    setLoadingCustomers(true);
    fetchCustomers()
      .then((res) => {
        setCustomers(res.data.map((cust) => ({
          value: cust.id, 
          label: `${cust.name} | Phone: ${cust.phone || 'N/A'}`, 
          ...cust,
        })));
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to load customers.', severity: 'error' }))
      .finally(() => setLoadingCustomers(false));
  }, [loadVariants]);

  const handleCloseInvoiceModal = () => {
    setOpenInvoiceModal(false);
    setSignedInvoiceUrl(null);
    loadVariants();
  };

  // Memoized Search Options
  const uniqueNames = useMemo(() => [{ value: '', label: 'All Names' }, ...[...new Set(variants.map(v => v.itemName).filter(Boolean))].map(n => ({ value: n, label: n }))], [variants]);
  const uniqueSkus = useMemo(() => [{ value: '', label: 'All SKUs' }, ...[...new Set(variants.map(v => v.sku).filter(Boolean))].map(s => ({ value: s, label: s }))], [variants]);
  const uniqueColors = useMemo(() => [{ value: '', label: 'All Colors' }, ...[...new Set(variants.map(v => v.color).filter(Boolean))].map(c => ({ value: c, label: c }))], [variants]);
  const uniqueSizes = useMemo(() => [{ value: '', label: 'All Sizes' }, ...[...new Set(variants.map(v => v.size).filter(Boolean))].map(s => ({ value: s, label: s }))], [variants]);
  const uniqueDesigns = useMemo(() => [{ value: '', label: 'All Designs' }, ...[...new Set(variants.map(v => v.design).filter(Boolean))].map(d => ({ value: d, label: d }))], [variants]);
  const uniqueCategory = useMemo(() => [{ value: '', label: 'All Categories' }, ...[...new Set(variants.map(v => v.categoryName).filter(Boolean))].map(c => ({ value: c, label: c }))], [variants]);
  const uniqueFabrics = useMemo(() => [{ value: '', label: 'All Fabrics' }, ...[...new Set(variants.map(v => v.fabric).filter(Boolean))].map(f => ({ value: f, label: f }))], [variants]);
  const uniqueSeasons = useMemo(() => [{ value: '', label: 'All Seasons' }, ...[...new Set(variants.map(v => v.season).filter(Boolean))].map(s => ({ value: s, label: s }))], [variants]);
  const uniqueFits = useMemo(() => [{ value: '', label: 'All Fits' }, ...[...new Set(variants.map(v => v.fit).filter(Boolean))].map(f => ({ value: f, label: f }))], [variants]);

  const filteredVariants = useMemo(() => {
    return variants.filter(v => {
      if (searchParams.name && v.itemName !== searchParams.name) return false;
      if (searchParams.sku && v.sku !== searchParams.sku) return false;
      if (searchParams.color?.length > 0 && !searchParams.color.includes(v.color)) return false;
      if (searchParams.size?.length > 0 && !searchParams.size.includes(v.size)) return false;
      if (searchParams.design && v.design !== searchParams.design) return false;
      if (searchParams.category && v.categoryName !== searchParams.category) return false;
      if (searchParams.fabric && v.fabric !== searchParams.fabric) return false;
      if (searchParams.season && v.season !== searchParams.season) return false;
      if (searchParams.fit && v.fit !== searchParams.fit) return false;
      return true;
    });
  }, [variants, searchParams]);

  useEffect(() => {
    const newTotal = formData.items.reduce((sum, item) => sum + Number(item.qty) * item.unitPrice, 0);
    setFormData(prev => ({ ...prev, totalAmount: newTotal.toFixed(2) }));
  }, [formData.items]);

  const handleResetFilters = () => {
    setSearchParams({}); // Reset the URL/State params
    setSelectedVariant(null); // Reset the final select dropdown
    setItem({
      id: '', sku: '', qty: '', unitPrice: 0, itemName: '',
      description: '', color: '', size: '', brand: '', design: '', currentStock: 0,
    });
  };
      const isDeliveryValid = () => {
      // If delivery isn't checked, it's always "valid" to proceed
      if (!formData.deliveryRequired) return true;

      // If checked, ensure Address is not empty and "Paid By" is selected
      const hasAddress = formData.deliveryAddress?.trim().length > 0;
      const hasPaidBy = formData.deliveryPaidBy !== '' && formData.deliveryPaidBy !== null;

      return hasAddress && hasPaidBy;
    };
  const handleAddItem = () => {
    setItemError('');
    const quantity = Number(item.qty);
    if (!item.id || isNaN(quantity) || quantity <= 0) { setItemError('Invalid quantity.'); return; }

    const availableStock = item.currentStock || (variants.find(v => v.id === item.id)?.currentStock || 0);
    if (quantity > availableStock) {
      setItemError(`Stock Limit: Only ${availableStock} available.`);
      return;
    }

    let newItems;
    if (editIndex !== null) {
      newItems = [...formData.items];
      newItems[editIndex] = { ...item, qty: quantity };
    } else {
      const existingIdx = formData.items.findIndex(it => it.id === item.id);
      if (existingIdx !== -1) {
        newItems = [...formData.items];
        newItems[existingIdx].qty += quantity;
      } else {
        newItems = [...formData.items, { ...item, qty: quantity }];
      }
    }
    setFormData({ ...formData, items: newItems });
    setItem(initialItem); setSelectedVariant(null); setEditIndex(null);
  };

  const handleEditItem = (index) => {
    const editItem = formData.items[index];
    setItem({ ...editItem, qty: String(editItem.qty) });
    setSelectedVariant(variants.find(v => v.id === editItem.id) || null);
    setEditIndex(index);
  };

  const handleRemoveItem = (index) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const handleVariantSelect = (opt) => {
    if (opt) {
      setSelectedVariant(opt);
      setItem({
        ...initialItem, id: opt.id, sku: opt.sku, qty: '1', unitPrice: opt.pricePerUnit,
        itemName: opt.itemName, color: opt.color, size: opt.size, currentStock: opt.currentStock
      });
    }
  };

  const handleCustomerSelect = (opt) => {
    setSelectedCustomer(opt);
    setFormData(prev => ({ ...prev, customerId: opt?.value || '' }));
  };

  const handleSearchParamChange = (field, opt) => {
    const isArrayField = ['color', 'size'].includes(field);
    setSearchParams(prev => ({ ...prev, [field]: opt ? opt.value : (isArrayField ? [] : '') }));
  };

  const handleNewCustomer = async () => {
    try {
      const res = await createCustomer(newCustomerData);
      const newCust = { value: res.data.id, label: res.data.name, ...res.data };
      setCustomers([...customers, newCust]); setSelectedCustomer(newCust);
      setFormData(prev => ({ ...prev, customerId: res.data.id }));
      setOpenCustomerModal(false);
      setSnackbar({ open: true, message: 'Customer added!', severity: 'success' });
    } catch { setSnackbar({ open: true, message: 'Failed to add customer.', severity: 'error' }); }
  };

 const handleSaveDraft = async () => {
  setLoading(true);

  const payload = buildSalePayload(
    formData,
    selectedCustomer,
    [],          // no payments in draft
    "DRAFT"
  );

  try {
    const res = await draftSale(payload);
    setFormData(prev => ({ ...prev, id: res.data.id }));
    setSnackbar({ open: true, message: `Draft saved!`, severity: 'success' });
  } catch {
    setSnackbar({ open: true, message: 'Failed to save draft', severity: 'error' });
  } finally {
    setLoading(false);
  }
};

const handleSubmitSale = async (payload) => {
  setLoading(true);
  try {
    const res = payload.id
      ? await completeDraftSale(payload.id, payload)
      : await createSale(payload);

    setLastSaleId(res.data.id);
    setLastInvoiceNo(res.data.invoiceNo);
    setSignedInvoiceUrl(res.data.signedInvoiceUrl);

    setFormData(initialFormData);
    setSelectedCustomer(null);
    setShowReviewPage(false);
    setOpenInvoiceModal(true);
    setUrlParams({});

    setSnackbar({
      open: true,
      message: `Sale #${res.data.invoiceNo} completed!`,
      severity: 'success'
    });
  } catch (err) {
    setSnackbar({
      open: true,
      message: err.response?.data?.message || 'Error processing sale.',
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: '#f4f6f8', minHeight: '100vh', pb: 12 }}>
      <SalesTabs
        value={tabValue}
        onChange={(newValue) => {
          setUrlParams({ tab: newValue === 1 ? "history" : "sale" });
        }}
      />
      
      <SalesTabs.Panel value={tabValue} index={0}>
        {(loading || loadingCustomers) && !showReviewPage ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
        ) : !showReviewPage ? (
          <Container maxWidth="lg">
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #e0e4e8' }}>
              <CustomerSection
                customers={customers} selectedCustomer={selectedCustomer}
                formData={formData} setFormData={setFormData}
                newCustomerData={newCustomerData} setNewCustomerData={setNewCustomerData}
                handleCustomerSelect={handleCustomerSelect} handleNewCustomer={handleNewCustomer}
                openCustomerModal={openCustomerModal} setOpenCustomerModal={setOpenCustomerModal}
              />
            </Paper>

            <Divider sx={{ my: 3 }}>
              <Chip icon={<InventoryIcon />} label="Selection" color="primary" size="small" />
            </Divider>

            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #e0e4e8' }}>
              <ItemSection
                variants={filteredVariants} selectedVariant={selectedVariant}
                item={item} setItem={setItem} uniqueNames={uniqueNames} uniqueSkus={uniqueSkus}
                uniqueColors={uniqueColors} uniqueSizes={uniqueSizes} uniqueDesigns={uniqueDesigns}
                uniqueCategory={uniqueCategory} uniqueFabrics={uniqueFabrics}
                uniqueSeasons={uniqueSeasons} uniqueFits={uniqueFits}
                handleResetFilters={handleResetFilters}
                searchParams={searchParams} handleVariantSelect={handleVariantSelect}
                handleSearchParamChange={handleSearchParamChange} handleAddItem={handleAddItem}
                error={itemError} editIndex={editIndex}
                proceedDisabledTooltip="Please select a customer and add at least one item to the sale."
              />
            </Paper>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e0e4e8' }}>
              <SalesSummary
                handleSaveDraft={handleSaveDraft}
                formData={formData} 
                handleRemoveItem={handleRemoveItem}
                handleEditItem={handleEditItem} 
                loading={loading} 
                setFormData={setFormData}
                selectedCustomer={selectedCustomer} 
                setItem={setItem}
                // --- ADD THESE MISSING PROPS ---
                setShowReviewPage={setShowReviewPage}    // Function to show the review page
                handleCustomerSelect={handleCustomerSelect} // Function to reset/select customer
                setSelectedVariant={setSelectedVariant}  // Function to reset selected variant
                setSearchParams={setSearchParams}        // From useSearchParams hook
                proceedDisabledTooltip="Please select a customer and add items to proceed."
              />
            </Paper>
            {/* PROFESSIONAL STICKY ACTION BAR */}
            <Paper 
              elevation={10} 
              sx={{ 
                position: 'fixed', 
                bottom: 0, 
                // Aligns with your 240px Sidebar on desktop, full width on mobile
                left: { xs: 0, lg: '240px' }, 
                right: 0, 
                p: { xs: 1.5, md: 2 }, 
                bgcolor: 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(10px)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                zIndex: 1100, 
                borderTop: '1px solid #e0e6ed',
                boxShadow: '0 -10px 20px rgba(0,0,0,0.04)'
              }}
            >
              {/* Left Section: Stats */}
              <Stack direction="row" spacing={{ xs: 2, md: 4 }} alignItems="center">
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: -0.5, letterSpacing: 0.5 }}
                  >
                    ITEMS
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    {formData.items.length.toString().padStart(2, '0')}
                  </Typography>
                </Box>
                
                <Divider orientation="vertical" flexItem sx={{ height: 32, my: 'auto', borderColor: '#e2e8f0' }} />

                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: -0.5, letterSpacing: 0.5 }}
                  >
                    PAYABLE AMOUNT
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#1976d2' }}>
                    ₹{Number(formData.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Stack>

              {/* Right Section: Action Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Validation Warning for User */}
                {!formData.customerId && formData.items.length > 0 && (
                  <Typography 
                    variant="caption" 
                    color="error" 
                    sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}
                  >
                    Select customer to proceed
                  </Typography>
                )}

                <Tooltip title={
                  !formData.customerId ? "Please select a customer first" : 
                  !isDeliveryValid() ? "Please complete delivery details (Address & Paid By)" : ""

                }>
                  <span>
                    <Button 
                      variant="contained" 
                      size="large" 
                      endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ChevronRightIcon />}
                      disabled={formData.items.length === 0 || !formData.customerId || !isDeliveryValid() || loading}
                      onClick={() => setShowReviewPage(true)}
                      sx={{ 
                        px: { xs: 3, md: 6 }, 
                        py: 1.5,
                        borderRadius: '12px', 
                        fontWeight: 800,
                        fontSize: '1rem',
                        textTransform: 'none',
                        boxShadow: '0 4px 14px 0 rgba(25, 118, 210, 0.39)',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(25, 118, 210, 0.23)',
                          bgcolor: '#1565c0'
                        },
                        '&:disabled': {
                          bgcolor: '#e2e8f0',
                          color: '#94a3b8'
                        }
                      }}
                    >
                      {loading ? 'Processing...' : 'Proceed to Payment'}
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Paper>
          </Container>
        ) : (
          <ReviewPaymentPage
            formData={formData} selectedCustomer={selectedCustomer}
            onConfirm={handleSubmitSale} onSaveDraft={handleSaveDraft}
            onCancel={() => setShowReviewPage(false)}
            setError={msg => setSnackbar({ open: true, message: msg, severity: 'error' })}
            loading={loading}
          />
        )}

        <InvoiceModal
          open={openInvoiceModal} saleId={lastSaleId} 
          invoiceNo={lastInvoiceNo} signedInvoiceUrl={signedInvoiceUrl} 
          onClose={handleCloseInvoiceModal}
        />
      </SalesTabs.Panel>

      <SalesTabs.Panel value={tabValue} index={1}>
        <SalesHistory onResume={handleLoadDraft} />
      </SalesTabs.Panel>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Sales;