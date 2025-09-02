import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button, Drawer, TextField, MenuItem, Select, InputLabel, FormControl,
  Chip, Tooltip, CircularProgress
} from '@mui/material';
import { Edit, Visibility, Print, Person, Close, AssignmentInd, Send, FileDownload } from '@mui/icons-material';

// Dummy data for illustration
const dummyDeliveries = [
  {
    id: 1,
    saleId: 10021,
    customer: { name: "John Doe", phone: "9876543210" },
    deliveryAddress: "123 Elm St, City",
    deliveryCharge: 50,
    deliveryPaidBy: "CUSTOMER",
    deliveryStatus: "PACKED",
    deliveryNotes: "Fragile",
    updatedAt: "2025-09-01T12:15:00Z",
    deliveryPerson: null,
    statusHistory: [
      { status: "PACKED", at: "2025-09-01T12:15:00Z", by: "Admin" }
    ]
  },
  {
    id: 2,
    saleId: 10022,
    customer: { name: "Alice Smith", phone: "8888888888" },
    deliveryAddress: "456 Oak Ave, City",
    deliveryCharge: 0,
    deliveryPaidBy: "SHOP",
    deliveryStatus: "IN_TRANSIT",
    deliveryNotes: "COD",
    updatedAt: "2025-09-01T13:00:00Z",
    deliveryPerson: { name: "Raj", phone: "7894561230", notes: "" },
    statusHistory: [
      { status: "PACKED", at: "2025-09-01T12:40:00Z", by: "Admin" },
      { status: "IN_TRANSIT", at: "2025-09-01T13:00:00Z", by: "Raj" }
    ]
  }
];

