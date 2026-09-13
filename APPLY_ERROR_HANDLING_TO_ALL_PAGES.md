# Apply Enterprise Error Handling to All Pages

**Date:** 2026-08-24  
**Status:** Implementation Guide + Priority List

---

## Quick Summary

The error handling pattern has 3 components:
1. **ErrorState.jsx** - Professional error page UI
2. **useDataLoading.js** - Error detection + loading state
3. **Implementation** - Apply pattern to pages

This guide shows how to apply it systematically.

---

## Pattern: Before & After

### Before (Current state)
```javascript
const [loading, setLoading] = useState(true);

useEffect(() => {
  setLoading(true);
  fetchData()
    .then(data => setData(data))
    .catch(err => showSnackbar('Error: ' + err.message))
    .finally(() => setLoading(false));
}, []);

if (loading) return <CircularProgress />;
return <PageContent />;
```

**Problems:**
- On error: Shows toast + spinner (confusing)
- No proper error UI
- No recovery mechanism
- Not enterprise-grade

### After (New pattern)
```javascript
const { loading, error, executeLoad } = useDataLoading();

useEffect(() => {
  executeLoad(async () => {
    const data = await fetchData();
    setData(data);
  });
}, [executeLoad]);

if (error) return <ErrorState error={error} onRetry={handleLoad} />;
if (loading) return <LoadingSkeletons />;
return <PageContent />;
```

**Benefits:**
- On error: Shows professional error page
- Clear error message
- Retry button
- Go Home button
- Enterprise-grade UX

---

## Implementation Steps

### Step 1: Add imports to your page
```javascript
import ErrorState from '../../components/common/ErrorState';
import useDataLoading from '../../hooks/useDataLoading';
```

### Step 2: Initialize the hook
```javascript
const { loading, error, executeLoad, clearError } = useDataLoading();
```

### Step 3: Wrap data loading in executeLoad()
```javascript
useEffect(() => {
  executeLoad(async () => {
    const data = await fetchData();
    setData(data);
  });
}, [executeLoad]);
```

### Step 4: Add error state check
```javascript
if (error) return <ErrorState error={error} onRetry={handleLoad} />;
if (loading) return <LoadingSkeleton />;
return <PageContent />;
```

---

## Priority Pages (Apply First)

### High Priority (Critical user flows)
1. **ItemsPage** - Inventory management
2. **CustomersPage** - Customer data
3. **SalesPage** - Sales management  
4. **PurchaseOrderPage** - Purchase orders
5. **PaymentHistoryPage** - Payment data

### Medium Priority (Common flows)
6. **SettingsPage** - Configuration
7. **ReportsPage** - Analytics
8. **ReceivingPage** - Receiving
9. **SupplierPaymentPage** - Supplier payments
10. **DebitNoteListPage** - Debit notes

### Low Priority (Admin/Setup)
11. **UserManagementPage** - User admin
12. **TeamPage** - Team management
13. **RolesPermissionPage** - Role management
14. **CustomFieldsPage** - Custom fields

---

## ItemsPage - Complete Example

**File:** `src/pages/ItemsPage.jsx`

```javascript
// Add imports
import ErrorState from '../../components/common/ErrorState';
import useDataLoading from '../../hooks/useDataLoading';

export default function ItemsPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  // ← ADD: Initialize error handling
  const { loading, error, executeLoad, clearError } = useDataLoading();

  const {
    loading: itemsLoading,
    itemsWithVariants,
    loadData,
    // ... other hooks
  } = useItemsLogic();

  // ← MODIFY: Wrap loadData in executeLoad
  const handleLoadItems = useCallback(async () => {
    await executeLoad(async () => {
      await loadData();
    });
  }, [executeLoad, loadData]);

  useEffect(() => {
    handleLoadItems();
  }, [handleLoadItems]);

  // ← ADD: Error state before loading check
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={handleLoadItems}
        showGoHome={true}
      />
    );
  }

  // Existing loading state check
  if (loading || itemsLoading) {
    return <ItemsLoadingSkeleton />;
  }

  // Existing page content
  return <ItemsGrid items={itemsWithVariants} />;
}
```

---

## CustomersPage - Pattern

```javascript
import ErrorState from '../../components/common/ErrorState';
import useDataLoading from '../../hooks/useDataLoading';

export default function CustomersPage() {
  const { loading, error, executeLoad } = useDataLoading();
  const [customers, setCustomers] = useState([]);

  const handleLoadCustomers = useCallback(async () => {
    await executeLoad(async () => {
      const response = await fetchCustomers();
      setCustomers(response.data || []);
    });
  }, [executeLoad]);

  useEffect(() => {
    handleLoadCustomers();
  }, [handleLoadCustomers]);

  // Error page
  if (error) return <ErrorState error={error} onRetry={handleLoadCustomers} />;
  
  // Loading state
  if (loading) return <CustomersLoadingSkeleton />;
  
  // Success
  return <CustomersGrid customers={customers} />;
}
```

