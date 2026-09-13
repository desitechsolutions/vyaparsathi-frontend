import { useState, useCallback } from 'react';

export const useExpenseFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState({
    status: initialFilters.status || null,
    startDate: initialFilters.startDate || null,
    endDate: initialFilters.endDate || null,
    categoryId: initialFilters.categoryId || null,
    employeeId: initialFilters.employeeId || null,
    page: initialFilters.page || 0,
    size: initialFilters.size || 25,
    ...initialFilters,
  });

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 0, // Reset to first page on filter change
    }));
  }, []);

  const updateMultipleFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 0,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      status: null,
      startDate: null,
      endDate: null,
      categoryId: null,
      employeeId: null,
      page: 0,
      size: 25,
    });
  }, []);

  const setPage = useCallback((page) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  }, []);

  return {
    filters,
    updateFilter,
    updateMultipleFilters,
    clearFilters,
    setPage,
  };
};
