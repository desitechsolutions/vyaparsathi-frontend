import React from 'react';
import {
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Grid,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

const ExpenseFilters = ({
  filters,
  onUpdateFilter,
  onClearFilters,
  categories = [],
  statuses = ['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'REIMBURSED'],
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Status"
              select
              fullWidth
              value={filters.status || ''}
              onChange={(e) => onUpdateFilter('status', e.target.value || null)}
              size="small"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="From Date"
              type="date"
              fullWidth
              value={filters.startDate || ''}
              onChange={(e) => onUpdateFilter('startDate', e.target.value || null)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="To Date"
              type="date"
              fullWidth
              value={filters.endDate || ''}
              onChange={(e) => onUpdateFilter('endDate', e.target.value || null)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.categoryId || ''}
                onChange={(e) => onUpdateFilter('categoryId', e.target.value || null)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                size="small"
              >
                Apply Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={onClearFilters}
                size="small"
              >
                Clear All
              </Button>

              {(filters.status || filters.startDate || filters.endDate || filters.categoryId) && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: 'auto' }}>
                  {filters.status && (
                    <Chip
                      label={`Status: ${filters.status}`}
                      onDelete={() => onUpdateFilter('status', null)}
                      size="small"
                    />
                  )}
                  {filters.startDate && (
                    <Chip
                      label={`From: ${filters.startDate}`}
                      onDelete={() => onUpdateFilter('startDate', null)}
                      size="small"
                    />
                  )}
                  {filters.endDate && (
                    <Chip
                      label={`To: ${filters.endDate}`}
                      onDelete={() => onUpdateFilter('endDate', null)}
                      size="small"
                    />
                  )}
                  {filters.categoryId && (
                    <Chip
                      label={`Category: ${filters.categoryId}`}
                      onDelete={() => onUpdateFilter('categoryId', null)}
                      size="small"
                    />
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ExpenseFilters;
