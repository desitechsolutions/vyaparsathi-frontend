import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Box, Snackbar, Alert, CircularProgress } from '@mui/material';
import SalesTabs from '../components/Sales/SalesTabs';
import CustomerSection from '../components/Sales/CustomerSection';
import ItemSection from '../components/Sales/ItemSection';
import SalesSummary from '../components/Sales/SalesSummary';
import InvoiceModal from '../components/Sales/InvoiceModal';
import SalesHistory from '../components/Sales/SalesHistory';
import ReviewPaymentPage from '../components/Sales/ReviewPaymentPage';
import { fetchCustomers, createSale, fetchItemVariants, createCustomer } from '../services/api';
import { useSearchParams } from 'react-router-dom';

// Utility: debounce
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const initialItem = {
  id: '',
  sku: '',
  qty: '', // allow string for better input UX
  unitPrice: 0,
  itemName: '',
  description: '',
  color: '',
  size: '',
  brand: '',
  design: '',
  currentStock: 0,
};

const initialCustomer = {
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  gstNumber: '',
  panNumber: '',
  notes: '',
  creditBalance: 0,
};

const initialFormData = {
  customerId: '',
  items: [],
  totalAmount: 0,
  isGstRequired: 'no',
  discount: 0,
  paymentMethods: [{ method: 'Cash', amount: 0 }],
  remaining: 0,
  paymentStatus: 'Pending',
  deliveryRequired: false,
    deliveryAddress: '',
    deliveryCharge: '',
    deliveryPaidBy: '',
    deliveryNotes: '',
    deliveryStatus: "PACKED",
};

