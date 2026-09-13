/**
 * Hook for managing offline sales queue
 *
 * CRITICAL-1: Re-exports the unified single-instance hook from OfflineSalesContext.
 * This ensures all components share the same state, timers, and connectivity checks.
 */

import { useOfflineSalesContext } from '../context/OfflineSalesContext';

export function useOfflineSales() {
  return useOfflineSalesContext();
}

export default useOfflineSales;
