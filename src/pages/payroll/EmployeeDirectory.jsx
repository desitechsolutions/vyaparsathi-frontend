import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Tooltip, TextField, MenuItem,
  Skeleton, Stack, Alert, Snackbar, Pagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Visibility as VisibilityIcon, MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { fetchEmployees, addEmployee, updateEmployee, deleteEmployee, getEmployee } from '../../services/api';
import EmployeeModal from './components/EmployeeModal';

const EMPLOYMENT_STATUSES = ['ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'TERMINATED', 'RESIGNED'];
const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN'];

export default function EmployeeDirectory() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await fetchEmployees(selectedStatus, page, 50);
      setEmployees(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Failed to load employees',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [page, selectedStatus]);

  const handleAddEmployee = async (formData) => {
    try {
      await addEmployee(formData);
      setToast({ open: true, message: 'Employee added successfully', severity: 'success' });
      setOpenModal(false);
      loadEmployees();
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Failed to add employee',
        severity: 'error'
      });
    }
  };

  const handleEditEmployee = async (formData) => {
    try {
      await updateEmployee(selectedEmployee.id, formData);
      setToast({ open: true, message: 'Employee updated successfully', severity: 'success' });
      setOpenModal(false);
      loadEmployees();
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Failed to update employee',
        severity: 'error'
      });
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        setToast({ open: true, message: 'Employee deleted successfully', severity: 'success' });
        loadEmployees();
      } catch (error) {
        setToast({
          open: true,
          message: error.response?.data?.message || 'Failed to delete employee',
          severity: 'error'
        });
      }
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedEmployee(null);
    setOpenModal(true);
  };

  const handleOpenEditModal = async (employee) => {
    try {
      const fullData = await getEmployee(employee.id);
      setSelectedEmployee(fullData);
      setModalMode('edit');
      setOpenModal(true);
    } catch (error) {
      setToast({ open: true, message: 'Failed to load employee details', severity: 'error' });
    }
  };

  const getStatusChipColor = (status) => {
    const colors = {
      ACTIVE: 'success',
      PROBATION: 'warning',
      NOTICE_PERIOD: 'info',
      TERMINATED: 'error',
      RESIGNED: 'default'
    };
    return colors[status] || 'default';
  };

  if (loading && employees.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} height={70} sx={{ mb: 1, borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <h2>Employee Directory</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddModal}
        >
          Add Employee
        </Button>
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          label="Filter by Status"
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ minWidth: 200 }}
        >
          {EMPLOYMENT_STATUSES.map(status => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Employee Code</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Designation</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map(employee => (
              <TableRow key={employee.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{employee.employeeCode}</TableCell>
                <TableCell>{`${employee.firstName} ${employee.lastName || ''}`}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.phone}</TableCell>
                <TableCell>{employee.designation || '-'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={employee.employmentStatus}
                    color={getStatusChipColor(employee.employmentStatus)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{employee.employmentType}</TableCell>
                <TableCell align="right">
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEditModal(employee)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEditModal(employee)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteEmployee(employee.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page + 1}
          onChange={(e, value) => setPage(value - 1)}
        />
      </Box>

      {/* Employee Modal */}
      {openModal && (
        <EmployeeModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSubmit={modalMode === 'add' ? handleAddEmployee : handleEditEmployee}
          initialData={selectedEmployee}
          mode={modalMode}
        />
      )}

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}