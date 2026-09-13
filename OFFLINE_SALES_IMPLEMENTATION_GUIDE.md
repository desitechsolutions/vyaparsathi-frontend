# Offline Sales Creation & Payment - Enterprise Implementation Guide

**Status:** Not yet implemented  
**Priority:** High (Critical for SaaS)  
**Timeline:** 4-6 hours implementation + testing  
**Complexity:** Medium

---

## Current Status

✅ **Implemented:**
- Offline payment queue (localStorage with auto-sync)
- Multi-user isolation (user ID in queue)
- Auth validation on replay
- Token auto-clear on logout
- Error handling for all flows

❌ **Missing:**
- Offline sales creation (drafts saved locally)
- Offline inventory tracking (cached stock)
- Offline queue replay for sales
- Sync status indicator
- Conflict resolution

---

## Recommended Architecture

### 1. Offline Sales Queue (Like Payments)

```javascript
// localStorage key structure
const OFFLINE_SALES_QUEUE_KEY = 'vyaparsathi_offline_sales_v1';

// Each offline sale:
{
  _offlineId: 'uuid-123',                // Unique identifier
  _queuedAt: 1693046400000,              // Timestamp
  _queuedByUserId: 'user-456',           // Security: validate on replay
  _queuedByShopId: 'shop-789',           // Multi-tenant support
  _queuedByToken: 'jwt-hash',            // Token validation
  _status: 'pending' | 'synced' | 'failed',
  
  // Sale data (same format as backend)
  customerId: 'cust-123',
  items: [
    { variantId: 'var-1', qty: 5, unitPrice: 100, discount: 10 },
    { variantId: 'var-2', qty: 2, unitPrice: 50, discount: 0 },
  ],
  totalAmount: 540,
  discount: 10,
  isGstRequired: 'yes',
  paymentMethods: [{ method: 'Cash', amount: 540 }],
  saleNotes: 'Created while offline',
}
```

### 2. Inventory Cache (Last Known Stock)

```javascript
// localStorage key structure
const INVENTORY_CACHE_KEY = 'vyaparsathi_inventory_cache_v1';

// Cache structure (updated on each inventory load)
{
  'variant-123': { sku: 'ABC001', name: 'Item A', currentStock: 100, timestamp: 1693046400000 },
  'variant-456': { sku: 'ABC002', name: 'Item B', currentStock: 50, timestamp: 1693046400000 },
  // ... more variants
}

// Validation when creating offline sale:
// - User can only sell items that exist in cache (were fetched when online)
// - Qty cannot exceed cached stock
// - Shows "Stock from [time]" warning
// - On sync: backend validates against ACTUAL stock, rejects if exceeded
```

### 3. Offline Detection & UI Indicators

```javascript
// Show user they're offline:
// 1. Banner at top of SalesPage
// 2. "Offline" badge in header
// 3. "Will sync when online" below Save button
// 4. Disabled ability to load new data (can only use cached)

// Example banner:
<Alert severity="warning" icon={<OfflineIcon />}>
  📱 You're offline. Sales will sync when internet returns. 
  Stock data is from {lastCachedTime.toLocaleTimeString()}.
</Alert>
```

---

## Implementation Steps

### Step 1: Create useOfflineSalesQueue Hook

**File:** `src/hooks/useOfflineSalesQueue.js`

```javascript
import { useCallback, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';

const OFFLINE_SALES_QUEUE_KEY = 'vyaparsathi_offline_sales_v1';

export function useOfflineSalesQueue() {
  const { user: authUser } = useAuthContext();
  const [queuedSalesCount, setQueuedSalesCount] = useState(0);

  const enqueueOfflineSale = useCallback((saleData) => {
    if (!authUser?.sub) throw new Error('Not authenticated');

    try {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_SALES_QUEUE_KEY) || '[]');
      
      const offlineSale = {
        _offlineId: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        _queuedAt: Date.now(),
        _queuedByUserId: authUser.sub,
        _queuedByShopId: authUser.shopId,
        _queuedByToken: authUser.token,
        _status: 'pending',
        ...saleData,
      };

      queue.push(offlineSale);
      localStorage.setItem(OFFLINE_SALES_QUEUE_KEY, JSON.stringify(queue));
      setQueuedSalesCount(queue.length);

      return offlineSale._offlineId;
    } catch (err) {
      console.error('Failed to queue offline sale:', err);
      throw err;
    }
  }, [authUser]);

  const getQueuedSales = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_SALES_QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  }, []);

  const clearQueue = useCallback(() => {
    localStorage.removeItem(OFFLINE_SALES_QUEUE_KEY);
    setQueuedSalesCount(0);
  }, []);

  return {
    enqueueOfflineSale,
    getQueuedSales,
    clearQueue,
    queuedSalesCount,
  };
}
```

