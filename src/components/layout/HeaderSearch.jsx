import React, { useState, useEffect } from 'react';
import {
  Box, InputBase, Paper, CircularProgress, ListItem, ListItemText, ListItemAvatar,
  Avatar, Divider, Button, useTheme, useMediaQuery, IconButton, Badge,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { searchGlobalData } from '../../services/api';
import { useTranslation } from 'react-i18next';

const HeaderSearch = ({ mobileSearchOpen, onMobileSearchClose, isMobile, isTablet }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();

  // Search debounce logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchGlobalData(searchQuery);
        const data = response.data || response;
        setSearchResults(Array.isArray(data) ? data : []);
        setShowResults(true);
      } catch (error) {
        console.error('Global search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleResultClick = (route) => {
    setSearchQuery('');
    setShowResults(false);
    onMobileSearchClose();
    navigate(route);
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

  // Desktop search (visible on md+)
  if (!isMobile) {
    return (
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flexGrow: 1, maxWidth: 400, mx: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            bgcolor: 'rgba(255,255,255,0.15)',
            borderRadius: 2,
            px: 1.5,
            py: 0.8,
            transition: 'background-color 200ms',
            '&:focus-within': { bgcolor: 'rgba(255,255,255,0.25)' },
            position: 'relative',
          }}
        >
          <SearchIcon sx={{ color: 'rgba(255,255,255,0.8)', mr: 1, flexShrink: 0, fontSize: 20 }} />
          <InputBase
            placeholder={t('header.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Global search"
            aria-describedby="search-help"
            role="searchbox"
            sx={{
              color: 'white',
              width: '100%',
              fontSize: '0.9rem',
              '& ::placeholder': { color: 'rgba(255,255,255,0.6)', opacity: 1 },
            }}
          />
          {isSearching && <CircularProgress size={16} sx={{ color: 'white', flexShrink: 0 }} />}

          {/* Desktop search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <Paper
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                mt: 1,
                maxHeight: 450,
                overflowY: 'auto',
                zIndex: 1000,
                borderRadius: 2,
                boxShadow: 3,
              }}
            >
              {searchResults.map((result, idx) => (
                <Box key={idx}>
                  <ListItem
                    button
                    onClick={() => handleResultClick(result.route)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': { bgcolor: 'action.hover' },
                      cursor: 'pointer',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getResultColor(result.type)}.light`, width: 32, height: 32, fontSize: '0.8rem' }}>
                        {result.type.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={result.name || result.label}
                      secondary={result.type}
                      primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                  {idx < searchResults.length - 1 && <Divider />}
                </Box>
              ))}
              <Divider />
              <Button
                fullWidth
                size="small"
                onClick={() => handleResultClick('/search')}
                sx={{ py: 1, textTransform: 'none', fontSize: '0.85rem' }}
              >
                View All Results
              </Button>
            </Paper>
          )}
        </Box>
      </Box>
    );
  }

  // Mobile search overlay
  if (mobileSearchOpen) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexGrow: 1,
            bgcolor: 'rgba(255,255,255,0.15)',
            borderRadius: 2,
            px: 1.5,
            '&:focus-within': { bgcolor: 'rgba(255,255,255,0.25)' },
          }}
        >
          <SearchIcon sx={{ color: 'rgba(255,255,255,0.8)', mr: 1, flexShrink: 0 }} />
          <InputBase
            autoFocus
            placeholder={t('header.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ color: 'white', width: '100%', fontSize: '0.95rem', py: 0.8 }}
          />
          {isSearching && <CircularProgress size={18} sx={{ color: 'white', ml: 1 }} />}
        </Box>
        <IconButton color="inherit" onClick={onMobileSearchClose} size="small">
          <CloseIcon />
        </IconButton>

        {/* Mobile search results - shown below search bar */}
        {showResults && searchResults.length > 0 && (
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: 300,
              overflowY: 'auto',
              zIndex: 999,
              borderRadius: 2,
              mt: 1,
              mx: 1,
            }}
          >
            {searchResults.slice(0, 5).map((result, idx) => (
              <Box key={idx}>
                <ListItem
                  button
                  onClick={() => handleResultClick(result.route)}
                  sx={{ py: 1, px: 1.5, '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemText
                    primary={result.name || result.label}
                    secondary={result.type}
                    primaryTypographyProps={{ fontSize: '0.85rem' }}
                    secondaryTypographyProps={{ fontSize: '0.7rem' }}
                  />
                </ListItem>
                {idx < Math.min(4, searchResults.length - 1) && <Divider />}
              </Box>
            ))}
          </Paper>
        )}
      </Box>
    );
  }

  // Mobile search icon only
  return null;
};

export default HeaderSearch;
