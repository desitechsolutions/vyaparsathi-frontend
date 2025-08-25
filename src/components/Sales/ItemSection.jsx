import React from 'react';
import { Grid, Card, CardContent, TextField, Button, Typography, Box } from '@mui/material';
import Select from 'react-select';
import customStyles from '../../styles/SalesStyles';

const ItemSection = ({
  variants,
  selectedVariant,
  item,
  setItem,
  uniqueNames,
  uniqueSkus,
  uniqueColors,
  uniqueSizes,
  uniqueDesigns,
  uniqueCategory,
  searchParams,
  handleVariantSelect,
  handleSearchParamChange,
  handleAddItem,
  error,
  setError,
}) => (
  <Grid item xs={12}>
    <Card raised sx={{ p: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 'medium', fontSize: { xs: '1.1rem', md: '1.25rem' } }}
        >
          Add Items to Sale
        </Typography>
        <Card sx={{ p: 2, mb: 2, bgcolor: '#fff' }}>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
          >
            Search Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block', fontSize: { xs: '0.75rem', md: '0.85rem' } }}>
                Category
              </Typography>
              <Select
                options={uniqueCategory}
                value={uniqueCategory.find((option) => option.value === searchParams.category) || null}
                onChange={(option) => handleSearchParamChange('category', option)}
                isSearchable
                placeholder="All Categories"
                styles={customStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                noOptionsMessage={() => "No categories found"}
                isClearable={false}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block', fontSize: { xs: '0.75rem', md: '0.85rem' } }}>
                Name
              </Typography>
              <Select
                options={uniqueNames}
                value={uniqueNames.find((option) => option.value === searchParams.name) || null}
                onChange={(option) => handleSearchParamChange('name', option)}
                isSearchable
                placeholder="All Names"
                styles={customStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                noOptionsMessage={() => "No names found"}
                isClearable={false}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block', fontSize: { xs: '0.75rem', md: '0.85rem' } }}>
                SKU
              </Typography>
              <Select
                options={uniqueSkus}
                value={uniqueSkus.find((option) => option.value === searchParams.sku) || null}
                onChange={(option) => handleSearchParamChange('sku', option)}
                isSearchable
                placeholder="All SKUs"
                styles={customStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                noOptionsMessage={() => "No SKUs found"}
                isClearable={false}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block', fontSize: { xs: '0.75rem', md: '0.85rem' } }}>
                Color
              </Typography>
              <Select
                options={uniqueColors}
                value={uniqueColors.find((option) => option.value === searchParams.color) || null}
                onChange={(option) => handleSearchParamChange('color', option)}
                isSearchable
                placeholder="All Colors"
                styles={customStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                noOptionsMessage={() => "No colors found"}
                isClearable={false}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block', fontSize: { xs: '0.75rem', md: '0.85rem' } }}>
                Size
              </Typography>
              <Select
                options={uniqueSizes}
                value={uniqueSizes.find((option) => option.value === searchParams.size) || null}
                onChange={(option) => handleSearchParamChange('size', option)}
                isSearchable
                placeholder="All Sizes"
                styles={customStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                noOptionsMessage={() => "No sizes found"}
                isClearable={false}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block', fontSize: { xs: '0.75rem', md: '0.85rem' } }}>
                Design
              </Typography>
              <Select
                options={uniqueDesigns}
                value={uniqueDesigns.find((option) => option.value === searchParams.design) || null}
                onChange={(option) => handleSearchParamChange('design', option)}
                isSearchable
                placeholder="All Designs"
                styles={customStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                noOptionsMessage={() => "No designs found"}
                isClearable={false}
              />
            </Grid>
          </Grid>
        </Card>
        <Select
          options={variants}
          onChange={handleVariantSelect}
          placeholder="Select Variant"
          isClearable
          value={selectedVariant}
          styles={{
            container: (provided) => ({ ...provided, margin: '1rem 0', fontSize: { xs: '0.75rem', md: '0.85rem' } }),
            menu: (provided) => ({ ...provided, zIndex: 9999 }),
          }}
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="SKU"
              fullWidth
              variant="outlined"
              value={item.sku}
              disabled
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Item Name"
              fullWidth
              variant="outlined"
              value={item.itemName}
              disabled
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Description"
              fullWidth
              variant="outlined"
              value={item.description}
              disabled
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Color"
              fullWidth
              variant="outlined"
              value={item.color}
              disabled
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Size"
              fullWidth
              variant="outlined"
              value={item.size}
              disabled
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Design"
              fullWidth
              variant="outlined"
              value={item.design}
              disabled
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Unit Price"
              fullWidth
              variant="outlined"
              value={item.unitPrice}
              disabled
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Available Quantity"
              fullWidth
              variant="outlined"
              value={item.currentStock}
              disabled
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Quantity"
              fullWidth
              variant="outlined"
              type="number"
              value={item.qty}
              onChange={(e) => setItem({ ...item, qty: parseInt(e.target.value) || 1 })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddItem}
            sx={{ textTransform: 'none', fontSize: { xs: '0.8rem', md: '0.9rem' } }}
          >
            Add Item
          </Button>
        </Box>
        {error && (
          <Box sx={{ mt: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  </Grid>
);

export default ItemSection;