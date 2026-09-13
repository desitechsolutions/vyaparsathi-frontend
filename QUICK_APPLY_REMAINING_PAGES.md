# Quick Reference: Apply Error Handling to Remaining Pages

**For the 10+ remaining pages, follow this 3-minute pattern per page**

---

## Copy-Paste Template

### Step 1: Add Imports (At Top)
```javascript
import ErrorState from '../components/common/ErrorState';
import useDataLoading from '../hooks/useDataLoading';
```

### Step 2: Initialize Hook (In Component)
```javascript
const { loading: loadError, error, executeLoad } = useDataLoading();
```

### Step 3: Wrap Data Loading (Find your main loadData/refreshData)
```javascript
const handleLoadData = useCallback(async () => {
  await executeLoad(async () => {
    await refreshData(); // or loadData() or your fetch function
  });
}, [executeLoad, refreshData]);

useEffect(() => {
  handleLoadData();
}, [handleLoadData]);
```

### Step 4: Add Error Check (Before Main Return)
```javascript
if (error) {
  return <ErrorState error={error} onRetry={handleLoadData} />;
}

// Rest of component JSX here
```

---

## Medium Priority Pages (6 pages - This Week)

### 1. ReportsPage
**File:** `src/pages/reports/ReportsPage.jsx` or similar
**Load function:** Search for `useReports()` or `fetchReports()`
**Steps:** Apply template above
**Time:** 5 min

### 2. ReceivingPage
**File:** `src/pages/receiving/ReceivingPage.jsx` or similar
**Load function:** Search for `fetchReceivingData()` or similar
**Steps:** Apply template
**Time:** 5 min

### 3. SupplierPaymentPage
**File:** `src/pages/payments/SupplierPaymentPage.jsx`
**Load function:** Search for `useSupplierPayments()` or `loadSupplierPayments()`
**Steps:** Apply template
**Time:** 5 min

### 4. DebitNoteListPage
**File:** `src/pages/debit-notes/DebitNoteListPage.jsx` or similar
**Load function:** Search for `fetchDebitNotes()` or `useDebitNotes()`
**Steps:** Apply template
**Time:** 5 min

### 5. SalesReturnPage
**File:** `src/pages/SalesReturn.jsx`
**Load function:** Search for `loadReturns()` or `fetchReturns()`
**Steps:** Apply template
**Time:** 5 min

### 6. Additional Reports Pages
**Files:** `src/pages/reports/*.jsx`
**Load function:** Varies per page
**Steps:** Apply template
**Time:** 5 min each

---

## Low Priority Pages (4+ pages - Next Week)

### 1. UserManagementPage
**File:** `src/pages/admin/UserManagementPage.jsx`
**Load function:** `fetchUsers()` or similar
**Steps:** Apply template
**Time:** 5 min

### 2. TeamPage
**File:** `src/pages/TeamPage.jsx`
**Load function:** `fetchTeam()` or `useTeam()`
**Steps:** Apply template
**Time:** 5 min

### 3. RolesPermissionPage
**File:** `src/pages/admin/RolesPermissionPage.jsx`
**Load function:** `fetchRoles()` or similar
**Steps:** Apply template
**Time:** 5 min

### 4. CustomFieldsPage
**File:** `src/pages/settings/CustomFieldsPage.jsx`
**Load function:** `fetchCustomFields()` or similar
**Steps:** Apply template
**Time:** 5 min

---

## Find Your LoadData Function

**Search in your component:**
1. Look for hook like `useItemsLogic()` or `useCustomers()`
2. Or search for function like `fetchItems()`, `loadData()`, `refreshData()`
3. This is your target for `executeLoad(async () => { ... })`

**Example:**
```javascript
// Find this:
const { loading, items, loadData } = useItems();

// Wrap this in executeLoad:
const handleLoad = useCallback(async () => {
  await executeLoad(async () => {
    await loadData();
  });
}, [executeLoad, loadData]);
```

---

## Verification Checklist (Per Page)

After applying the pattern:

- [ ] Imports added at top
- [ ] Hook initialized
- [ ] Callback wraps loadData/refreshData
- [ ] useEffect calls callback
- [ ] Error check added before main return
- [ ] Test: Backend down → Error page shows
- [ ] Test: "Try Again" button works
- [ ] Test: "Go Home" button works
- [ ] Test: Mobile responsive (375px)

---

## Common Variations

### Multiple Data Loads (Like SalesPage)
```javascript
const handleLoad = useCallback(async () => {
  await executeLoad(async () => {
    await Promise.all([
      loadCustomers(),
      loadItems(),
      loadReports()
    ]);
  });
}, [executeLoad, loadCustomers, loadItems, loadReports]);
```

### Using Hook's RefreshData
```javascript
const { loading, data, refreshData } = useMyHook();

const handleLoad = useCallback(async () => {
  await executeLoad(async () => {
    await refreshData();
  });
}, [executeLoad, refreshData]);
```

### No Existing Hook (Direct API Call)
```javascript
const handleLoad = useCallback(async () => {
  await executeLoad(async () => {
    const data = await fetchData();
    setData(data);
  });
}, [executeLoad]);
```

---

## Total Effort

- **Medium Priority:** 6 pages × 5 min = 30 min
- **Low Priority:** 4+ pages × 5 min = 20+ min
- **Testing all:** 30 min
- **Total:** ~1.5 hours

---

## Order to Apply

**Priority:**
1. ReportsPage (most traffic)
2. ReceivingPage
3. SupplierPaymentPage
4. SalesReturnPage
5. DebitNoteListPage
6. Additional reports

---

## Files You'll Modify

```
src/pages/
├── ReportsPage.jsx (Medium)
├── ReceivingPage.jsx (Medium)
├── payments/
│   └── SupplierPaymentPage.jsx (Medium)
├── debit-notes/
│   └── DebitNoteListPage.jsx (Medium)
├── SalesReturn.jsx (Medium)
├── admin/
│   ├── UserManagementPage.jsx (Low)
│   └── RolesPermissionPage.jsx (Low)
├── TeamPage.jsx (Low)
└── settings/
    └── CustomFieldsPage.jsx (Low)
```

---

## Success Criteria

✅ All medium priority pages have error handling  
✅ All low priority pages have error handling  
✅ Backend down → Error pages on all flows  
✅ No more infinite spinners anywhere  
✅ Enterprise-grade error UX across entire app  
✅ Mobile responsive on all pages  

---

## After This Is Done

**Result:** 15+ pages with professional error handling (ItemsPage, CustomersPage, SalesPage, PurchaseOrderPage, SettingsPage + 10 more)

**User Experience:**
- ✅ No more confusing spinners
- ✅ Clear error messages
- ✅ Professional recovery options
- ✅ Mobile responsive
- ✅ Enterprise-grade SaaS app

---

**Estimated Time to Complete:** 2-3 hours total  
**Pattern:** Proven, consistent, tested  
**Quality:** Production-grade  

