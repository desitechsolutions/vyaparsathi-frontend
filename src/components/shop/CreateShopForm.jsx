import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { createAdditionalShop } from '../../services/api';

// Minimal subset of industry types — mirrors IndustryType enum on the backend.
// The full list is available from GET /api/config/industries but a hardcoded
// short-list keeps this component self-contained.
const INDUSTRIES = [
  'GENERAL', 'GROCERY', 'CLOTHING', 'ELECTRONICS', 'RESTAURANT',
  'HARDWARE', 'FOOTWEAR', 'FURNITURE', 'JEWELLERY', 'MEDICAL_EQUIPMENT',
  'AUTOMOBILE', 'STATIONERY', 'BUILDING_MATERIALS', 'COSMETICS',
  'BAKERY', 'DAIRY', 'SUPERMARKET', 'SPORTS', 'SERVICES', 'WHOLESALE',
];

/**
 * Minimal "create a new store" form embedded inside the ShopSwitcher dialog.
 *
 * Props:
 *   mode       — 'additional' (POST /api/shop/additional) | 'onboarding' (reserved)
 *   onSuccess  — called with (accessToken | null) when the shop is created
 *   onCancel   — called when the user clicks Cancel
 */
export default function CreateShopForm({ mode = 'additional', onSuccess, onCancel }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [industry, setIndustry] = useState('GENERAL');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState('');

  // Auto-derive a URL slug from the name.
  useEffect(() => {
    setCode(
      name.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30)
    );
  }, [name]);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Shop name is required.';
    if (!code.trim()) e.code = 'Shop code is required.';
    if (!/^[a-z0-9-]{2,30}$/.test(code)) e.code = 'Use 2–30 lowercase letters, digits or hyphens.';
    if (!industry) e.industry = 'Select an industry.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('code', code.trim());
      formData.append('industryType', industry);

      const res = await createAdditionalShop(formData);
      const token = res.data?.accessToken ?? null;
      onSuccess(token);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Could not create shop. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2} sx={{ mt: 0.5 }}>
      {apiError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{apiError}</Alert>
      )}

      <TextField
        label="Store name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        required
        autoFocus
        error={!!errors.name}
        helperText={errors.name || 'The name customers will see.'}
      />

      <TextField
        label="Store code (URL slug)"
        value={code}
        onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))}
        fullWidth
        required
        error={!!errors.code}
        helperText={errors.code || 'Unique identifier used in URLs. 2–30 lowercase letters, digits or hyphens.'}
        inputProps={{ maxLength: 30 }}
      />

      <FormControl fullWidth required error={!!errors.industry}>
        <InputLabel>Industry</InputLabel>
        <Select
          label="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          {INDUSTRIES.map((ind) => (
            <MenuItem key={ind} value={ind}>
              {ind.replace(/_/g, ' ')}
            </MenuItem>
          ))}
        </Select>
        {errors.industry && <FormHelperText>{errors.industry}</FormHelperText>}
      </FormControl>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
        <Button onClick={onCancel} sx={{ textTransform: 'none' }} disabled={busy}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={busy}
          sx={{ textTransform: 'none', fontWeight: 700, minWidth: 140 }}
        >
          {busy ? <CircularProgress size={20} color="inherit" /> : 'Create store'}
        </Button>
      </Stack>
    </Stack>
  );
}