const Sales = () => {
  // State
  const [formData, setFormData] = useState(initialFormData);
  const [item, setItem] = useState(initialItem);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState(initialCustomer);
  const [lastSaleId, setLastSaleId] = useState(null);
  const [lastInvoiceNo, setLastInvoiceNo] = useState(null);
  const [signedInvoiceUrl, setSignedInvoiceUrl] = useState(null);
  const hasShownMissingUrlWarning = useRef(false);

  const [searchParams, setSearchParams] = useState({
    name: '',
    sku: '',
    color: '',
    size: '',
    design: '',
    category: '',
    fabric: '',
    season: '',
    fit: '',
  });
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editIndex, setEditIndex] = useState(null);
  const [itemError, setItemError] = useState('');

  const loadVariants = useCallback(() => {
    setLoading(true);
    fetchItemVariants({}, 'http://localhost:8080/api/item-variants')
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setVariants(res.data.map((v) => ({
            value: v.id,
            label: `${v.itemName} (${v.color}, ${v.size}, ${v.brand ? v.brand + ', ' : ''}${v.design}) - SKU: ${v.sku}`,
            ...v,
          })));
        } else {
          setVariants([]);
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to load items.', severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const [urlParams] = useSearchParams();

  useEffect(() => {
    const tab = urlParams.get('tab');
    if (tab === 'history') {
      setTabValue(1);
    } else {
      setTabValue(0);
    }
  }, [urlParams]);

  useEffect(() => {
  if (openInvoiceModal && !signedInvoiceUrl && !hasShownMissingUrlWarning.current) {
    setSnackbar({
      open: true,
      message: 'Signed invoice URL not available. Please try creating the sale again.',
      severity: 'warning'
    });
    hasShownMissingUrlWarning.current = true;
  }
}, [openInvoiceModal, signedInvoiceUrl]);

  useEffect(() => {
    loadVariants();
    setLoadingCustomers(true);
    fetchCustomers()
      .then((res) => {
        setCustomers(
          res.data.map((cust) => ({
            value: cust.id,
            label: `${cust.name} (Address: ${cust.addressLine1 || 'N/A'}, Phone: ${cust.phone || 'N/A'}, GST: ${cust.gstNumber || 'N/A'})`,
            ...cust,
          }))
        );
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to load customers.', severity: 'error' }))
      .finally(() => setLoadingCustomers(false));
  }, [loadVariants]);

  const handleCloseInvoiceModal = () => {
    setOpenInvoiceModal(false);
    setSignedInvoiceUrl(null);
    loadVariants();
  };

  // Unique filter options (memoized)
  const uniqueNames = useMemo(() => [{ value: '', label: 'All Names' }, ...[...new Set(variants.map(v => v.itemName).filter(Boolean))].map(n => ({ value: n, label: n }))], [variants]);
  const uniqueSkus = useMemo(() => [{ value: '', label: 'All SKUs' }, ...[...new Set(variants.map(v => v.sku).filter(Boolean))].map(s => ({ value: s, label: s }))], [variants]);
  const uniqueColors = useMemo(() => [{ value: '', label: 'All Colors' }, ...[...new Set(variants.map(v => v.color).filter(Boolean))].map(c => ({ value: c, label: c }))], [variants]);
  const uniqueSizes = useMemo(() => [{ value: '', label: 'All Sizes' }, ...[...new Set(variants.map(v => v.size).filter(Boolean))].map(s => ({ value: s, label: s }))], [variants]);
  const uniqueDesigns = useMemo(() => [{ value: '', label: 'All Designs' }, ...[...new Set(variants.map(v => v.design).filter(Boolean))].map(d => ({ value: d, label: d }))], [variants]);
  const uniqueCategory = useMemo(() => [{ value: '', label: 'All Categories' }, ...[...new Set(variants.map(v => v.categoryName).filter(Boolean))].map(c => ({ value: c, label: c }))], [variants]);
  const uniqueFabrics = useMemo(() => [{ value: '', label: 'All Fabrics' }, ...[...new Set(variants.map(v => v.fabric).filter(Boolean))].map(f => ({ value: f, label: f }))], [variants]);
  const uniqueSeasons = useMemo(() => [{ value: '', label: 'All Seasons' }, ...[...new Set(variants.map(v => v.season).filter(Boolean))].map(s => ({ value: s, label: s }))], [variants]);
  const uniqueFits = useMemo(() => [{ value: '', label: 'All Fits' }, ...[...new Set(variants.map(v => v.fit).filter(Boolean))].map(f => ({ value: f, label: f }))], [variants]);

  // Filtered variants (client-side filtering)
  const filteredVariants = useMemo(() => {
    return variants.filter(v =>
      (!searchParams.name || v.itemName === searchParams.name) &&
      (!searchParams.sku || v.sku === searchParams.sku) &&
      (!searchParams.color || v.color === searchParams.color) &&
      (!searchParams.size || v.size === searchParams.size) &&
      (!searchParams.design || v.design === searchParams.design) &&
      (!searchParams.category || v.categoryName === searchParams.category) &&
      (!searchParams.fabric || v.fabric === searchParams.fabric) &&
      (!searchParams.season || v.season === searchParams.season) &&
      (!searchParams.fit || v.fit === searchParams.fit)
    );
  }, [variants, searchParams]);

  const debouncedSetSearchParams = useMemo(
    () => debounce((field, value) => setSearchParams(prev => ({ ...prev, [field]: value })), 300),
    []
  );

  useEffect(() => {
    const newTotal = formData.items.reduce(
      (sum, currentItem) => sum + Number(currentItem.qty) * currentItem.unitPrice,
      0
    );
    setFormData((prevData) => ({
      ...prevData,
      totalAmount: newTotal.toFixed(2),
    }));
  }, [formData.items]);

  // Handlers
  const handleAddItem = () => {
    setItemError('');
    const quantity = Number(item.qty);
    if (!item.id || !item.unitPrice) {
      setItemError('Please select an item.');
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      setItemError('Please specify a valid quantity greater than 0.');
      return;
    }

    const uniqueKey = (it) => [it.id, it.size, it.color, it.brand, it.design].join('_');
    const key = uniqueKey(item);

    let existingQty = 0;
    if (editIndex === null) {
      existingQty = formData.items
        .filter(it => uniqueKey(it) === key)
        .reduce((sum, it) => sum + Number(it.qty), 0);
    } else {
      existingQty = formData.items
        .filter((it, idx) => uniqueKey(it) === key && idx !== editIndex)
        .reduce((sum, it) => sum + Number(it.qty), 0);
    }
    const intendedQty = existingQty + quantity;

    let availableStock = item.currentStock;
    if (!availableStock || isNaN(availableStock)) {
      const foundVariant = variants.find(v => v.id === item.id);
      availableStock = foundVariant ? foundVariant.currentStock : 0;
    }

    if (intendedQty > availableStock) {
      setItemError(`Cannot add more than available stock (${availableStock}). You already have ${existingQty} in this sale.`);
      return;
    }

    let newItems;
    if (editIndex !== null) {
      newItems = [...formData.items];
      newItems[editIndex] = { ...item, qty: quantity };
    } else {
      const existingIndex = formData.items.findIndex(
        (it) => uniqueKey(it) === key
      );
      if (existingIndex !== -1) {
        newItems = [...formData.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          qty: Number(newItems[existingIndex].qty) + quantity
        };
      } else {
        newItems = [...formData.items, { ...item, qty: quantity }];
      }
    }
    setFormData({ ...formData, items: newItems });
    setItem(initialItem);
    setSelectedVariant(null);
    setEditIndex(null);
  };

  const handleEditItem = (index) => {
    const editItem = formData.items[index];
    setItem({ ...editItem, qty: String(editItem.qty) });
    setSelectedVariant(
      variants.find(
        v =>
          v.id === editItem.id &&
          v.size === editItem.size &&
          v.color === editItem.color &&
          v.brand === editItem.brand &&
          v.design === editItem.design
      ) || null
    );
    setEditIndex(index);
    setItemError('');
  };

  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
    if (editIndex === index) {
      setItem(initialItem);
      setSelectedVariant(null);
      setEditIndex(null);
    }
  };

  const handleVariantSelect = (selectedOption) => {
    if (selectedOption) {
      setSelectedVariant(selectedOption);
      setItem((prevItem) => ({
        id: selectedOption.id,
        sku: selectedOption.sku,
        qty: (editIndex !== null && prevItem.id === selectedOption.id) ? prevItem.qty : '1',
        unitPrice: selectedOption.pricePerUnit,
        itemName: selectedOption.itemName,
        description: selectedOption.description,
        color: selectedOption.color,
        size: selectedOption.size,
        brand: selectedOption.brand || '',
        design: selectedOption.design,
        currentStock: selectedOption.currentStock,
      }));
      setItemError('');
    } else {
      setSelectedVariant(null);
      setItem(initialItem);
    }
  };

  const handleCustomerSelect = (selectedOption) => {
    setSelectedCustomer(selectedOption);
    setFormData((prevData) => ({
      ...prevData,
      customerId: selectedOption?.value || '',
    }));
    setNewCustomerData((prev) => ({
      ...prev,
      addressLine1: selectedOption?.addressLine1 || '',
      phone: selectedOption?.phone || '',
      gstNumber: selectedOption?.gstNumber || '',
    }));
  };

  const handleSearchParamChange = (field, selectedOption) => {
    debouncedSetSearchParams(field, selectedOption?.value || '');
  };

  const handleNewCustomer = async () => {
    try {
      const res = await createCustomer(newCustomerData);
      const newCustomer = {
        value: res.data.id,
        label: `${res.data.name} (Address: ${res.data.addressLine1 || 'N/A'}, Phone: ${res.data.phone || 'N/A'}, GST: ${res.data.gstNumber || 'N/A'})`,
        ...res.data,
      };
      setCustomers([...customers, newCustomer]);
      setSelectedCustomer(newCustomer);
      setFormData((prevData) => ({ ...prevData, customerId: res.data.id }));
      setOpenCustomerModal(false);
      setNewCustomerData(initialCustomer);
      setSnackbar({ open: true, message: 'Customer added successfully!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to add customer.', severity: 'error' });
    }
  };

  const handleProceedToReview = () => {
    if (!formData.customerId || formData.items.length === 0) {
      setSnackbar({ open: true, message: 'Please provide a customer and add at least one item.', severity: 'error' });
      return;
    }
    setShowReviewPage(true);
  };

  const handleSubmitSale = async (payload, discount, sendInvoice) => {
    setLoading(true);
    try {
      const { sale, paymentDetails = [] } = payload;
      const saleData = {
        customerId: sale.customerId,
        items: sale.items,
        totalAmount: parseFloat(sale.totalAmount),
        roundOff: 0,
        date: new Date().toISOString(),
        isGstRequired: sale.isGstRequired,
        discount: discount,
        paymentDetails: paymentDetails.map(pm => ({
          amount: pm.amount,
          paymentMethod: pm.paymentMethod,
          paymentDate: pm.paymentDate || new Date().toISOString(),
          reference: pm.reference || "",
          notes: pm.notes || "",
          transactionId: pm.transactionId || "",
        })),
        delivery: formData.deliveryRequired
          ? {
              deliveryAddress: formData.deliveryAddress,
              deliveryCharge: formData.deliveryCharge ? parseFloat(formData.deliveryCharge) : 0,
              deliveryPaidBy: formData.deliveryPaidBy,
              deliveryStatus: "PACKED",
              deliveryNotes: formData.deliveryNotes,
            }
          : null,
      };
      const saleResponse = await createSale(saleData);
      const { id: saleId, invoiceNo, signedInvoiceUrl } = saleResponse?.data || {};
      console.log('Signed Invoice URL received:', signedInvoiceUrl);
      if (!signedInvoiceUrl) {
      setSnackbar({
        open: true,
        message: 'Warning: Signed invoice URL not returned from server.',
        severity: 'warning'
      });
    }
      setLastSaleId(saleId);
      setLastInvoiceNo(invoiceNo);
      setSignedInvoiceUrl(signedInvoiceUrl);
      setTimeout(() => {
      setOpenInvoiceModal(true);
      }, 0);
      const totalPaid = paymentDetails.reduce((sum, pm) => sum + (pm.amount || 0), 0);
      const remaining = parseFloat(sale.totalAmount) - totalPaid;
      const paymentStatus = remaining > 0 ? 'PARTIALLY_PAID' : 'PAID';
      setSalesHistory([...salesHistory, { ...saleData, paymentDetails, remaining: remaining.toFixed(2), paymentStatus }]);
      setFormData(initialFormData);
      setSelectedCustomer(null);
      setSelectedVariant(null);
      setItem(initialItem);
      setEditIndex(null);
      
      setShowReviewPage(false);
      setOpenInvoiceModal(true);
      setSnackbar({
        open: true,
        message: `Sale created successfully! Invoice #${invoiceNo || '—'}`,
        severity: 'success'
      });
    } catch {
      setSnackbar({ open: true, message: 'Failed to create sale.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    setSalesHistory([...salesHistory, { ...formData, status: 'Draft' }]);
    setShowReviewPage(false);
    setFormData(initialFormData);
    setSelectedCustomer(null);
    setSelectedVariant(null);
    setItem(initialItem);
    setEditIndex(null);
    setSnackbar({ open: true, message: 'Draft saved.', severity: 'info' });
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f5f5f8', minHeight: '100vh' }}>
      <SalesTabs value={tabValue} onChange={setTabValue} />
      <SalesTabs.Panel value={tabValue} index={0}>
        {(loading || loadingCustomers) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : !showReviewPage ? (
          <>
            <CustomerSection
              customers={customers}
              selectedCustomer={selectedCustomer}
              formData={formData}
              setFormData={setFormData}
              newCustomerData={newCustomerData}
              setNewCustomerData={setNewCustomerData}
              handleCustomerSelect={handleCustomerSelect}
              handleNewCustomer={handleNewCustomer}
              openCustomerModal={openCustomerModal}
              setOpenCustomerModal={setOpenCustomerModal}
            />
            <ItemSection
              variants={filteredVariants}
              selectedVariant={selectedVariant}
              item={item}
              setItem={setItem}
              uniqueNames={uniqueNames}
              uniqueSkus={uniqueSkus}
              uniqueColors={uniqueColors}
              uniqueSizes={uniqueSizes}
              uniqueDesigns={uniqueDesigns}
              uniqueCategory={uniqueCategory}
              uniqueFabrics={uniqueFabrics}
              uniqueSeasons={uniqueSeasons}
              uniqueFits={uniqueFits}
              searchParams={searchParams}
              handleVariantSelect={handleVariantSelect}
              handleSearchParamChange={handleSearchParamChange}
              handleAddItem={handleAddItem}
              error={itemError}
              setError={setItemError}
              editIndex={editIndex}
            />
            <SalesSummary
              formData={formData}
              handleRemoveItem={handleRemoveItem}
              handleEditItem={handleEditItem}
              handleProceedToReview={handleProceedToReview}
              loading={loading}
              setFormData={setFormData}
              selectedCustomer={selectedCustomer}
              selectedVariant={selectedVariant}
              setSelectedCustomer={setSelectedCustomer}
              setSelectedVariant={setSelectedVariant}
              setItem={setItem}
              setSearchParams={setSearchParams}
              item={item}
              editIndex={editIndex}
              proceedDisabledTooltip="Please select a customer and add at least one item to the sale."
            />
          </>
        ) : (
          <ReviewPaymentPage
            formData={formData}
            selectedCustomer={selectedCustomer}
            onConfirm={handleSubmitSale}
            onSaveDraft={handleSaveDraft}
            onCancel={() => setShowReviewPage(false)}
            setError={msg => setSnackbar({ open: true, message: msg, severity: 'error' })}
            loading={loading}
          />
        )}
        <InvoiceModal
          open={openInvoiceModal}
          setOpen={setOpenInvoiceModal}
          saleId={lastSaleId}
          invoiceNo={lastInvoiceNo}
          signedInvoiceUrl={signedInvoiceUrl}
          onClose={handleCloseInvoiceModal}
        />
      </SalesTabs.Panel>
      <SalesTabs.Panel value={tabValue} index={1}>
        <SalesHistory salesHistory={salesHistory} />
      </SalesTabs.Panel>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Sales;