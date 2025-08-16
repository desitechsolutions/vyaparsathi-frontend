import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import SalesTabs from '../components/Sales/SalesTabs';
import CustomerSection from '../components/Sales/CustomerSection';
import ItemSection from '../components/Sales/ItemSection';
import SalesSummary from '../components/Sales/SalesSummary';
import InvoiceModal from '../components/Sales/InvoiceModal';
import SalesHistory from '../components/Sales/SalesHistory';
import { fetchCustomers, createSale, createCustomer, fetchItemVariants } from '../services/api';
import { pdfjs } from 'react-pdf';

// Use local worker file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'; // Ensure this file is in public/

const Sales = () => {
  const [formData, setFormData] = useState({
    customerId: '',
    items: [],
    totalAmount: 0,
    isGstRequired: 'no',
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

  useEffect(() => {
    fetchCustomers()
      .then((res) => {
        const formattedCustomers = res.data.map((cust) => ({
          value: cust.id,
          label: `${cust.name} (Address: ${cust.addressLine1 || 'N/A'}, Phone: ${cust.phone || 'N/A'}, GST: ${cust.gstNumber || 'N/A'})`,
          addressLine1: cust.addressLine1,
          phone: cust.phone,
          gstNumber: cust.gstNumber,
        }));
        setCustomers(formattedCustomers);
        console.log('Fetched Customers in Sales.jsx:', formattedCustomers); // Debug log
      })
      .catch((err) => console.error('Fetch Customers Error:', err));
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
    console.log('Selected Option in handleCustomerSelect:', selectedOption); // Debug log
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

  const handleSubmit = async () => {
    if (!formData.customerId || formData.items.length === 0) {
      setError('Please provide a customer and add at least one item.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const saleData = {
        customerId: formData.customerId,
        items: formData.items,
        paymentMethod: 'Cash',
        isGstRequired: formData.isGstRequired === 'yes',
      };
      const response = await createSale(saleData);
      console.log('Create Sale Response:', response.data); // Debug log
      setSalesHistory([...salesHistory, formData]);
      setFormData({
        customerId: '',
        items: [],
        totalAmount: 0,
        isGstRequired: 'no',
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
      // Validate and set invoicePdf
      if (response.data && response.data instanceof Uint8Array) {
        setInvoicePdf(response.data);
        console.log('Invoice PDF set as Uint8Array, length:', response.data.length);
      } else {
        console.error('Invalid invoicePdf format:', response.data);
        setInvoicePdf(null); // Fallback if invalid
      }
      setOpenInvoiceModal(true);
    } catch (err) {
      console.error('Create Sale Error:', err);
      setError('Failed to create sale.');
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('PDF Loaded Successfully, Num Pages:', numPages); // Debug log
    setNumPages(numPages);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f5f5f8', minHeight: '100vh' }}>
      <SalesTabs value={tabValue} onChange={setTabValue} />
      <SalesTabs.Panel value={tabValue} index={0}>
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
          handleSubmit={handleSubmit}
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