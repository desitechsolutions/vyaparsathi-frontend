import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

const SalesHistory = ({ salesHistory }) => (
  <div>
    <Typography
      variant="h5"
      gutterBottom
      align="center"
      sx={{ fontWeight: 'bold', mb: 4, color: '#1976d2', fontSize: { xs: '1.3rem', md: '1.5rem' } }}
    >
      Sales History
    </Typography>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
          <TableCell sx={{ fontWeight: 'bold' }}>Customer ID</TableCell>
          <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {salesHistory.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} align="center">
              No sales recorded yet.
            </TableCell>
          </TableRow>
        ) : (
          salesHistory.map((sale, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{sale.customerId}</TableCell>
              <TableCell>₹{sale.totalAmount}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

export default SalesHistory;