import React, { useState, useEffect } from 'react';
import {
  Box, Container, TextField, CircularProgress, Card, CardContent, Stack, Typography,
  Avatar, Chip, InputAdornment, Button, Paper, Grid, Divider, useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowBack as BackIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchGlobalData } from '../services/api';

const SearchResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const response = await searchGlobalData(searchQuery);
      const data = response.data || response;
      setResults(Array.isArray(data) ? data : []);
      // Update URL
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`, { replace: true });
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const getResultColor = (type) => {
    const colors = {
      CUSTOMER: 'info',
      SALE: 'success',
      INVENTORY: 'warning',
      PURCHASE: 'error',
    };
    return colors[type] || 'default';
  };

  const getResultIcon = (type) => {
    const icons = {
      CUSTOMER: '👤',
      SALE: '🧾',
      INVENTORY: '📦',
      PURCHASE: '🛒',
    };
    return icons[type] || '📄';
  };

  const getDisplayName = (result) => {
    if (result.name && result.name !== 'Unknown') return result.name;
    if (result.label && result.label !== 'Unknown') return result.label;

    // Fallback to email, phone, or other identifier
    if (result.meta?.email) return result.meta.email.split('@')[0];
    if (result.meta?.phone) return result.meta.phone;
    if (result.meta?.description) return result.meta.description.substring(0, 30);
    if (result.id) return `#${result.id.substring(0, 8).toUpperCase()}`;

    return 'Unknown';
  };

  const groupedResults = results.reduce((acc, result) => {
    const type = result.type || 'OTHER';
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {});

  const resultCount = results.length;
  const typeNames = {
    CUSTOMER: 'Customers',
    SALE: 'Sales',
    INVENTORY: 'Products',
    PURCHASE: 'Purchases',
  };

  return (
    <Box sx={{ flexGrow: 1, py: { xs: 3, md: 6 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: 'none' }}
          >
            Back
          </Button>
        </Stack>

        {/* Title */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" fontWeight={900} gutterBottom>
            Search Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find customers, sales, products, and more
          </Typography>
        </Box>

        {/* Search Box */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              placeholder="Search by name, ID, or keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : query ? (
                      <Box
                        onClick={handleClear}
                        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <ClearIcon sx={{ color: 'text.secondary' }} />
                      </Box>
                    ) : null}
                  </InputAdornment>
                ),
              }}
            />
          </form>
        </Paper>

        {/* Results */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : searched ? (
          <>
            {resultCount > 0 ? (
              <>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Found <strong>{resultCount}</strong> result{resultCount !== 1 ? 's' : ''} for "{query}"
                  </Typography>

                  <Stack spacing={4}>
                    {Object.entries(groupedResults).map(([type, typeResults]) => (
                      <Box key={type}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{getResultIcon(type)}</span>
                          {typeNames[type] || type} ({typeResults.length})
                        </Typography>

                        <Grid container spacing={2}>
                          {typeResults.map((result, idx) => (
                            <Grid item xs={12} sm={6} md={4} key={idx}>
                              <Card
                                elevation={0}
                                sx={{
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  cursor: 'pointer',
                                  transition: 'all 200ms',
                                  height: '100%',
                                  '&:hover': {
                                    borderColor: `${getResultColor(type)}.main`,
                                    boxShadow: 3,
                                  },
                                }}
                                onClick={() => {
                                  navigate(result.route);
                                }}
                              >
                                <CardContent sx={{ p: 2 }}>
                                  <Stack spacing={2}>
                                    {/* Header: Avatar + Name */}
                                    <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                                      <Avatar
                                        sx={{
                                          bgcolor: `${getResultColor(type)}.light`,
                                          color: `${getResultColor(type)}.main`,
                                          width: 48,
                                          height: 48,
                                          flexShrink: 0,
                                          fontWeight: 700,
                                          fontSize: '1rem',
                                        }}
                                      >
                                        {getDisplayName(result)?.charAt(0).toUpperCase() || '?'}
                                      </Avatar>
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="subtitle2" fontWeight={700} noWrap title={getDisplayName(result)}>
                                          {getDisplayName(result)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {typeNames[type] || type}
                                          {result.id && ` • ID: ${result.id.substring(0, 8)}`}
                                        </Typography>
                                      </Box>
                                    </Stack>

                                    {/* Metadata Details */}
                                    {result.meta && Object.keys(result.meta).length > 0 && (
                                      <Stack spacing={1} sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                                        {/* Amount if available */}
                                        {result.meta.amount && (
                                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" color="text.secondary">
                                              Amount:
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700} sx={{ color: 'primary.main' }}>
                                              ₹{Number(result.meta.amount).toLocaleString('en-IN')}
                                            </Typography>
                                          </Stack>
                                        )}

                                        {/* Status if available */}
                                        {result.meta.status && (
                                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" color="text.secondary">
                                              Status:
                                            </Typography>
                                            <Chip
                                              label={result.meta.status}
                                              size="small"
                                              variant="outlined"
                                              sx={{
                                                height: 20,
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                color: result.meta.status === 'COMPLETED' ? 'success.main' : 'warning.main',
                                                borderColor: result.meta.status === 'COMPLETED' ? 'success.light' : 'warning.light',
                                              }}
                                            />
                                          </Stack>
                                        )}

                                        {/* Date if available */}
                                        {result.meta.date && (
                                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" color="text.secondary">
                                              Date:
                                            </Typography>
                                            <Typography variant="caption" fontWeight={600}>
                                              {new Date(result.meta.date).toLocaleDateString('en-IN')}
                                            </Typography>
                                          </Stack>
                                        )}

                                        {/* Email/Phone if available */}
                                        {result.meta.email && (
                                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" color="text.secondary">
                                              Email:
                                            </Typography>
                                            <Typography variant="caption" fontWeight={600} sx={{ maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>
                                              {result.meta.email}
                                            </Typography>
                                          </Stack>
                                        )}

                                        {result.meta.phone && (
                                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" color="text.secondary">
                                              Phone:
                                            </Typography>
                                            <Typography variant="caption" fontWeight={600}>
                                              {result.meta.phone}
                                            </Typography>
                                          </Stack>
                                        )}

                                        {/* Items count if available */}
                                        {result.meta.itemCount && (
                                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" color="text.secondary">
                                              Items:
                                            </Typography>
                                            <Typography variant="caption" fontWeight={600}>
                                              {result.meta.itemCount}
                                            </Typography>
                                          </Stack>
                                        )}

                                        {/* Additional metadata */}
                                        {Object.entries(result.meta)
                                          .filter(([key]) => !['amount', 'status', 'date', 'email', 'phone', 'itemCount'].includes(key))
                                          .map(([key, value]) => (
                                            <Stack key={key} direction="row" justifyContent="space-between" alignItems="center">
                                              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                                {key}:
                                              </Typography>
                                              <Typography variant="caption" fontWeight={600}>
                                                {String(value).substring(0, 20)}
                                              </Typography>
                                            </Stack>
                                          ))}
                                      </Stack>
                                    )}

                                    {/* View Details Button */}
                                    <Button
                                      size="small"
                                      variant="contained"
                                      fullWidth
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(result.route);
                                      }}
                                      sx={{ borderRadius: 1 }}
                                    >
                                      View Details
                                    </Button>
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>

                        <Divider sx={{ my: 3 }} />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </>
            ) : (
              <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  No results found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Try searching with different keywords or check the spelling
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleClear}
                >
                  Clear Search
                </Button>
              </Paper>
            )}
          </>
        ) : (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Start searching
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter keywords to search across customers, sales, products, and more
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default SearchResults;
