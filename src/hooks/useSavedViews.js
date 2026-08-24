/**
 * useSavedViews — localStorage-backed saved views for list pages.
 *
 * Storage key: `savedViews[${pageKey}]`
 * Each view: { id, name, createdAt, filterState, description? }
 *
 * @param {string} pageKey  e.g. 'customers', 'items', 'purchase_orders'
 * @returns {object}
 */

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = (page) => `savedViews[${page}]`;

function readFromStorage(pageKey) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(pageKey));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeToStorage(pageKey, views) {
  try {
    localStorage.setItem(STORAGE_KEY(pageKey), JSON.stringify(views));
  } catch {
    // Storage full — fail silently
  }
}

export function useSavedViews(pageKey) {
  const [savedViews, setSavedViews] = useState(() => readFromStorage(pageKey));

  // Stay in sync if another tab writes the same storage key
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY(pageKey)) {
        setSavedViews(readFromStorage(pageKey));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [pageKey]);

  /**
   * Save the current filter state as a named view.
   * @param {string} name
   * @param {object} filterState  { logic, conditions }
   * @param {string} [description]
   * @returns {object} the saved view
   */
  const saveView = useCallback(
    (name, filterState, description = '') => {
      const view = {
        id: `${pageKey}_${Date.now()}`,
        name: name.trim(),
        description,
        createdAt: new Date().toISOString(),
        filterState,
      };
      setSavedViews((prev) => {
        // Deduplicate by name (replace if same name)
        const filtered = prev.filter((v) => v.name.toLowerCase() !== name.trim().toLowerCase());
        const next = [view, ...filtered];
        writeToStorage(pageKey, next);
        return next;
      });
      return view;
    },
    [pageKey]
  );

  /**
   * Delete a saved view by id.
   * @param {string} id
   */
  const deleteView = useCallback(
    (id) => {
      setSavedViews((prev) => {
        const next = prev.filter((v) => v.id !== id);
        writeToStorage(pageKey, next);
        return next;
      });
    },
    [pageKey]
  );

  /**
   * Rename an existing view.
   * @param {string} id
   * @param {string} newName
   */
  const renameView = useCallback(
    (id, newName) => {
      setSavedViews((prev) => {
        const next = prev.map((v) => (v.id === id ? { ...v, name: newName.trim() } : v));
        writeToStorage(pageKey, next);
        return next;
      });
    },
    [pageKey]
  );

  /**
   * Export all saved views to a JSON file.
   */
  const exportViews = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ pageKey, views: savedViews }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved_views_${pageKey}_${new Date().toISOString().slice(0, 10)}.json`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [pageKey, savedViews]);

  return {
    savedViews,
    saveView,
    deleteView,
    renameView,
    exportViews,
  };
}