### Step 2: Create useInventoryCache Hook

**File:** `src/hooks/useInventoryCache.js`

```javascript
import { useCallback, useState, useEffect } from 'react';

const INVENTORY_CACHE_KEY = 'vyaparsathi_inventory_cache_v1';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useInventoryCache() {
  const [cachedTime, setCachedTime] = useState(null);

  const cacheInventory = useCallback((variants) => {
    try {
      const cache = {};
      variants.forEach(v => {
        cache[v.id] = {
          sku: v.sku,
          name: v.itemName,
          currentStock: v.currentStock,
          timestamp: Date.now(),
        };
      });
      localStorage.setItem(INVENTORY_CACHE_KEY, JSON.stringify(cache));
      setCachedTime(new Date());
    } catch (err) {
      console.error('Failed to cache inventory:', err);
    }
  }, []);

  const getCachedInventory = useCallback(() => {
    try {
      const cache = JSON.parse(localStorage.getItem(INVENTORY_CACHE_KEY) || '{}');
      return cache;
    } catch {
      return {};
    }
  }, []);

  const validateOfflineSaleQty = useCallback((variantId, qty) => {
    const cache = getCachedInventory();
    const item = cache[variantId];
    
    if (!item) {
      return { valid: false, reason: 'Item not in cache (was not loaded when online)' };
    }
    
    if (qty > item.currentStock) {
      return {
        valid: false,
        reason: `Qty ${qty} exceeds cached stock ${item.currentStock}. Actual stock may differ.`,
      };
    }

    return { valid: true };
  }, [getCachedInventory]);

  const isCacheExpired = useCallback(() => {
    try {
      const data = JSON.parse(localStorage.getItem(INVENTORY_CACHE_KEY) || '{}');
      const firstItemTimestamp = Object.values(data)[0]?.timestamp;
      if (!firstItemTimestamp) return true;
      return (Date.now() - firstItemTimestamp) > CACHE_EXPIRY_MS;
    } catch {
      return true;
    }
  }, []);

  return {
    cacheInventory,
    getCachedInventory,
    validateOfflineSaleQty,
    isCacheExpired,
    cachedTime,
  };
}
```

### Step 3: Integrate into SalesPage

**Modifications:** `src/pages/Sales.jsx`

```javascript
import { useOfflineSalesQueue } from '../hooks/useOfflineSalesQueue';
import { useInventoryCache } from '../hooks/useInventoryCache';

// In Sales component:
const { enqueueOfflineSale, getQueuedSales, queuedSalesCount } = useOfflineSalesQueue();
const { cacheInventory, validateOfflineSaleQty, cachedTime } = useInventoryCache();
const [isOffline, setIsOffline] = useState(!navigator.onLine);

// Cache inventory when loaded
useEffect(() => {
  if (variants.length > 0) {
    cacheInventory(variants);
  }
}, [variants, cacheInventory]);

// Detect offline
useEffect(() => {
  const handleOnline = () => setIsOffline(false);
  const handleOffline = () => setIsOffline(true);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// Modify save handler
const handleSave = async () => {
  try {
    // Validate offline sale quantities
    if (isOffline) {
      for (const item of formData.items) {
        const validation = validateOfflineSaleQty(item.variantId, item.qty);
        if (!validation.valid) {
          showSnackbar(`Cannot save: ${validation.reason}`, 'error');
          return;
        }
      }
    }

    // If offline, queue locally
    if (isOffline) {
      const offlineId = enqueueOfflineSale(formData);
      showSnackbar(`Sale queued offline (ID: ${offlineId.substr(0, 8)}). Will sync when online.`, 'success');
      resetForm();
      return;
    }

    // If online, save normally
    const response = await createSale(formData);
    showSnackbar('Sale created successfully', 'success');
    resetForm();
  } catch (err) {
    showSnackbar('Failed to save sale', 'error');
  }
};

// Show offline banner
return (
  <>
    {isOffline && (
      <Alert severity="warning" sx={{ mb: 2 }}>
        📱 Offline Mode | Stock data from {cachedTime?.toLocaleTimeString() || 'not loaded'} | 
        {queuedSalesCount} sale(s) queued
      </Alert>
    )}
    {/* Rest of form */}
  </>
);
```

### Step 4: Create useOfflineSalesReplay Hook

**File:** `src/hooks/useOfflineSalesReplay.js`

