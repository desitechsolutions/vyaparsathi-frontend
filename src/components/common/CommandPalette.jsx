import React, { useMemo } from 'react';
import {
  Dialog, Box, InputBase, List, ListItem, ListItemIcon, ListItemText,
  Typography, Divider, Chip, useTheme, useMediaQuery, Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import ContactsIcon from '@mui/icons-material/Contacts';
import SettingsIcon from '@mui/icons-material/Settings';
import { useCommandPalette } from '../../hooks/useCommandPalette';

const CATEGORY_ICONS = {
  'Quick Actions': <ShoppingCartIcon sx={{ fontSize: 18 }} />,
  'Navigation': <TrendingUpOutlinedIcon sx={{ fontSize: 18 }} />,
  'Settings': <SettingsIcon sx={{ fontSize: 18 }} />,
  'Recent': <TrendingUpOutlinedIcon sx={{ fontSize: 18 }} />,
  'Results': <SearchIcon sx={{ fontSize: 18 }} />,
};

const CATEGORY_COLORS = {
  'Quick Actions': 'success',
  'Navigation': 'primary',
  'Settings': 'warning',
  'Recent': 'info',
  'Results': 'default',
};

const CommandPalette = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    results,
    selectedIndex,
    setSelectedIndex,
    recentItems,
    addToRecent,
    getSelectedItem,
    getAllFlatResults,
  } = useCommandPalette();

  const flatResults = useMemo(() => getAllFlatResults(), [getAllFlatResults]);
  const selectedItem = useMemo(() => getSelectedItem(), [selectedIndex, getSelectedItem]);

  const handleSelectCommand = (item) => {
    if (item?.route) {
      addToRecent(item);
      navigate(item.route);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && selectedItem) {
      e.preventDefault();
      handleSelectCommand(selectedItem);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      maxWidth={isMobile ? 'xs' : 'sm'}
      fullWidth={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? '16px' : '12px',
          maxHeight: '80vh',
          mt: isMobile ? undefined : -4,
          boxShadow: '0 20px 80px rgba(0, 0, 0, 0.3)',
          background: 'background.paper',
        },
      }}
    >
      {/* Search Input */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: { xs: 1.5, sm: 2 },
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <SearchIcon sx={{ fontSize: 22, color: 'text.secondary', flexShrink: 0 }} />
        <InputBase
          autoFocus
          fullWidth
          placeholder="Search routes, actions, or type / to see commands..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            fontSize: '1rem',
            '& input::placeholder': { color: 'text.secondary', opacity: 0.7 },
          }}
        />
        {query && (
          <Chip
            label="⌘K"
            size="small"
            variant="outlined"
            sx={{ height: 24, fontSize: '0.7rem' }}
          />
        )}
      </Box>

      {/* Results List */}
      <Box
        sx={{
          overflowY: 'auto',
          maxHeight: 'calc(80vh - 90px)',
          py: 1,
        }}
      >
        {flatResults.length === 0 && query.length > 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              No results for "{query}"
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Try searching for: Dashboard, Sales, Inventory, Settings
            </Typography>
          </Box>
        ) : (
          results.map((group, groupIdx) => (
            <Box key={groupIdx}>
              {/* Category Header */}
              {group.items.length > 0 && (
                <>
                  <Box sx={{ px: 2, py: 1, mt: groupIdx > 0 ? 0.5 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {CATEGORY_ICONS[group.category] && (
                        <Box sx={{ color: `${CATEGORY_COLORS[group.category]}.main`, display: 'flex' }}>
                          {CATEGORY_ICONS[group.category]}
                        </Box>
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                        }}
                      >
                        {group.category}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Category Items */}
                  <List dense sx={{ py: 0 }}>
                    {group.items.map((item, itemIdx) => {
                      const globalIdx = results
                        .slice(0, groupIdx)
                        .reduce((sum, g) => sum + g.items.length, 0) + itemIdx;
                      const isSelected = globalIdx === selectedIndex;

                      return (
                        <ListItem
                          key={item.id}
                          button
                          onClick={() => handleSelectCommand(item)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          sx={{
                            px: 2,
                            py: 1,
                            mx: 1,
                            borderRadius: 1,
                            transition: 'all 150ms',
                            backgroundColor: isSelected ? 'action.selected' : 'transparent',
                            '&:hover': { backgroundColor: 'action.hover' },
                            cursor: 'pointer',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              width: '100%',
                              gap: 2,
                            }}
                          >
                            <Box sx={{ color: `${CATEGORY_COLORS[group.category]}.main` }}>
                              {CATEGORY_ICONS[group.category]}
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: isSelected ? 600 : 500,
                                  color: 'text.primary',
                                }}
                              >
                                {item.label}
                              </Typography>
                            </Box>

                            {isSelected && (
                              <KeyboardReturnIcon
                                sx={{
                                  fontSize: 16,
                                  color: 'primary.main',
                                  opacity: 0.6,
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>

                  {groupIdx < results.length - 1 && <Divider sx={{ my: 0.5 }} />}
                </>
              )}
            </Box>
          ))
        )}
      </Box>

      {/* Footer Help */}
      {isOpen && !query && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            flexWrap: 'wrap',
            fontSize: '0.75rem',
            color: 'text.secondary',
            backgroundColor: 'background.default',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption">⌘K</Typography>
            <Typography variant="caption">Toggle</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption">↑↓</Typography>
            <Typography variant="caption">Navigate</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption">Enter</Typography>
            <Typography variant="caption">Select</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption">Esc</Typography>
            <Typography variant="caption">Close</Typography>
          </Box>
        </Box>
      )}
    </Dialog>
  );
};

export default CommandPalette;
