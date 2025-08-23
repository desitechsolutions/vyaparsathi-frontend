import React, { useState, useEffect } from "react";
import {
  List,
  ListItem,
  Typography,
  IconButton,
  Divider,
  Button,
  Box,
  TextField,
  InputAdornment,
  Grid,
  Modal,
  CircularProgress,
  Autocomplete,
  Tooltip,
  InputLabel,
  MenuItem,
  Select,
  FormControl,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingBag as ShoppingBagIcon,
  NoteAdd as NoteAddIcon,
} from "@mui/icons-material";
import { styled } from "@mui/system";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  receivePurchaseOrder,
  getSuppliers,
  fetchItemVariants,
} from "../services/api";

// --- Styled Modal ---
const StyledModal = styled(Modal)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(5px)",
}));

const ModalContent = styled(Box)(({ theme }) => ({
  backgroundColor: "#fff",
  borderRadius: "12px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: "3rem",
  width: "90%",
  maxWidth: "700px",
  maxHeight: "90vh",
  overflowY: "auto",
  position: "relative",
}));

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selectedPo, setSelectedPo] = useState(null);
  const [formPo, setFormPo] = useState({
    poNumber: "",
    supplierId: null,
    orderDate: "",
    expectedDeliveryDate: "",
    totalAmount: "",
    items: [{ id: Date.now(), itemVariantId: "", quantity: "", unitCost: "" }],
    notes: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [search, setSearch] = useState({
    poNumber: "",
    supplierId: "",
    status: "",
  });

  // Item variant autocomplete (filtered as you type)
  const [itemVariantOptions, setItemVariantOptions] = useState({});
  const [itemVariantLoading, setItemVariantLoading] = useState(false);

  // --- Fetch initial data ---
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line
  }, []);

  const fetchAllData = async () => {
    console.log("fetchAllData called");
    setIsLoading(true);
    try {
      const [ordersData, suppliersData] = await Promise.all([
        getPurchaseOrders(),
        getSuppliers(),
      ]);
      console.log("API suppliersData", suppliersData);
      setOrders(ordersData || []);
      const suppliers = suppliersData.data || suppliersData || []; // Handle wrapped data
      console.log("Fetched suppliers:", suppliers); // Debug log
      setAllSuppliers(Array.isArray(suppliers) ? suppliers : []);
      if (!ordersData || (Array.isArray(ordersData) && ordersData.length === 0)) {
        setSnackbarMsg("No purchase orders found.");
        setSnackbarSeverity("info");
        setSnackbarOpen(true);
      }
    } catch (error) {
        console.error("fetchAllData error", error);
      setErrorMessage("Failed to fetch PO data.");
      setSnackbarMsg("Error fetching purchase orders.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const preloadVariants = async () => {
    try {
      const res = await fetchItemVariants({ search: "" });
      if (res.data && res.data.length > 0) {
        setItemVariantOptions((prev) => ({
          ...prev,
          0: res.data || res,
        }));
      }
    } catch (e) {
      console.error("Failed to preload item variants", e);
    }
  };

  useEffect(() => {
    if (successMessage) {
      setSnackbarMsg(successMessage);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    }
    if (errorMessage) {
      setSnackbarMsg(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  }, [successMessage, errorMessage]);

  // --- Modal Handlers ---
  const handleOpenModal = (mode, po = null) => {
    setModalMode(mode);
    if (mode === "create") {
      setFormPo({
        poNumber: "",
        supplierId: null,
        orderDate: "",
        expectedDeliveryDate: "",
        totalAmount: "",
        items: [{ id: Date.now(), itemVariantId: "", quantity: "", unitCost: "" }],
        notes: "",
      });
      setSelectedPo(null);
    } else if (po) {
      setSelectedPo(po);
      setFormPo({
        ...po,
        supplierId: po.supplierId ? String(po.supplierId) : null,
        orderDate: po.orderDate?.split("T")[0] || "",
        expectedDeliveryDate: po.expectedDeliveryDate?.split("T")[0] || "",
        totalAmount: Number(po.totalAmount).toFixed(2),
        notes: po.notes || "",
      });
    }
    setFormErrors({});
    setModalOpen(true);
    if (mode === "create") preloadVariants(); // Load variants only on create
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPo(null);
  };

  // --- CRUD Handlers ---
  const handleDelete = async (poId) => {
    if (window.confirm("Are you sure you want to delete this purchase order?")) {
      setIsLoading(true);
      try {
        await deletePurchaseOrder(poId);
        setOrders((orders) => orders.filter((po) => po.id !== poId));
        setSuccessMessage("Purchase order deleted successfully.");
      } catch (error) {
        setErrorMessage("Failed to delete purchase order.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReceive = async (poId) => {
    setIsLoading(true);
    try {
      await receivePurchaseOrder(poId);
      await fetchAllData();
      setSuccessMessage("Purchase order marked as received.");
    } catch (error) {
      setErrorMessage("Failed to update purchase order status.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Form Handlers ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormPo((prev) => ({ ...prev, [name]: value }));
  };

  // Supplier Autocomplete
  const handleSupplierChange = (event, value) => {
    setFormPo((prev) => ({
        ...prev,
        supplierId: value ? String(value.id) : null,
    }));
    };

  // Item variant Autocomplete
  const handleItemVariantChange = (value, index) => {
    const newItems = [...formPo.items];
    newItems[index] = { ...newItems[index], itemVariantId: value ? value.id : "" };
    setFormPo((prev) => ({ ...prev, items: newItems }));
  };

  const handleItemChange = (e, index) => {
    const { name, value } = e.target;
    const newItems = [...formPo.items];
    newItems[index] = { ...newItems[index], [name]: value };
    setFormPo((prev) => ({ ...prev, items: newItems }));
  };

  const handleAddItem = () => {
    setFormPo((prev) => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), itemVariantId: "", quantity: "", unitCost: "" }],
    }));
    // Clear options for new item to trigger fetch on input
    setItemVariantOptions((prev) => {
      const newOptions = { ...prev };
      newOptions[formPo.items.length] = [];
      return newOptions;
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...formPo.items];
    newItems.splice(index, 1);
    setFormPo((prev) => ({ ...prev, items: newItems }));
    setItemVariantOptions((prev) => {
      const newOptions = { ...prev };
      delete newOptions[index];
      return newOptions;
    });
  };

  // --- Automatic Total Calculation ---
  useEffect(() => {
    if (formPo.items.length > 0) {
      let total = 0;
      formPo.items.forEach((item) => {
        const qty = Number(item.quantity) || 0;
        const cost = Number(item.unitCost) || 0;
        total += qty * cost;
      });
      setFormPo((prev) => ({
        ...prev,
        totalAmount: total ? total.toFixed(2) : "",
      }));
    }
    // eslint-disable-next-line
  }, [formPo.items]);

  // --- Item Variant Filtered Autocomplete ---
  function debounce(func, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  }
  // fetch filtered item variants as user types in each row
  const fetchVariantOptions = debounce((inputValue, index) => {
    setItemVariantLoading(true);
    fetchItemVariants({ search: inputValue })
      .then((res) => {
        console.log('Fetched item variants for index', index, ':', res.data);
        setItemVariantOptions((prev) => ({
          ...prev,
          [index]: res.data || res,
        }));
      })
      .catch((err) => {
        console.error('Error fetching item variants for index', index, ':', err);
        setSnackbarMsg("Failed to fetch item variants.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      })
      .finally(() => setItemVariantLoading(false));
  }, 300);

  // --- Validation ---
  const validateForm = () => {
    const errors = {};
    if (!formPo.poNumber) errors.poNumber = "PO Number is required.";
    if (!formPo.supplierId) errors.supplierId = "Supplier is required.";
    if (!formPo.orderDate) errors.orderDate = "Order Date is required.";
    if (!formPo.expectedDeliveryDate) errors.expectedDeliveryDate = "Expected Delivery Date is required.";
    if (!formPo.totalAmount) errors.totalAmount = "Total Amount is required.";
    if (formPo.items.some((item) => !item.itemVariantId || !item.quantity || !item.unitCost)) {
      errors.items = "All item fields are required.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (modalMode === "create") {
        await createPurchaseOrder(formPo);
        setSuccessMessage("Purchase order created successfully.");
      } else {
        await updatePurchaseOrder(selectedPo.id, formPo);
        setSuccessMessage("Purchase order updated successfully.");
      }
      await fetchAllData();
      handleCloseModal();
    } catch (error) {
      if (error?.response?.data?.message?.toLowerCase().includes("po number")) {
        setFormErrors((prev) => ({ ...prev, poNumber: "This PO number is already used." }));
      }
      setErrorMessage(`Failed to ${modalMode} purchase order.`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Filter/Searching ---
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearch((prev) => ({ ...prev, [name]: value }));
  };

  const filteredOrders = orders.filter((po) => {
    const poNumMatch = search.poNumber
      ? po.poNumber.toLowerCase().includes(search.poNumber.toLowerCase())
      : true;
    const suppMatch = search.supplierId ? String(po.supplierId) === String(search.supplierId) : true;
    const statusMatch = search.status ? po.status === search.status : true;
    return poNumMatch && suppMatch && statusMatch;
  });
console.log("allSuppliers", allSuppliers, "formPo.supplierId", formPo.supplierId);
  // --- Snackbar Handler ---
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  // --- Render Functions ---
  const renderModalContent = () => {
    if (modalMode === "view") {
      if (!selectedPo) return <Typography>No PO selected.</Typography>;
      const supplier = allSuppliers.find((s) => String(s.id) === String(selectedPo.supplierId));
      return (
        <Box>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Purchase Order Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>PO Number:</strong> {selectedPo.poNumber}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Supplier:</strong> {supplier ? supplier.name : selectedPo.supplierId}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Order Date:</strong> {new Date(selectedPo.orderDate).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Expected Delivery:</strong> {new Date(selectedPo.expectedDeliveryDate).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Status:</strong> {selectedPo.status}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Notes:</strong> {selectedPo.notes || "-"}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" mt={2} mb={1}>
                Items
              </Typography>
              <List sx={{ backgroundColor: "#f5f5f5", borderRadius: "8px", p: 2 }}>
                {selectedPo.items.map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      borderBottom: "1px solid #ddd",
                      pb: 1,
                      mb: 1,
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <Box>
                      <Typography variant="body2">
                        <strong>Variant:</strong> {item.itemVariantId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Quantity:</strong> {item.quantity}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Unit Cost:</strong> $
                        {Number(item.unitCost).toFixed(2)}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </Box>
      );
    }

    const isEdit = modalMode === "edit";
    return (
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          {isEdit ? "Edit Purchase Order" : "Create New Purchase Order"}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="PO Number"
              name="poNumber"
              value={formPo.poNumber}
              onChange={handleFormChange}
              fullWidth
              variant="outlined"
              error={!!formErrors.poNumber}
              helperText={formErrors.poNumber}
              disabled={isEdit}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
                options={allSuppliers}
                value={
                    allSuppliers.find((s) => String(s.id) === String(formPo.supplierId)) || null
                }
                getOptionLabel={(option) => (option && option.name ? option.name : '')}
                onChange={handleSupplierChange}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
                renderInput={(params) => (
                    <TextField
                    {...params}
                    label="Supplier"
                    variant="outlined"
                    error={!!formErrors.supplierId}
                    helperText={formErrors.supplierId}
                    />
                )}
                />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Order Date"
              type="date"
              name="orderDate"
              value={formPo.orderDate}
              onChange={handleFormChange}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              error={!!formErrors.orderDate}
              helperText={formErrors.orderDate}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Expected Delivery"
              type="date"
              name="expectedDeliveryDate"
              value={formPo.expectedDeliveryDate}
              onChange={handleFormChange}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              error={!!formErrors.expectedDeliveryDate}
              helperText={formErrors.expectedDeliveryDate}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Notes (optional)"
              name="notes"
              value={formPo.notes}
              onChange={handleFormChange}
              fullWidth
              variant="outlined"
              multiline
              rows={2}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <NoteAddIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        <Typography variant="h6" mt={4} mb={1}>
          Items
        </Typography>
        <List>
          {formPo.items.map((item, index) => (
            <ListItem key={item.id} sx={{ p: 0, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={itemVariantOptions[index] || []}
                    loading={itemVariantLoading}
                    value={
                      (itemVariantOptions[index] || []).find(
                        (v) => v.id === item.itemVariantId
                      ) || null
                    }
                    getOptionLabel={(option) =>
                      option
                        ? `${option.name || ""} (${option.sku || ""})`
                        : ""
                    }
                    onInputChange={(_, value) => {
                      if (value) fetchVariantOptions(value, index); // Fetch only if input exists
                    }}
                    onChange={(_, value) => handleItemVariantChange(value, index)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Item Variant"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {itemVariantLoading ? (
                                <CircularProgress color="inherit" size={16} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Quantity"
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(e, index)}
                    type="number"
                    fullWidth
                    variant="outlined"
                    size="small"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Unit Cost"
                    name="unitCost"
                    value={item.unitCost}
                    onChange={(e) => handleItemChange(e, index)}
                    type="number"
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  {formPo.items.length > 1 && (
                    <IconButton onClick={() => handleRemoveItem(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
        <Button onClick={handleAddItem} startIcon={<AddIcon />} variant="outlined" sx={{ mt: 1 }}>
          Add Item
        </Button>

        {formErrors.items && (
          <Typography color="error" sx={{ mt: 2 }}>
            {formErrors.items}
          </Typography>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4, gap: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {isEdit ? "Update PO" : "Create PO"}
          </Button>
        </Box>
      </Box>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "text-amber-500";
      case "Received":
        return "text-green-500";
      case "Cancelled":
        return "text-red-500";
      default:
        return "text-gray-400";
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-8 font-sans">
      {/* Status Messages as Snackbar pinned below header */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3500}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 8, zIndex: 1301, position: "fixed" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
      <div className="max-w-7xl mx-auto">
        {/* Header and Toolbar in column, title always first row */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "flex-start", md: "center" },
            mb: 4,
            gap: 2,
            width: "100%",
          }}
        >
          {/* Title */}
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              color: "text.primary",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              width: "100%",
              justifyContent: { xs: "flex-start", md: "center" }
            }}
          >
            <ShoppingBagIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Purchase Orders
          </Typography>
          {/* Toolbar below title */}
          {orders && orders.length > 0 && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
              justifyContent="center"
              width="100%"
              sx={{ mt: 1 }}
            >
              <TextField
                label="PO Number"
                name="poNumber"
                value={search.poNumber}
                onChange={handleSearchChange}
                size="small"
                variant="outlined"
              />
              <Autocomplete
                options={allSuppliers}
                value={
                  allSuppliers.find((s) => String(s.id) === String(search.supplierId)) || null
                }
                getOptionLabel={(option) => (option && option.name ? option.name : '')}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
                onChange={(_, value) => setSearch((prev) => ({ ...prev, supplierId: value ? String(value.id) : "" }))}
                renderInput={(params) => (
                  <TextField {...params} label="Supplier" size="small" />
                )}
                sx={{ minWidth: 150 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  name="status"
                  value={search.status}
                  onChange={handleSearchChange}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Received">Received</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenModal("create")}
                sx={{
                  backgroundColor: "#1f2937",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#374151" },
                  whiteSpace: "nowrap",
                }}
              >
                New PO
              </Button>
            </Stack>
          )}
        </Box>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <CircularProgress color="primary" size={60} />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!orders || orders.length === 0) && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="350px"
            bgcolor="#fafbfc"
            borderRadius={2}
            sx={{ boxShadow: 1, mt: 6 }}
          >
            <ShoppingBagIcon sx={{ fontSize: 60, color: "grey.400", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" mb={2}>
              No purchase orders yet.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal("create")}
              sx={{
                backgroundColor: "#1f2937",
                color: "#fff",
                "&:hover": { backgroundColor: "#374151" },
              }}
            >
              Create Purchase Order
            </Button>
          </Box>
        )}

        {/* Purchase Orders List */}
        {!isLoading && orders && orders.length > 0 && filteredOrders.length === 0 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="200px"
            bgcolor="#fafbfc"
            borderRadius={2}
            sx={{ boxShadow: 1, mt: 4 }}
          >
            <Typography variant="h6" color="text.secondary" mb={2}>
              No purchase orders match your filter.
            </Typography>
          </Box>
        )}

        {!isLoading && filteredOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((po) => {
              const supplier = allSuppliers.find((s) => String(s.id) === String(po.supplierId));
              return (
                <div
                  key={po.id}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600 transition-transform duration-200 hover:scale-105"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-bold">PO: {po.poNumber}</h2>
                    <span className={`text-sm font-medium ${getStatusColor(po.status)}`}>{po.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">Supplier: {supplier ? supplier.name : po.supplierId}</p>
                  <p className="text-sm text-gray-500 mt-1">Order Date: {new Date(po.orderDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Total: ${Number(po.totalAmount).toFixed(2)}</p>
                  <Divider sx={{ my: 2 }} />
                  <div className="flex justify-end gap-2">
                    <Tooltip title="View">
                      <IconButton color="info" onClick={() => handleOpenModal("view", po)} size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton color="secondary" onClick={() => handleOpenModal("edit", po)} size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDelete(po.id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    {po.status === "Pending" && (
                      <Tooltip title="Mark as Received">
                        <IconButton color="success" onClick={() => handleReceive(po.id)} size="small">
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Modal */}
      <StyledModal open={modalOpen} onClose={handleCloseModal}>
        <ModalContent>{renderModalContent()}</ModalContent>
      </StyledModal>
    </div>
  );
};

export default PurchaseOrders;