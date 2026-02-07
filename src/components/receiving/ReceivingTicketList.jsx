import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, Stack, TextField,
  MenuItem, InputAdornment, Card, CardContent, useMediaQuery, useTheme,Button
} from '@mui/material';
import {
  Search as SearchIcon,
  VisibilityOutlined as ViewIcon,
  FilterList as FilterIcon,
  AssignmentLateOutlined as OpenIcon,
  CheckCircleOutlined as ResolvedIcon,
  PendingActionsOutlined as ProgressIcon
} from '@mui/icons-material';
import Header from './Header';
import { formatDate } from '../../utils/utils';

const getStatusConfig = (status) => {
  switch (status?.toUpperCase()) {
    case 'OPEN':
      return { color: 'error', icon: <OpenIcon fontSize="small" />, label: 'Open' };
    case 'IN_PROGRESS':
      return { color: 'warning', icon: <ProgressIcon fontSize="small" />, label: 'In Progress' };
    case 'RESOLVED':
      return { color: 'success', icon: <ResolvedIcon fontSize="small" />, label: 'Resolved' };
    default:
      return { color: 'default', icon: null, label: status };
  }
};

const ReceivingTicketList = ({ tickets, onViewDetails, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.receivingId.toString().includes(searchTerm) || 
      ticket.raisedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ pb: 4 }}>
      <Header title="Ticket Status Tracker" onBack={onBack} />

      {/* Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by ID or Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: '200px' }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: '150px' }}
        >
          <MenuItem value="ALL">All Tickets</MenuItem>
          <MenuItem value="OPEN">Open</MenuItem>
          <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
          <MenuItem value="RESOLVED">Resolved</MenuItem>
        </TextField>
      </Paper>

      {/* Content Area */}
      {filteredTickets.length === 0 ? (
        <Paper sx={{ py: 10, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">No tickets found matching your filters.</Typography>
        </Paper>
      ) : isMobile ? (
        /* Mobile Card View */
        <Stack spacing={2}>
          {filteredTickets.map((ticket) => {
            const config = getStatusConfig(ticket.status);
            return (
              <Card key={ticket.id} variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" mb={2}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Ticket #{ticket.id}
                    </Typography>
                    <Chip 
                      icon={config.icon} 
                      label={config.label} 
                      color={config.color} 
                      size="small" 
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>
                  <Typography variant="body2" gutterBottom><b>Receiving ID:</b> {ticket.receivingId}</Typography>
                  <Typography variant="body2" gutterBottom><b>Reason:</b> {ticket.reason.replace('_', ' ')}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Raised on {formatDate(ticket.createdAt)} by {ticket.raisedBy}
                  </Typography>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<ViewIcon />}
                    onClick={() => onViewDetails(ticket)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      ) : (
        /* Desktop Table View */
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Ticket ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Rec. ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Raised By</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const config = getStatusConfig(ticket.status);
                return (
                  <TableRow key={ticket.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>#{ticket.id}</TableCell>
                    <TableCell>{ticket.receivingId}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {ticket.reason.toLowerCase().replace('_', ' ')}
                      </Typography>
                    </TableCell>
                    <TableCell>{ticket.raisedBy}</TableCell>
                    <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={config.label} 
                        color={config.color} 
                        size="small" 
                        sx={{ fontWeight: 700, minWidth: 90 }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Conversation & Attachments">
                        <IconButton onClick={() => onViewDetails(ticket)} color="primary">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ReceivingTicketList;