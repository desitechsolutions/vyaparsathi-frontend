import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
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

const Sales = () => {
  const [formData, setFormData] = useState({
    customerId: '',
    items: [],
    totalAmount: 0,
    isGstRequired: 'no',
    discount: 0,
    paymentMethods: [{ method: 'Cash', amount: 0 }],
    remaining: 0,
    paymentStatus: 'Pending',
  });
  const [item, setItem] = useState({
    id: '',
    sku: '',
    qty: 1,
    unitPrice: 0,
    itemName: '',
    description: '',
    color: '',
    size: '',
    design: '',
    currentStock: 0,
  });
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const [invoicePdf, setInvoicePdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [newCustomerData, setNewCustomerData] = useState({
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
  });
  const [searchParams, setSearchParams] = useState({
    name: '',
    sku: '',
    color: '',
    size: '',
    design: '',
    category: '',
  });
  const [uniqueNames, setUniqueNames] = useState([]);
  const [uniqueSkus, setUniqueSkus] = useState([]);
  const [uniqueColors, setUniqueColors] = useState([]);
  const [uniqueSizes, setUniqueSizes] = useState([]);
  const [uniqueDesigns, setUniqueDesigns] = useState([]);
  const [uniqueCategory, setUniqueCategory] = useState([]);
  const [showReviewPage, setShowReviewPage] = useState(false);

  useEffect(() => {
    fetchCustomers().then((res) =>
      setCustomers(
        res.data.map((cust) => ({
          value: cust.id,
          label: `${cust.name} (Address: ${cust.addressLine1 || 'N/A'}, Phone: ${cust.phone || 'N/A'}, GST: ${cust.gstNumber || 'N/A'})`,
          addressLine1: cust.addressLine1,
          phone: cust.phone,
          gstNumber: cust.gstNumber,
        }))
      )
    );
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(
      Object.entries(searchParams).filter(([key, value]) => value)
    );
    fetchItemVariants(params, 'http://localhost:8080/api/item-variants')
      .then((res) => {
        console.log('Variants API Response:', res.data);
        if (res.data && Array.isArray(res.data)) {
          const variantOptions = res.data.map((v) => ({
            value: v.id,
            label: `${v.itemName} (${v.color}, ${v.size}, ${v.design}) - SKU: ${v.sku}`,
            id: v.id,
            sku: v.sku,
            unitPrice: v.pricePerUnit,
            currentStock: v.currentStock || 0,
            itemName: v.itemName,
            description: v.description || '',
            color: v.color || '',
            size: v.size || '',
            design: v.design || '',
          }));
          setVariants(variantOptions);

          const names = [...new Set(res.data.map(v => v.itemName).filter(Boolean))];
          const skus = [...new Set(res.data.map(v => v.sku).filter(Boolean))];
          const colors = [...new Set(res.data.map(v => v.color).filter(Boolean))];
          const sizes = [...new Set(res.data.map(v => v.size).filter(Boolean))];
          const designs = [...new Set(res.data.map(v => v.design).filter(Boolean))];
          const categories = [...new Set(res.data.map(v => v.category).filter(Boolean))];

          setUniqueNames([{ value: '', label: 'All Names' }, ...names.map(n => ({ value: n, label: n }))]);
          setUniqueSkus([{ value: '', label: 'All SKUs' }, ...skus.map(s => ({ value: s, label: s }))]);
          setUniqueColors([{ value: '', label: 'All Colors' }, ...colors.map(c => ({ value: c, label: c }))]);
          setUniqueSizes([{ value: '', label: 'All Sizes' }, ...sizes.map(s => ({ value: s, label: s }))]);
          setUniqueDesigns([{ value: '', label: 'All Designs' }, ...designs.map(d => ({ value: d, label: d }))]);
          setUniqueCategory([{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c, label: c }))]);
        } else {
          setVariants([]);
          setUniqueNames([{ value: '', label: 'All Names' }]);
          setUniqueSkus([{ value: '', label: 'All SKUs' }]);
          setUniqueColors([{ value: '', label: 'All Colors' }]);
          setUniqueSizes([{ value: '', label: 'All Sizes' }]);
          setUniqueDesigns([{ value: '', label: 'All Designs' }]);
          setUniqueCategory([{ value: '', label: 'All Categories' }]);
        }
      })
      .catch((err) => {
        console.error('Error fetching variants:', err);
        setVariants([]);
        setUniqueNames([{ value: '', label: 'All Names' }]);
        setUniqueSkus([{ value: '', label: 'All SKUs' }]);
        setUniqueColors([{ value: '', label: 'All Colors' }]);
        setUniqueSizes([{ value: '', label: 'All Sizes' }]);
        setUniqueDesigns([{ value: '', label: 'All Designs' }]);
        setUniqueCategory([{ value: '', label: 'All Categories' }]);
      });
  }, [searchParams]);

  useEffect(() => {
    const newTotal = formData.items.reduce(
      (sum, currentItem) => sum + currentItem.qty * currentItem.unitPrice,
      0
    );
    setFormData((prevData) => ({
      ...prevData,
      totalAmount: newTotal.toFixed(2),
    }));
  }, [formData.items]);

  const handleAddItem = () => {
    if (!item.id || !item.qty || !item.unitPrice || item.qty > item.currentStock) {
      console.log(item.id, item.qty, item.unitPrice, item.currentStock);
      setError('Please select an item, specify quantity, and ensure stock is available.');
      return;
    }
    setFormData({
      ...formData,
      items: [...formData.items, item],
    });
    setItem({
      id: '',
      sku: '',
      qty: 1,
      unitPrice: 0,
      itemName: '',
      description: '',
      color: '',
      size: '',
      design: '',
      currentStock: 0,
    });
    setSelectedVariant(null);
    setError('');
  };

  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const handleVariantSelect = (selectedOption) => {
    if (selectedOption) {
      setSelectedVariant(selectedOption);
      setItem({
        id: selectedOption.id,
        sku: selectedOption.sku,
        qty: 1,
        unitPrice: selectedOption.unitPrice,
        itemName: selectedOption.itemName,
        description: selectedOption.description,
        color: selectedOption.color,
        size: selectedOption.size,
        design: selectedOption.design,
        currentStock: selectedOption.currentStock,
      });
    } else {
      setSelectedVariant(null);
      setItem({
        id: '',
        sku: '',
        qty: 1,
        unitPrice: 0,
        itemName: '',
        description: '',
        color: '',
        size: '',
        design: '',
        currentStock: 0,
      });
    }
  };

  const handleCustomerSelect = (selectedOption) => {
    console.log('Selected Option in handleCustomerSelect:', selectedOption);
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
    setSearchParams((prev) => ({
      ...prev,
      [field]: selectedOption?.value || '',
    }));
  };

  const handleNewCustomer = async () => {
    const res = await createCustomer(newCustomerData);
    const newCustomer = {
      value: res.data.id,
      label: `${res.data.name} (Address: ${res.data.addressLine1 || 'N/A'}, Phone: ${res.data.phone || 'N/A'}, GST: ${res.data.gstNumber || 'N/A'})`,
      addressLine1: res.data.addressLine1,
      phone: res.data.phone,
      gstNumber: res.data.gstNumber,
    };
    setCustomers([...customers, newCustomer]);
    setSelectedCustomer(newCustomer);
    setFormData((prevData) => ({ ...prevData, customerId: res.data.id }));
    setOpenCustomerModal(false);
    setNewCustomerData({
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
    });
  };

  const handleProceedToReview = () => {
    if (!formData.customerId || formData.items.length === 0) {
      setError('Please provide a customer and add at least one item.');
      return;
    }
    setShowReviewPage(true);
  };

  const handleSubmitSale = async (payload, discount, sendInvoice) => {
    setLoading(true);
    setError('');
    try {
      console.log('Received payload in handleSubmitSale:', payload); // Debug log
      const { sale, paymentDetails = [] } = payload; // Default to empty array if undefined
      if (!paymentDetails) {
        console.warn('paymentDetails is undefined, defaulting to empty array');
        paymentDetails = [];
      }
      const saleData = {
        customerId: sale.customerId,
        items: sale.items,
        totalAmount: parseFloat(sale.totalAmount), // Ensure numeric
        roundOff: 0, // Default, backend will adjust
        date: new Date().toISOString(), // Current date, adjust format if needed
        isGstRequired: sale.isGstRequired,
        discount: discount,
        paymentDetails: paymentDetails.map(pm => ({
          method: pm.method,
          amountPaid: pm.amountPaid,
        })),
      };

      const saleResponse = await createSale(saleData);
      console.log('Create Sale Response:', saleResponse.data);

      // Update sales history with computed values from backend response
      const totalPaid = paymentDetails.reduce((sum, pm) => sum + pm.amountPaid, 0);
      const remaining = parseFloat(sale.totalAmount) - totalPaid;
      const paymentStatus = remaining > 0 ? 'PARTIALLY_PAID' : 'PAID';
      setSalesHistory([...salesHistory, { ...saleData, paymentDetails, remaining: remaining.toFixed(2), paymentStatus }]);

      setFormData({
        customerId: '',
        items: [],
        totalAmount: 0,
        isGstRequired: 'no',
        discount: 0,
        paymentMethods: [{ method: 'Cash', amount: 0 }],
        remaining: 0,
        paymentStatus: 'Pending',
      });
      setSelectedCustomer(null);
      setSelectedVariant(null);
      setItem({
        id: '',
        sku: '',
        qty: 1,
        unitPrice: 0,
        itemName: '',
        description: '',
        color: '',
        size: '',
        design: '',
        currentStock: 0,
      });
      if (saleResponse.data && saleResponse.data instanceof Uint8Array) {
        setInvoicePdf(saleResponse.data);
        console.log('Invoice PDF set as Uint8Array, length:', saleResponse.data.length);
        if (sendInvoice) {
          console.log('Sending invoice to customer:', selectedCustomer?.phone || selectedCustomer?.addressLine1);
        }
      } else {
        console.error('Invalid invoicePdf format:', saleResponse.data);
        setInvoicePdf(null);
      }
      setShowReviewPage(false);
      setOpenInvoiceModal(true);
    } catch (err) {
      console.error('Create Sale Error:', err);
      setError('Failed to create sale.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    setSalesHistory([...salesHistory, { ...formData, status: 'Draft' }]);
    setShowReviewPage(false);
    setFormData({
      customerId: '',
      items: [],
      totalAmount: 0,
      isGstRequired: 'no',
      discount: 0,
      paymentMethods: [{ method: 'Cash', amount: 0 }],
      remaining: 0,
      paymentStatus: 'Pending',
    });
    setSelectedCustomer(null);
    setSelectedVariant(null);
    setItem({
      id: '',
      sku: '',
      qty: 1,
      unitPrice: 0,
      itemName: '',
      description: '',
      color: '',
      size: '',
      design: '',
      currentStock: 0,
    });
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('PDF Loaded Successfully, Num Pages:', numPages);
    setNumPages(numPages);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f5f5f8', minHeight: '100vh' }}>
      <SalesTabs value={tabValue} onChange={setTabValue} />
      <SalesTabs.Panel value={tabValue} index={0}>
        {!showReviewPage ? (
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
              variants={variants}
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
              error={error}
              setError={setError}
            />
            <SalesSummary
              formData={formData}
              handleRemoveItem={handleRemoveItem}
              handleProceedToReview={handleProceedToReview}
              loading={loading}
              error={error}
              setFormData={setFormData}
              selectedCustomer={selectedCustomer}
              selectedVariant={selectedVariant}
              setSelectedCustomer={setSelectedCustomer}
              setSelectedVariant={setSelectedVariant}
              setItem={setItem}
              setSearchParams={setSearchParams}
              item={item}
            />
          </>
        ) : (
          <ReviewPaymentPage
            formData={formData}
            selectedCustomer={selectedCustomer}
            onConfirm={handleSubmitSale}
            onSaveDraft={handleSaveDraft}
            onCancel={() => setShowReviewPage(false)}
            setError={setError}
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
        />
      </SalesTabs.Panel>
      <SalesTabs.Panel value={tabValue} index={1}>
        <SalesHistory salesHistory={salesHistory} />
      </SalesTabs.Panel>
    </Box>
  );
};

export default Sales;