---

## SalesPage - Pattern

```javascript
import ErrorState from '../../components/common/ErrorState';
import useDataLoading from '../../hooks/useDataLoading';

export default function SalesPage() {
  const { loading, error, executeLoad } = useDataLoading();
  const [sales, setSales] = useState([]);

  const handleLoadSales = useCallback(async () => {
    await executeLoad(async () => {
      const response = await fetchSales();
      setSales(response.data || []);
    });
  }, [executeLoad]);

  useEffect(() => {
    handleLoadSales();
  }, [handleLoadSales]);

  if (error) return <ErrorState error={error} onRetry={handleLoadSales} />;
  if (loading) return <SalesLoadingSkeleton />;
  
  return <SalesGrid sales={sales} />;
}
```

---

## Checklist: Apply to All Pages

### High Priority (This week)
- [ ] ItemsPage
- [ ] CustomersPage
- [ ] SalesPage
- [ ] PurchaseOrderPage
- [ ] PaymentHistoryPage

### Medium Priority (Next week)
- [ ] SettingsPage
- [ ] ReportsPage
- [ ] ReceivingPage
- [ ] SupplierPaymentPage
- [ ] DebitNoteListPage

### Low Priority (Following week)
- [ ] UserManagementPage
- [ ] TeamPage
- [ ] RolesPermissionPage
- [ ] CustomFieldsPage

---

## Testing Each Page

After applying the pattern:

1. **Test: Backend Down**
   - Stop backend
   - Open page
   - ✅ Should show error page (not spinner)
   - ✅ "Try Again" button should work

2. **Test: Network Error**
   - Go offline (DevTools)
   - Refresh page
   - ✅ Should show "Connection error"
   - ✅ Go online, retry → should work

3. **Test: Server Error**
   - Mock API 500 error
   - ✅ Should show "Server error"
   - ✅ Retry should work

4. **Test: Mobile**
   - Test on 375px width
   - ✅ Error page readable
   - ✅ Buttons touchable

---

## Common Patterns

### With Search/Filter
```javascript
const handleSearch = useCallback(async (query) => {
  await executeLoad(async () => {
    const response = await searchItems(query);
    setResults(response.data);
  });
}, [executeLoad]);
```

### With Pagination
```javascript
const handlePageChange = useCallback(async (page) => {
  await executeLoad(async () => {
    const response = await fetchItems({ page });
    setItems(response.data);
  });
}, [executeLoad]);
```

### With Refresh
```javascript
const handleRefresh = useCallback(async () => {
  await executeLoad(async () => {
    const data = await fetchData();
    setData(data);
  });
}, [executeLoad]);
```

---

## Benefits Summary

| Before | After |
|--------|-------|
| Spinner indefinitely | Error page immediately |
| Multiple toasts | Single professional message |
| No recovery path | Clear retry button |
| Not enterprise | Production-grade UX |
| Confusing for users | User understands what happened |

---

## Files to Modify

1. **ItemsPage.jsx** - High priority
2. **Customers.jsx** - High priority
3. **SalesPage.jsx** - High priority
4. **PurchaseOrderPage.jsx** - High priority
5. **ReportsPage.jsx** - Medium priority
6. **SettingsPage.jsx** - Medium priority
7. **ReceivingPage.jsx** - Medium priority
8. Plus others as needed

---

## New Files Created

1. ✅ **ErrorState.jsx** - Error page component
2. ✅ **useDataLoading.js** - Error handling hook

---

## Result

After applying to all pages:
- ✅ Professional error UX across entire app
- ✅ No more confusing toast spam
- ✅ No more infinite loading spinners
- ✅ Clear error messages
- ✅ Recovery mechanism everywhere
- ✅ Enterprise-grade experience

---

## Quick Checklist for Each Page

- [ ] Import ErrorState
- [ ] Import useDataLoading  
- [ ] Initialize hook: `const { loading, error, executeLoad } = useDataLoading();`
- [ ] Wrap data loading: `await executeLoad(async () => { ... })`
- [ ] Add error check: `if (error) return <ErrorState ... />;`
- [ ] Test: Backend down → Error page shows
- [ ] Test: Network error → Error page shows
- [ ] Test: Mobile → Responsive
- [ ] Test: Retry button works

---

**Status:** ✅ READY TO IMPLEMENT  
**Pattern:** Proven on PaymentPage  
**Files Needed:** 2 (already created)  
**Time to Apply:** ~10 min per page  
**Total Pages:** ~15 high/medium priority  

**Start with ItemsPage, then roll out to others.**