const statusOptions = [
  { value: "PACKED", label: "Packed" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" }
];

const DeliveryManagement = () => {
  // State
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editDelivery, setEditDelivery] = useState(null);
  const [assignMode, setAssignMode] = useState(false);
  const [assignPerson, setAssignPerson] = useState({ name: "", phone: "", notes: "" });
  const [updateStatus, setUpdateStatus] = useState("");

  // Fetch data (replace with API call)
  useEffect(() => {
    setTimeout(() => {
      setDeliveries(dummyDeliveries);
      setLoading(false);
    }, 500);
  }, []);

  // Filtered deliveries
  const filtered = deliveries.filter(d => 
    (!filterStatus || d.deliveryStatus === filterStatus) &&
    (!search ||
      d.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      d.deliveryAddress.toLowerCase().includes(search.toLowerCase()) ||
      String(d.saleId).includes(search)
    )
  );

  // Handlers
  const handleOpenDrawer = (d) => {
    setSelectedDelivery(d);
    setEditDelivery(d);
    setDrawerOpen(true);
    setEditMode(false);
    setAssignMode(false);
    setUpdateStatus("");
  };
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedDelivery(null);
    setEditMode(false);
    setAssignMode(false);
    setUpdateStatus("");
  };

  // Assign person (simulate API)
  const handleAssignPerson = () => {
    setDeliveries(ds =>
      ds.map(d =>
        d.id === selectedDelivery.id
          ? { ...d, deliveryPerson: assignPerson, statusHistory: [...d.statusHistory, { status: d.deliveryStatus, at: new Date().toISOString(), by: assignPerson.name }] }
          : d
      )
    );
    setSelectedDelivery(d => ({ ...d, deliveryPerson: assignPerson }));
    setAssignMode(false);
    setAssignPerson({ name: "", phone: "", notes: "" });
  };

  // Update status (simulate API)
  const handleUpdateStatus = () => {
    if (!updateStatus) return;
    setDeliveries(ds =>
      ds.map(d =>
        d.id === selectedDelivery.id
          ? {
              ...d,
              deliveryStatus: updateStatus,
              statusHistory: [
                ...d.statusHistory,
                { status: updateStatus, at: new Date().toISOString(), by: d.deliveryPerson?.name || "Admin" }
              ],
              updatedAt: new Date().toISOString()
            }
          : d
      )
    );
    setSelectedDelivery(d => ({
      ...d,
      deliveryStatus: updateStatus,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...d.statusHistory,
        { status: updateStatus, at: new Date().toISOString(), by: d.deliveryPerson?.name || "Admin" }
      ]
    }));
    setUpdateStatus("");
  };

  // Edit delivery details
  const handleEditDelivery = () => {
    setDeliveries(ds =>
      ds.map(d =>
        d.id === selectedDelivery.id
          ? { ...d, ...editDelivery }
          : d
      )
    );
    setSelectedDelivery(editDelivery);
    setEditMode(false);
  };

  // Export/Print stubs
  const handleExport = () => alert("Export feature not implemented!");
  const handlePrint = () => alert("Print feature not implemented!");

  // ========== UI ==========

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Delivery Management</Typography>
        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          onClick={handleExport}
          sx={{ mr: 1 }}
        >
          Export
        </Button>
        <Button
          variant="outlined"
          startIcon={<Print />}
          onClick={handlePrint}
        >
          Print
        </Button>
      </Box>
      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {statusOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {/* Table */}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Order #</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Delivery Person</TableCell>
                <TableCell>Charge</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No deliveries found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.id}</TableCell>
                    <TableCell>{d.saleId}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusOptions.find(opt => opt.value === d.deliveryStatus)?.label || d.deliveryStatus}
                        color={
                          d.deliveryStatus === "DELIVERED"
                            ? "success"
                            : d.deliveryStatus === "IN_TRANSIT"
                            ? "info"
                            : d.deliveryStatus === "PACKED"
                            ? "warning"
                            : d.deliveryStatus === "CANCELLED"
                            ? "error"
                            : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={d.customer.phone}>
                        <span>{d.customer.name}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={d.deliveryAddress}>
                        <span>{d.deliveryAddress.length > 15 ? d.deliveryAddress.slice(0, 15) + "..." : d.deliveryAddress}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {d.deliveryPerson
                        ? (<Tooltip title={d.deliveryPerson.phone}><span>{d.deliveryPerson.name}</span></Tooltip>)
                        : <Chip label="Not Assigned" size="small" />}
                    </TableCell>
                    <TableCell>₹{d.deliveryCharge}</TableCell>
                    <TableCell>{new Date(d.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title={d.deliveryNotes || ""}>
                        <span>{d.deliveryNotes?.length > 10 ? d.deliveryNotes.slice(0, 10) + "..." : d.deliveryNotes}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleOpenDrawer(d)} color="primary"><Visibility /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Drawer for Delivery Detail */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: { xs: "100vw", sm: 500 } } }}
      >
        {selectedDelivery && (
          <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Delivery #{selectedDelivery.id} &nbsp;
                <Chip
                  label={statusOptions.find(opt => opt.value === selectedDelivery.deliveryStatus)?.label || selectedDelivery.deliveryStatus}
                  size="small"
                  color={
                    selectedDelivery.deliveryStatus === "DELIVERED"
                      ? "success"
                      : selectedDelivery.deliveryStatus === "IN_TRANSIT"
                      ? "info"
                      : selectedDelivery.deliveryStatus === "PACKED"
                      ? "warning"
                      : selectedDelivery.deliveryStatus === "CANCELLED"
                      ? "error"
                      : "default"
                  }
                />
              </Typography>
              <IconButton onClick={handleCloseDrawer}><Close /></IconButton>
            </Box>
            <Box>
              <Typography variant="subtitle2">Order #: {selectedDelivery.saleId}</Typography>
              <Typography variant="subtitle2">Customer: {selectedDelivery.customer.name} ({selectedDelivery.customer.phone})</Typography>
              <Typography variant="subtitle2">Address: {selectedDelivery.deliveryAddress}</Typography>
              <Typography variant="subtitle2">Charge: ₹{selectedDelivery.deliveryCharge} | Paid By: {selectedDelivery.deliveryPaidBy}</Typography>
              <Typography variant="subtitle2">Notes: {selectedDelivery.deliveryNotes}</Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Delivery Person</Typography>
              {selectedDelivery.deliveryPerson ? (
                <Box sx={{ ml: 1 }}>
                  <Typography>Name: {selectedDelivery.deliveryPerson.name}</Typography>
                  <Typography>Phone: {selectedDelivery.deliveryPerson.phone}</Typography>
                  <Typography>Notes: {selectedDelivery.deliveryPerson.notes}</Typography>
                  <Button size="small" startIcon={<Edit />} sx={{ mt: 1 }} onClick={() => { setAssignMode(true); setAssignPerson(selectedDelivery.deliveryPerson); }}>Change</Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AssignmentInd />}
                  onClick={() => { setAssignMode(true); setAssignPerson({ name: "", phone: "", notes: "" }); }}
                  sx={{ mt: 1 }}
                >
                  Assign
                </Button>
              )}
              {assignMode && (
                <Box sx={{ mt: 2, mb: 2, border: "1px solid #ddd", p: 2, borderRadius: 1 }}>
                  <TextField
                    label="Name"
                    value={assignPerson.name}
                    fullWidth
                    sx={{ mb: 1 }}
                    onChange={e => setAssignPerson(a => ({ ...a, name: e.target.value }))}
                  />
                  <TextField
                    label="Phone"
                    value={assignPerson.phone}
                    fullWidth
                    sx={{ mb: 1 }}
                    onChange={e => setAssignPerson(a => ({ ...a, phone: e.target.value }))}
                  />
                  <TextField
                    label="Notes"
                    value={assignPerson.notes}
                    fullWidth
                    sx={{ mb: 2 }}
                    onChange={e => setAssignPerson(a => ({ ...a, notes: e.target.value }))}
                  />
                  <Button variant="contained" size="small" startIcon={<Send />} onClick={handleAssignPerson}>Save</Button>
                  <Button sx={{ ml: 1 }} size="small" onClick={() => setAssignMode(false)}>Cancel</Button>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Update Status</Typography>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={updateStatus}
                  onChange={e => setUpdateStatus(e.target.value)}
                >
                  {statusOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" sx={{ mt: 1 }} onClick={handleUpdateStatus}>Update</Button>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Status History</Typography>
              <Box sx={{ pl: 1 }}>
                {selectedDelivery.statusHistory?.map((h, idx) => (
                  <Typography key={idx} variant="body2">
                    [{h.status}] {new Date(h.at).toLocaleString()} by {h.by}
                  </Typography>
                ))}
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              {editMode ? (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Edit Delivery</Typography>
                  <TextField
                    label="Address"
                    value={editDelivery.deliveryAddress}
                    fullWidth
                    sx={{ mb: 1 }}
                    onChange={e => setEditDelivery(ed => ({ ...ed, deliveryAddress: e.target.value }))}
                  />
                  <TextField
                    label="Charge"
                    value={editDelivery.deliveryCharge}
                    type="number"
                    fullWidth
                    sx={{ mb: 1 }}
                    onChange={e => setEditDelivery(ed => ({ ...ed, deliveryCharge: e.target.value }))}
                  />
                  <TextField
                    label="Notes"
                    value={editDelivery.deliveryNotes}
                    fullWidth
                    sx={{ mb: 1 }}
                    onChange={e => setEditDelivery(ed => ({ ...ed, deliveryNotes: e.target.value }))}
                  />
                  <Button variant="contained" size="small" onClick={handleEditDelivery}>Save</Button>
                  <Button sx={{ ml: 1 }} size="small" onClick={() => setEditMode(false)}>Cancel</Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  size="small"
                  onClick={() => { setEditMode(true); setEditDelivery(selectedDelivery); }}
                >
                  Edit Delivery
                </Button>
              )}
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ mt: 2, mb: 1 }}>
              <Button variant="outlined" startIcon={<Print />}>Print</Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default DeliveryManagement;