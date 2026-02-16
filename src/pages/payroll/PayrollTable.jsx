import React from 'react';
import { useNavigate } from 'react-router-dom'; // Added for navigation
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Avatar, Typography, Button, Chip, Checkbox, Box, Skeleton, Stack, Tooltip ,IconButton
} from '@mui/material';
import { 
  AccountBalanceWallet, 
  RequestQuote, 
  Payments, 
  CheckCircle, 
  History 
} from '@mui/icons-material';

export default function PayrollTable({ 
  data, 
  selectedIds, 
  setSelectedIds, 
  onOpenAdvance, 
  onOpenProcess, 
  loading 
}) {
  const navigate = useNavigate();

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      // Only select staff who are NOT yet paid
      const payableIds = data.filter(n => !n.paidInCurrentPeriod).map((n) => n.id);
      setSelectedIds(payableIds);
      return;
    }
    setSelectedIds([]);
  };

  const handleSelectOne = (id) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedIds, id];
    } else {
      newSelected = selectedIds.filter(item => item !== id);
    }
    setSelectedIds(newSelected);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={70} sx={{ mb: 1, borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table sx={{ minWidth: 800 }}>
        <TableHead sx={{ bgcolor: '#f8fafc' }}>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selectedIds.length > 0 && selectedIds.length < data.length}
                checked={data.length > 0 && data.filter(n => !n.paidInCurrentPeriod).every(n => selectedIds.includes(n.id))}
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>STAFF MEMBER</TableCell>
            <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>BASE SALARY</TableCell>
            <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>ADVANCE BAL.</TableCell>
            <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>PAYMENT STATUS</TableCell>
            <TableCell sx={{ fontWeight: 800, color: '#64748b' }} align="right">ACTIONS</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => {
            const isItemSelected = selectedIds.indexOf(row.id) !== -1;
            const hasAdvance = row.advanceBalance > 0;
            const isPaid = row.paidInCurrentPeriod;

            return (
              <TableRow 
                key={row.id} 
                hover 
                selected={isItemSelected}
                sx={{ opacity: isPaid ? 0.9 : 1 }}
              >
                <TableCell padding="checkbox">
                  <Checkbox 
                    checked={isItemSelected} 
                    onChange={() => handleSelectOne(row.id)} 
                    disabled={isPaid}
                  />
                </TableCell>
                
                {/* Staff Info - Clickable to open History */}
                <TableCell>
                  <Tooltip title="View Payment History" arrow>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        cursor: 'pointer',
                        '&:hover .staff-name': { color: 'primary.main', textDecoration: 'underline' }
                      }}
                      onClick={() => navigate(`/payroll/history/${row.id}`)}
                    >
                      <Avatar sx={{ bgcolor: isPaid ? '#94a3b8' : '#1e293b', fontSize: '14px', fontWeight: 700 }}>
                        {row.name ? row.name[0] : '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} className="staff-name">
                          {row.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{row.role}</Typography>
                      </Box>
                    </Box>
                  </Tooltip>
                </TableCell>

                <TableCell>
                  <Typography variant="subtitle2" fontWeight={800}>
                    ₹{row.baseSalary?.toLocaleString()}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {hasAdvance && <AccountBalanceWallet sx={{ fontSize: 14, color: '#ef4444' }} />}
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={700} 
                      color={hasAdvance ? 'error.main' : 'text.primary'}
                    >
                      ₹{row.advanceBalance?.toLocaleString() || 0}
                    </Typography>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Chip 
                    label={isPaid ? "Paid" : "Pending"} 
                    size="small"
                    color={isPaid ? "success" : "warning"}
                    variant={isPaid ? "filled" : "outlined"}
                    icon={isPaid ? <CheckCircle style={{ fontSize: '14px' }} /> : undefined}
                    sx={{ fontWeight: 800, minWidth: 85 }} 
                  />
                </TableCell>

                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {/* New: History Shortcut Icon */}
                    <Tooltip title="Payment History">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/payroll/history/${row.id}`)}
                          sx={{ color: '#64748b' }}
                        >
                          <History fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Button 
                      size="small"
                      startIcon={<RequestQuote />}
                      onClick={() => onOpenAdvance(row)}
                      sx={{ 
                        fontWeight: 700, 
                        textTransform: 'none', 
                        color: 'warning.dark'
                      }}
                    >
                      Advance
                    </Button>

                    <Button 
                      variant={isPaid ? "text" : "contained"} 
                      size="small" 
                      startIcon={!isPaid && <Payments />}
                      onClick={() => onOpenProcess(row)}
                      disabled={isPaid}
                      sx={{ 
                        fontWeight: 700, 
                        borderRadius: 2, 
                        textTransform: 'none',
                        bgcolor: isPaid ? 'transparent' : '#1e293b',
                        color: isPaid ? 'success.main' : 'white',
                        '&.Mui-disabled': { color: 'success.main', opacity: 1 }
                      }}
                    >
                      {isPaid ? 'Processed' : 'Pay Now'}
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}