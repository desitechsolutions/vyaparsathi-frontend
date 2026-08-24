import { useState, useCallback } from 'react';

/**
 * useSelection — generic multi-select state manager for list pages.
 *
 * Usage:
 *   const { selectedIds, toggleSelect, selectAll, clearSelection, isSelected } =
 *     useSelection();
 *
 * Works with MUI DataGrid's rowSelectionModel (pass selectedIds, subscribe to
 * onRowSelectionModelChange → setSelectedIds) and with plain Table checkbox
 * patterns (call toggleSelect / selectAll directly).
 */
export function useSelection(initialIds = []) {
  const [selectedIds, setSelectedIds] = useState(initialIds);

  /** Toggle a single ID in / out of the selection set. */
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  /**
   * Select all IDs from a source array.
   * If all are already selected, the call clears the selection instead
   * (toggle-all behaviour, mirrors MUI DataGrid built-in header checkbox).
   */
  const selectAll = useCallback((allIds) => {
    setSelectedIds((prev) => {
      const allSelected = allIds.length > 0 && allIds.every((id) => prev.includes(id));
      return allSelected ? [] : allIds;
    });
  }, []);

  /** Clear the entire selection. */
  const clearSelection = useCallback(() => setSelectedIds([]), []);

  /** Predicate: is this ID currently selected? */
  const isSelected = useCallback((id) => selectedIds.includes(id), [selectedIds]);

  return {
    selectedIds,
    setSelectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount: selectedIds.length,
  };
}
