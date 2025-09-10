import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Stack,
  Button,
  TextField,
  Modal,
  IconButton,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { styled } from "@mui/system";

// API helpers
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../services/api";

// Styled Modal
const StyledModal = styled(Modal)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(5px)",
});

const ModalContent = styled(Box)({
  backgroundColor: "#fff",
  borderRadius: "12px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: "2.5rem",
  width: "90%",
  maxWidth: "520px",
  maxHeight: "90vh",
  overflowY: "auto",
  position: "relative",
});

const initialForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  gstin: "",
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add | edit | view
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [search, setSearch] = useState("");

  // Fetch suppliers
  useEffect(() => {
    fetchSuppliers();
    // eslint-disable-next-line
  }, []);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await getSuppliers();
      setSuppliers(res || []);
      if (!res || res.length === 0) {
        setSnackbar({
          open: true,
          message: "No suppliers found.",
          severity: "info",
        });
      }
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Failed to fetch suppliers.",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modal open/close/prepare
  const handleOpenModal = (mode, supplier = null) => {
    setModalMode(mode);
    setSelectedSupplier(supplier);
    if (mode === "add") {
      setForm(initialForm);
    } else if (supplier) {
      setForm({
        name: supplier.name || "",
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        gstin: supplier.gstin || "",
      });
    }
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSupplier(null);
  };

  // CRUD actions
  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this supplier? This action cannot be undone."
      )
    ) {
      setIsLoading(true);
      try {
        await deleteSupplier(id);
        setSnackbar({
          open: true,
          message: "Supplier deleted successfully.",
          severity: "success",
        });
        fetchSuppliers();
      } catch (e) {
        setSnackbar({
          open: true,
          message: "Failed to delete supplier.",
          severity: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!form.name) errors.name = "Supplier name is required";
    if (!form.contactPerson) errors.contactPerson = "Contact person is required";
    if (!form.phone) errors.phone = "Phone is required";
    if (!/^\d{10,15}$/.test(form.phone.replace(/[^\d]/g, "")))
      errors.phone = "Enter a valid phone number";
    if (!form.email) errors.email = "Email is required";
    if (
      form.email &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email)
    )
      errors.email = "Enter a valid email";
    if (!form.address) errors.address = "Address is required";
    if (!form.gstin) errors.gstin = "GSTIN is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add/Edit submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (modalMode === "add") {
        await createSupplier(form);
        setSnackbar({
          open: true,
          message: "Supplier added successfully.",
          severity: "success",
        });
      } else {
        await updateSupplier(selectedSupplier.id, form);
        setSnackbar({
          open: true,
          message: "Supplier updated successfully.",
          severity: "success",
        });
      }
      await fetchSuppliers();
      handleCloseModal();
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Failed to save supplier.",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Search
  const filteredSuppliers = suppliers.filter((s) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      s.name?.toLowerCase().includes(query) ||
      s.contactPerson?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.phone?.toLowerCase().includes(query) ||
      s.address?.toLowerCase().includes(query) ||
      s.gstin?.toLowerCase().includes(query)
    );
  });

  // Snackbar close
  const handleSnackbarClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // -- Render Modal Content --
  const renderModalContent = () => {
    if (modalMode === "view") {
      return (
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Supplier Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <BusinessIcon color="primary" />
              <Typography>
                <strong>Name:</strong> {form.name}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PersonIcon color="primary" />
              <Typography>
                <strong>Contact Person:</strong> {form.contactPerson}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PhoneIcon color="primary" />
              <Typography>
                <strong>Phone:</strong> {form.phone}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <EmailIcon color="primary" />
              <Typography>
                <strong>Email:</strong> {form.email}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocationOnIcon color="primary" />
              <Typography>
                <strong>Address:</strong> {form.address}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AssignmentIcon color="primary" />
              <Typography>
                <strong>GSTIN:</strong> {form.gstin}
              </Typography>
            </Stack>
          </Stack>
          <Box textAlign="right" mt={3}>
            <Button variant="outlined" onClick={handleCloseModal}>
              Close
            </Button>
          </Box>
        </Box>
      );
    }

    // Add/Edit form
    return (
      <Box component="form" onSubmit={handleFormSubmit}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {modalMode === "add" ? "Add Supplier" : "Edit Supplier"}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2}>
          <TextField
            label="Supplier Name"
            name="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={!!formErrors.name}
            helperText={formErrors.name}
            fullWidth
            autoFocus
          />
          <TextField
            label="Contact Person"
            name="contactPerson"
            value={form.contactPerson}
            onChange={(e) =>
              setForm((f) => ({ ...f, contactPerson: e.target.value }))
            }
            error={!!formErrors.contactPerson}
            helperText={formErrors.contactPerson}
            fullWidth
          />
          <TextField
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={(e) =>
              setForm((f) => ({ ...f, phone: e.target.value }))
            }
            error={!!formErrors.phone}
            helperText={formErrors.phone}
            fullWidth
          />
          <TextField
            label="Email"
            name="email"
            value={form.email}
            onChange={(e) =>
              setForm((f) => ({ ...f, email: e.target.value }))
            }
            error={!!formErrors.email}
            helperText={formErrors.email}
            fullWidth
          />
          <TextField
            label="Address"
            name="address"
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
            error={!!formErrors.address}
            helperText={formErrors.address}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="GSTIN"
            name="gstin"
            value={form.gstin}
            onChange={(e) =>
              setForm((f) => ({ ...f, gstin: e.target.value }))
            }
            error={!!formErrors.gstin}
            helperText={formErrors.gstin}
            fullWidth
          />
        </Stack>
        <Stack direction="row" spacing={2} mt={4} justifyContent="flex-end">
          <Button variant="outlined" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="contained" type="submit">
            {modalMode === "add" ? "Add" : "Save"}
          </Button>
        </Stack>
      </Box>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
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
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              color: "text.primary",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              width: "100%",
              justifyContent: { xs: "flex-start", md: "center" },
            }}
          >
            <BusinessIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Suppliers
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
            justifyContent="center"
            width="100%"
            sx={{ mt: 1 }}
          >
            <TextField
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              variant="outlined"
              sx={{ minWidth: 220 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal("add")}
              sx={{
                backgroundColor: "#1f2937",
                color: "#fff",
                "&:hover": { backgroundColor: "#374151" },
                whiteSpace: "nowrap",
              }}
            >
              Add Supplier
            </Button>
          </Stack>
        </Box>
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3600}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        {/* Loading */}
        {isLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" height="250px">
            <CircularProgress color="primary" size={60} />
          </Box>
        )}
        {/* Empty state */}
        {!isLoading && filteredSuppliers.length === 0 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="300px"
            bgcolor="#fafbfc"
            borderRadius={2}
            sx={{ boxShadow: 1, mt: 6 }}
          >
            <BusinessIcon sx={{ fontSize: 60, color: "grey.400", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" mb={2}>
              No suppliers found.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal("add")}
              sx={{
                backgroundColor: "#1f2937",
                color: "#fff",
                "&:hover": { backgroundColor: "#374151" },
              }}
            >
              Add Supplier
            </Button>
          </Box>
        )}
        {/* Table */}
        {!isLoading && filteredSuppliers.length > 0 && (
          <TableContainer component={Paper} sx={{ borderRadius: 3, mt: 3, boxShadow: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Contact Person</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>GSTIN</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSuppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.contactPerson}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.gstin}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton
                          color="info"
                          onClick={() => handleOpenModal("view", s)}
                        >
                          <AssignmentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          color="secondary"
                          onClick={() => handleOpenModal("edit", s)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(s.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
      {/* Modal */}
      <StyledModal open={modalOpen} onClose={handleCloseModal}>
        <ModalContent>{renderModalContent()}</ModalContent>
      </StyledModal>
    </div>
  );
};

export default Suppliers;