```javascript
import { useEffect, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { createSale } from '../services/api';

export function useOfflineSalesReplay() {
  const { user: authUser } = useAuthContext();
  const QUEUE_KEY = 'vyaparsathi_offline_sales_v1';

  const replaySales = useCallback(async () => {
    if (!authUser?.sub) return { succeeded: 0, failed: 0 };

    try {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      if (queue.length === 0) return { succeeded: 0, failed: 0 };

      let succeeded = 0;
      let failed = 0;

      for (const sale of queue) {
        // Security: Validate user hasn't changed
        if (sale._queuedByUserId !== authUser.sub) {
          // Different user — skip this sale
          console.warn('Skipping offline sale from different user');
          failed++;
          continue;
        }

        try {
          // Send to backend (without the offline metadata)
          const { _offlineId, _queuedAt, _queuedByUserId, _queuedByShopId, _queuedByToken, _status, ...saleData } = sale;
          await createSale(saleData);
          succeeded++;
        } catch (err) {
          console.error('Failed to replay sale:', err);
          failed++;
        }
      }

      // Clear queue after attempting all sales
      localStorage.removeItem(QUEUE_KEY);

      return { succeeded, failed };
    } catch (err) {
      console.error('Error replaying sales:', err);
      return { succeeded: 0, failed: 0 };
    }
  }, [authUser, QUEUE_KEY]);

  // Auto-replay when coming online
  useEffect(() => {
    const handleOnline = async () => {
      const result = await replaySales();
      if (result.succeeded > 0) {
        console.log(`Replayed ${result.succeeded} offline sales`);
      }
      if (result.failed > 0) {
        console.warn(`Failed to replay ${result.failed} sales`);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [replaySales]);

  return { replaySales };
}
```

---

## Testing Offline Sales

### Test Case 1: Create Sale While Offline
```
1. Open SalesPage
2. DevTools > Network > Offline
3. Select customer, add items
4. Click "Save"
   ✅ Should see "Sale queued offline" message
   ✅ Sale should appear in queue
   ✅ Form should reset
5. Go online (DevTools > Online)
   ✅ Should see "Replaying X sale(s)" message
   ✅ Sale should appear in SalesHistory
```

### Test Case 2: Inventory Validation (Offline)
```
1. Online: Load SalesPage (cache inventory)
2. Offline: Try to sell 200 units of item with cached stock of 50
   ✅ Should show "Qty 200 exceeds cached stock 50"
   ❌ Should NOT allow saving
3. Reduce qty to 50, save
   ✅ Should allow save (meets cache limit)
```

### Test Case 3: Multi-User Scenario
```
1. User A: Create offline sale while offline
2. User A logs out
3. User B logs in
4. Go online
   ✅ User B's offline queue should be empty
   ✅ User A's sale should NOT replay under User B
5. User A logs in again
   ✅ Their offline sale should replay
```

### Test Case 4: Sync Status Indicator
```
1. Offline: Create 3 sales
2. Header should show:
   ✅ "Offline" badge
   ✅ "3 sales queued"
   ✅ "Stock from [timestamp]"
3. Go online
   ✅ Badge changes to "Syncing..."
   ✅ Then back to "Online"
   ✅ Queue count goes to 0
```

---

## Comparison: Recommended Approach

### Option A: Queue + Sync (Recommended ⭐)
**Like:** Payments, Google Docs
```
✅ Save locally first (instant feedback)
✅ Queue for later sync
✅ Auto-sync when online
✅ User always has control
✅ Works for SaaS
```

### Option B: Prevent Creation (NOT recommended)
```
❌ Error when offline: "Cannot create sales offline"
❌ Bad UX
❌ Loses sales
❌ Not SaaS-like
```

### Option C: Service Worker + Sync (Complex)
```
✅ Better offline handling
❌ Requires Service Worker setup
❌ More maintenance
❌ For next phase
```

---

## Deployment Checklist

- [ ] Create useOfflineSalesQueue hook
- [ ] Create useInventoryCache hook
- [ ] Create useOfflineSalesReplay hook
- [ ] Integrate into SalesPage
- [ ] Add offline indicator UI
- [ ] Test all 4 test cases
- [ ] Test mobile offline (DevTools)
- [ ] Test with 2+ users
- [ ] Deploy to production
- [ ] Monitor: Queue sizes in localStorage
- [ ] Monitor: Replay success rate

---

## Benefits (SaaS-Grade)

✅ **User Experience**
- No lost data
- Instant feedback (save works offline)
- Auto-sync (no manual refresh needed)

✅ **Business**
- Never lose a sale
- Offline = happy salespeople
- Competitive advantage

✅ **Technical**
- Same pattern as payments (proven)
- Scalable to other entities
- Single source of truth (backend)

---

## Timeline

**Phase 1:** Setup hooks + UI integration (2-3 hours)
**Phase 2:** Testing + fixes (1-2 hours)
**Phase 3:** Deployment + monitoring (1 hour)

**Total:** 4-6 hours

---

## Next Steps

1. **Implement hooks** (2h)
2. **Integrate SalesPage** (1h)
3. **Add offline indicators** (30 min)
4. **Test thoroughly** (1.5h)
5. **Deploy** (30 min)

**Start with:** Create `useOfflineSalesQueue.js` hook first

