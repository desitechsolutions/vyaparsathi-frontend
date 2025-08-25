import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Snackbar, Alert, CircularProgress } from '@mui/material';
import SalesTabs from '../components/Sales/SalesTabs';
import CustomerSection from '../components/Sales/CustomerSection';
import ItemSection from '../components/Sales/ItemSection';
import SalesSummary from '../components/Sales/SalesSummary';
import InvoiceModal from '../components/Sales/InvoiceModal';
import SalesHistory from '../components/Sales/SalesHistory';
import ReviewPaymentPage from '../components/Sales/ReviewPaymentPage';
import { fetchCustomers, createSale, fetchItemVariants, createCustomer } from '../services/api';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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
  const [invoicePdf, setInvoicePdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [newCustomerData, setNewCustomerData] = useState(initialCustomer);
  const [searchParams, setSearchParams] = useState({
    name: '',
    sku: '',
    color: '',
    size: '',
    design: '',
    category: '',
  });
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editIndex, setEditIndex] = useState(null);

  // PATCH: Extract fetch logic to a function (useCallback for stable reference)
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

  // PATCH: use loadVariants on mount
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

  // PATCH: Handler to close invoice modal and refresh variants from server
  const handleCloseInvoiceModal = () => {
    setOpenInvoiceModal(false);
    loadVariants(); // <-- refresh variants after sale completes
  };

  // Unique filter options (memoized)
  const uniqueNames = useMemo(() => [{ value: '', label: 'All Names' }, ...[...new Set(variants.map(v => v.itemName).filter(Boolean))].map(n => ({ value: n, label: n }))], [variants]);
  const uniqueSkus = useMemo(() => [{ value: '', label: 'All SKUs' }, ...[...new Set(variants.map(v => v.sku).filter(Boolean))].map(s => ({ value: s, label: s }))], [variants]);
  const uniqueColors = useMemo(() => [{ value: '', label: 'All Colors' }, ...[...new Set(variants.map(v => v.color).filter(Boolean))].map(c => ({ value: c, label: c }))], [variants]);
  const uniqueSizes = useMemo(() => [{ value: '', label: 'All Sizes' }, ...[...new Set(variants.map(v => v.size).filter(Boolean))].map(s => ({ value: s, label: s }))], [variants]);
  const uniqueDesigns = useMemo(() => [{ value: '', label: 'All Designs' }, ...[...new Set(variants.map(v => v.design).filter(Boolean))].map(d => ({ value: d, label: d }))], [variants]);
  const uniqueCategory = useMemo(() => [{ value: '', label: 'All Categories' }, ...[...new Set(variants.map(v => v.category).filter(Boolean))].map(c => ({ value: c, label: c }))], [variants]);

  // Filtered variants (client-side filtering)
  const filteredVariants = useMemo(() => {
    return variants.filter(v =>
      (!searchParams.name || v.itemName === searchParams.name) &&
      (!searchParams.sku || v.sku === searchParams.sku) &&
      (!searchParams.color || v.color === searchParams.color) &&
      (!searchParams.size || v.size === searchParams.size) &&
      (!searchParams.design || v.design === searchParams.design) &&
      (!searchParams.category || v.category === searchParams.category)
    );
  }, [variants, searchParams]);

  // Debounced search param change
  const debouncedSetSearchParams = useMemo(
    () => debounce((field, value) => setSearchParams(prev => ({ ...prev, [field]: value })), 300),
    []
  );

  // Update totalAmount when items change
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
    const quantity = Number(item.qty);
    if (!item.id || !quantity || !item.unitPrice) {
      setSnackbar({ open: true, message: 'Please select an item and specify quantity.', severity: 'error' });
      return;
    }

    const uniqueKey = (it) => [it.id, it.size, it.color, it.brand, it.design].join('_');
    const key = uniqueKey(item);

    // Calculate total intended qty in this sale (sum of all matching items except the one being edited)
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

    // Find item's available stock (use item.currentStock, or from variants if needed)
    let availableStock = item.currentStock;
    if (!availableStock || isNaN(availableStock)) {
      const foundVariant = variants.find(v => v.id === item.id);
      availableStock = foundVariant ? foundVariant.currentStock : 0;
    }

    if (intendedQty > availableStock) {
      setSnackbar({
        open: true,
        message: `Cannot add more than available stock (${availableStock}). You already have ${existingQty} in this sale.`,
        severity: 'error',
      });
      return;
    }

    let newItems;
    if (editIndex !== null) {
      // Replace the item at editIndex
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
        qty: (editIndex !== null && prevItem.id === selectedOption.id) ? prevItem.qty : '',
        unitPrice: selectedOption.pricePerUnit,
        itemName: selectedOption.itemName,
        description: selectedOption.description,
        color: selectedOption.color,
        size: selectedOption.size,
        brand: selectedOption.brand || '',
        design: selectedOption.design,
        currentStock: selectedOption.currentStock,
      }));
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

  // FIX: Send correct paymentDetails fields to match PaymentDto in backend
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
          amount: pm.amount, // <-- CORRECT field for backend PaymentDto
          paymentMethod: pm.paymentMethod, // <-- CORRECT field for backend PaymentDto
          paymentDate: pm.paymentDate || new Date().toISOString(),
          reference: pm.reference || "",
          notes: pm.notes || "",
          transactionId: pm.transactionId || "",
          // DO NOT send sourceType/sourceId
        })),
      };
      const saleResponse = await createSale(saleData);
      const totalPaid = paymentDetails.reduce((sum, pm) => sum + (pm.amount || 0), 0);
      const remaining = parseFloat(sale.totalAmount) - totalPaid;
      const paymentStatus = remaining > 0 ? 'PARTIALLY_PAID' : 'PAID';
      setSalesHistory([...salesHistory, { ...saleData, paymentDetails, remaining: remaining.toFixed(2), paymentStatus }]);
      setFormData(initialFormData);
      setSelectedCustomer(null);
      setSelectedVariant(null);
      setItem(initialItem);
      setEditIndex(null);
      if (saleResponse.data && saleResponse.data instanceof Uint8Array) {
        setInvoicePdf(saleResponse.data);
        if (sendInvoice) {
          // Optionally send invoice to customer
        }
      } else {
        setInvoicePdf(null);
      }
      setShowReviewPage(false);
      setOpenInvoiceModal(true);
      setSnackbar({ open: true, message: 'Sale created successfully!', severity: 'success' });
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

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

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
              searchParams={searchParams}
              handleVariantSelect={handleVariantSelect}
              handleSearchParamChange={handleSearchParamChange}
              handleAddItem={handleAddItem}
              error={snackbar.open && snackbar.severity === 'error' ? snackbar.message : ''}
              setError={msg => setSnackbar({ open: true, message: msg, severity: 'error' })}
              editIndex={editIndex}
            />
            <SalesSummary
              formData={formData}
              handleRemoveItem={handleRemoveItem}
              handleEditItem={handleEditItem}
              handleProceedToReview={handleProceedToReview}
              loading={loading}
              error={snackbar.open && snackbar.severity === 'error' ? snackbar.message : ''}
              setFormData={setFormData}
              selectedCustomer={selectedCustomer}
              selectedVariant={selectedVariant}
              setSelectedCustomer={setSelectedCustomer}
              setSelectedVariant={setSelectedVariant}
              setItem={setItem}
              setSearchParams={setSearchParams}
              item={item}
              editIndex={editIndex}
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
          invoicePdf={invoicePdf}
          pageNumber={pageNumber}
          setPageNumber={setPageNumber}
          numPages={numPages}
          onDocumentLoadSuccess={onDocumentLoadSuccess}
          onClose={handleCloseInvoiceModal} // PATCH: use this handler!
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