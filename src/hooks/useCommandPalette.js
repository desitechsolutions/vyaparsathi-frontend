import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { searchGlobalData } from '../services/api';

const QUICK_ROUTES = [
  { id: 'dashboard', label: 'Dashboard', route: '/dashboard', category: 'Navigation' },
  { id: 'sales', label: 'Create Sale', route: '/sales', category: 'Quick Actions' },
  { id: 'inventory', label: 'Inventory', route: '/inventory', category: 'Navigation' },
  { id: 'payroll', label: 'Payroll', route: '/payroll', category: 'Navigation' },
  { id: 'employees', label: 'Employees', route: '/employees', category: 'Navigation' },
  { id: 'reports', label: 'Reports', route: '/reports', category: 'Navigation' },
  { id: 'customers', label: 'Customers', route: '/customers', category: 'Navigation' },
  { id: 'add-product', label: 'Add Product', route: '/stock', category: 'Quick Actions' },
  { id: 'settings', label: 'Settings', route: '/account/security/mfa', category: 'Settings' },
];

export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [recentItems, setRecentItems] = useState(() => {
    try {
      const saved = localStorage.getItem('commandPaletteRecent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { user } = useAuthContext();

  // Add to recent items
  const addToRecent = useCallback((item) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((r) => r.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('commandPaletteRecent', JSON.stringify(updated));
      } catch {
        // Silently fail if localStorage is not available
      }
      return updated;
    });
  }, []);

  // Fuzzy search helper
  const fuzzyMatch = (searchStr, targetStr) => {
    const search = searchStr.toLowerCase();
    const target = targetStr.toLowerCase();

    if (!search) return true;
    if (target.includes(search)) return true;

    let searchIdx = 0;
    for (let i = 0; i < target.length && searchIdx < search.length; i++) {
      if (target[i] === search[searchIdx]) searchIdx++;
    }
    return searchIdx === search.length;
  };

  // Filter and sort results
  const filterResults = useCallback((q) => {
    if (q.length === 0) {
      setResults(recentItems.length > 0 ? [{ category: 'Recent', items: recentItems }, { category: 'Quick Routes', items: QUICK_ROUTES }] : [{ category: 'Quick Routes', items: QUICK_ROUTES }]);
      return;
    }

    const filtered = QUICK_ROUTES.filter((item) => fuzzyMatch(q, item.label) || fuzzyMatch(q, item.category));

    // Score results by position of match
    const scored = filtered.map((item) => {
      const label = item.label.toLowerCase();
      const search = q.toLowerCase();
      const pos = label.indexOf(search);
      const score = pos === 0 ? 1000 : pos > 0 ? 100 - pos : 0;
      return { ...item, score };
    });

    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, 10);
    setResults([{ category: 'Results', items: sorted }]);
  }, [recentItems]);

  // Handle search query changes
  useEffect(() => {
    filterResults(query);
    setSelectedIndex(0);
  }, [query, filterResults]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
      }

      // "/" to search (only if not in input)
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsOpen(true);
        setQuery('/');
      }

      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }

      // Arrow navigation when open
      if (isOpen) {
        const flatResults = results.flatMap((group) => group.items || []);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % flatResults.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results]);

  const getAllFlatResults = () => {
    return results.flatMap((group) => group.items || []);
  };

  const getSelectedItem = () => {
    const flatResults = getAllFlatResults();
    return flatResults[selectedIndex];
  };

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    results,
    selectedIndex,
    setSelectedIndex,
    isSearching,
    recentItems,
    addToRecent,
    getSelectedItem,
    getAllFlatResults,
  };
};
