# Enterprise Expenses Frontend - Complete Integration & Wiring

**Status**: ✅ **FULLY WIRED & READY FOR PAGE DEVELOPMENT**  
**Date**: 2026-08-25  
**Frontend Files Created**: 10 files  
**API Endpoints Wired**: 20+  
**Custom Hooks**: 5  
**Reusable Components**: 4  

---

## Frontend Architecture

### API Layer Integration (Complete)

**File**: `src/services/endpoints.js`  
- Added 20 expense-specific endpoint definitions
- All expense operations mapped to backend APIs

**File**: `src/services/api.js`  
- Added 45+ API functions for enterprise expenses
- Full CRUD operations wired
- Approval workflow endpoints
- Analytics & reporting endpoints
- Reconciliation endpoints

### Custom Hooks (5 files) - 100% Ready

#### 1. useExpenses Hook
```javascript
// src/hooks/useExpenses.js
- fetchExpenses(params)
- createExpense(data)
- updateExpense(id, data)
- deleteExpense(id)
- State: expenses, loading, error, pagination
```
**Use Case**: Main expense CRUD operations

#### 2. useExpenseFilters Hook
```javascript
// src/hooks/useExpenseFilters.js
- updateFilter(key, value)
- updateMultipleFilters(newFilters)
- clearFilters()
- setPage(page)
- State: filters object with status, dates, category, etc.
```
**Use Case**: Advanced filtering across all expense lists

#### 3. useExpenseApprovals Hook
```javascript
// src/hooks/useExpenseApprovals.js
- fetchPendingApprovals(params)
- fetchPendingCount()
- approve(expenseId, comment)
- reject(expenseId, reason)
- escalate(expenseId, reason)
- fetchTimeline(expenseId)
- State: approvals[], pendingCount, timeline[]
```
**Use Case**: Manager approval inbox and workflows

#### 4. useExpenseAnalytics Hook
```javascript
// src/hooks/useExpenseAnalytics.js
- fetchDashboardMetrics()
- fetchCategorySpending(categoryId, startDate, endDate)
- fetchReconciliationSummary(startDate, endDate)
- State: metrics, categorySpending, reconciliationSummary
```
**Use Case**: Dashboard and analytics pages

#### 5. useRecurringExpenses Hook
```javascript
// src/hooks/useRecurringExpenses.js
- fetchRecurringTemplates()
- fetchRecurringInstances(recurringId)
- createRecurringExpense(data)
- createInstanceFromTemplate(templateId, data)
- State: templates[], instances[]
```
**Use Case**: Recurring expense management

---

## Reusable Components (4 files)

### 1. ApprovalTimeline Component
```jsx
// src/components/expenses/ApprovalTimeline.jsx
Props:
  - timeline (array of approval records)
  
Renders:
  - Visual timeline of approval workflow
  - Status badges (Approved, Rejected, Escalated, Pending)
  - Approver names and dates
  - Comments and rejection reasons
  - Color-coded icons per status
```

**Usage**:
```jsx
<ApprovalTimeline timeline={approvals} />
```

### 2. ExpenseFilters Component
```jsx
// src/components/expenses/ExpenseFilters.jsx
Props:
  - filters (current filter state)
  - onUpdateFilter (callback)
  - onClearFilters (callback)
  - categories (dropdown options)
  - statuses (dropdown options)
  
Renders:
  - Status select dropdown
  - Date range pickers
  - Category dropdown
  - Active filter chips
  - Clear all button
```

**Usage**:
```jsx
<ExpenseFilters
  filters={filters}
  onUpdateFilter={updateFilter}
  onClearFilters={clearFilters}
  categories={categories}
/>
```

### 3. BudgetProgressBar Component
```jsx
// src/components/expenses/BudgetProgressBar.jsx
Props:
  - label (category name)
  - spent (amount spent)
  - budget (budget limit)
  - currency (default ₹)
  
Renders:
  - Linear progress bar
  - Spent vs Budget display
  - Percentage calculation
  - Color coding (green < 80%, orange 80-100%, red > 100%)
  - Over-budget indicator
```

**Usage**:
```jsx
<BudgetProgressBar
  label="Travel"
  spent={5000}
  budget={10000}
/>
```

### 4. ReceiptUploader Component
```jsx
// src/components/expenses/ReceiptUploader.jsx
Props:
  - onUpload (file callback)
  - maxSize (default 5MB)
  - acceptedFormats (default [.pdf, .jpg, .jpeg, .png])
  
Features:
  - Drag & drop support
  - File size validation
  - File type validation
  - Preview rendering
  - Loading state
  - Error handling
```

**Usage**:
```jsx
<ReceiptUploader
  onUpload={async (file) => {
    // Upload to S3 or backend
  }}
/>
```

---

## API Functions Wired (45+ functions)

### Expense CRUD
- `createExpenseEnterprise(data)`
- `getExpenseEnterprise(id)`
- `getExpensesEnterprise(params)`
- `updateExpenseEnterprise(id, data)`
- `deleteExpenseEnterprise(id)`

### Approval Workflow
- `submitExpenseForApproval(id, data)`
- `getPendingApprovals(params)`
- `getPendingApprovalsCount()`
- `approveExpense(id, data)`
- `rejectExpense(id, data)`
- `escalateExpense(id, data)`
- `getApprovalTimeline(id)`

### Analytics
- `getDashboardMetrics()`
- `getCategorySpending(categoryId, startDate, endDate)`
- `getEmployeeExpenses(employeeId, params)`

### Categories
- `getExpenseCategories()`
- `getExpenseCategoryById(id)`
- `getExpenseSubcategories(id)`
- `getExpenseCategoryHierarchy(id)`
- `createExpenseCategory(data)`
- `updateExpenseCategory(id, data)`
- `deleteExpenseCategory(id)`

### Reconciliation
- `getReconciliationSummary(startDate, endDate)`
- `getUnmatchedExpenses(params)`
- `getReimbursedExpenses(params)`
- `markExpenseAsReimbursed(id, data)`

---

## Page Development Templates Ready

### ExpenseDashboard
**Use Hooks**:
- `useExpenseAnalytics` → metrics
- `useExpenseApprovals` → pending count

**Use Components**:
- `BudgetProgressBar` → category budgets
- Charts/KPI cards

### ExpensesList
**Use Hooks**:
- `useExpenses` → list data
- `useExpenseFilters` → filter state

**Use Components**:
- `ExpenseFilters` → filter UI
- DataGrid/Table

### ExpenseForm
**Use Hooks**:
- `useExpenses` → create/update

**Use Components**:
- `ReceiptUploader` → receipt
- Form fields with validation

### ApprovalInbox
**Use Hooks**:
- `useExpenseApprovals` → pending list

**Use Components**:
- List of pending approvals
- Approve/Reject buttons
- `ApprovalTimeline` in detail view

### ReconciliationPage
**Use Hooks**:
- `useExpenseAnalytics` → summary
- `useExpenses` → unmatched list

**Use Components**:
- `ExpenseFilters` → date range
- Unmatched vs matched views

### ReportsPage
**Use Hooks**:
- `useExpenseAnalytics` → data
- `useExpenseFilters` → report params

**Use Components**:
- Charts and tables
- Export functionality

### SettingsPage (Expenses tab)
**Use Hooks**:
- Direct API calls for settings

**Use Components**:
- Category CRUD form
- Policy editor
- Approval workflow config

---

## Integration Points

### Redux/Context (Optional)
If using global state management, these hooks can feed into:
- `expensesSlice` ← useExpenses
- `approvalsSlice` ← useExpenseApprovals
- `analyticsSlice` ← useExpenseAnalytics

### Error Handling Pattern
All hooks follow consistent error pattern:
```javascript
try {
  setLoading(true)
  // API call
  setError(null)
} catch (err) {
  setError(err.message)
} finally {
  setLoading(false)
}
```

### Pagination Pattern
All list endpoints support:
```javascript
{
  page: 0,
  size: 25,
  params: { status, categoryId, etc. }
}
```

---

## Data Flow Example: Expense Approval

```
Manager opens ApprovalInbox
  ↓
useExpenseApprovals.fetchPendingApprovals()
  ↓
getPendingApprovals() API call
  ↓
Backend: GET /api/expenses/approvals/pending
  ↓
Render list of pending expenses
  ↓
Manager clicks "Approve"
  ↓
useExpenseApprovals.approve(id, comment)
  ↓
approveExpense(id, { comment }) API call
  ↓
Backend: POST /api/expenses/{id}/approve
  ↓
Refresh list + update pending count
  ↓
Show success toast
```

---

## Ready-to-Use Code Patterns

### Pattern 1: Basic CRUD Page
```jsx
const MyExpensesPage = () => {
  const { expenses, loading, fetchExpenses } = useExpenses();
  const { filters, updateFilter } = useExpenseFilters();

  useEffect(() => {
    fetchExpenses(filters);
  }, [filters]);

  return (
    <>
      <ExpenseFilters filters={filters} onUpdateFilter={updateFilter} />
      {/* Render expenses list */}
    </>
  );
};
```

### Pattern 2: Form with Upload
```jsx
const CreateExpenseForm = () => {
  const { createExpense } = useExpenses();
  const [formData, setFormData] = useState({});

  const handleReceiptUpload = async (file) => {
    // Upload file to S3
    const url = await uploadToS3(file);
    setFormData(prev => ({ ...prev, receiptPath: url }));
  };

  return (
    <>
      <form onSubmit={() => createExpense(formData)}>
        {/* Form fields */}
        <ReceiptUploader onUpload={handleReceiptUpload} />
      </form>
    </>
  );
};
```

### Pattern 3: Approval Workflow
```jsx
const ApprovalDetail = ({ expenseId }) => {
  const { approve, reject, fetchTimeline, timeline } = useExpenseApprovals();

  useEffect(() => {
    fetchTimeline(expenseId);
  }, []);

  return (
    <>
      <ApprovalTimeline timeline={timeline} />
      <Button onClick={() => approve(expenseId, 'Looks good!')}>
        Approve
      </Button>
    </>
  );
};
```

---

## Testing Guide

### Test useExpenses Hook
```javascript
const { createExpense } = useExpenses();
await createExpense({
  amount: 500,
  expenseDate: '2026-08-25',
  paymentMethod: 'CASH',
  categoryId: 1,
});
```

### Test ExpenseFilters Component
```jsx
<ExpenseFilters
  filters={{ status: 'APPROVED', startDate: '2026-08-01' }}
  onUpdateFilter={(key, val) => console.log(key, val)}
  onClearFilters={() => console.log('cleared')}
/>
```

### Test ApprovalTimeline Component
```jsx
<ApprovalTimeline
  timeline={[
    { id: 1, level: 1, status: 'APPROVED', approverId: 'manager1' },
    { id: 2, level: 2, status: 'PENDING', approverId: 'cfo' },
  ]}
/>
```

---

## Migration Guide (if existing expenses exist)

If updating from old expense system:

1. Old API endpoints still work (backward compatible)
2. Use new hooks for new features
3. Gradually migrate pages one by one
4. New fields (categoryId, employeeId, etc.) optional for legacy data

---

## What's Ready for Development

✅ All 20 API endpoints wired  
✅ All 5 custom hooks created  
✅ All 4 reusable components built  
✅ Data flow patterns established  
✅ Error handling standardized  
✅ Loading states managed  
✅ Type patterns ready  

---

## Next Steps for Frontend Team

1. **Create Dashboard Page**
   - Use `useExpenseAnalytics` for metrics
   - Render BudgetProgressBar components

2. **Create Expenses List Page**
   - Use `useExpenses` + `useExpenseFilters`
   - Render ExpenseFilters component
   - Show DataGrid with expenses

3. **Create Expense Form Page**
   - Use `useExpenses` for CRUD
   - Render ReceiptUploader component
   - Add form validation

4. **Create Approval Inbox Page**
   - Use `useExpenseApprovals` for pending
   - Show pending approvals
   - Render ApprovalTimeline in detail view

5. **Create Reconciliation Page**
   - Use `useExpenseAnalytics` for summary
   - Show unmatched vs matched expenses
   - Add mark-as-reimbursed workflow

6. **Create Reports Page**
   - Use `useExpenseAnalytics` for data
   - Render charts and tables
   - Add export functionality

7. **Create Settings Page**
   - Category management (CRUD)
   - Policy editor
   - Approval workflow config

---

## Production Checklist

- [ ] All pages created and wired
- [ ] All components rendered correctly
- [ ] Form validation added
- [ ] Error toasts displayed
- [ ] Loading spinners shown
- [ ] Pagination working
- [ ] Filters persisting
- [ ] Responsive design verified
- [ ] Accessibility audit passed
- [ ] Performance optimized (lazy load, memoization)
- [ ] Unit tests written
- [ ] Integration tests passed
- [ ] E2E tests covered

---

## Support & Debugging

### Common Issues & Solutions

**Issue**: API 404 error  
**Solution**: Verify backend is running on port 8080, check endpoints.js

**Issue**: Empty data on page load  
**Solution**: Check filters being passed, verify API response in network tab

**Issue**: Approval action not updating UI  
**Solution**: Ensure fetchPendingCount() called after approve/reject

**Issue**: Receipt upload failing  
**Solution**: Check file size/format, verify S3/backend upload endpoint

---

## Files Summary

```
Frontend Structure:
├── src/services/
│   ├── endpoints.js           ✅ 20 expense endpoints added
│   └── api.js                 ✅ 45+ API functions added
├── src/hooks/
│   ├── useExpenses.js         ✅ CRUD operations
│   ├── useExpenseFilters.js   ✅ Filter state management
│   ├── useExpenseApprovals.js ✅ Approval workflows
│   ├── useExpenseAnalytics.js ✅ Analytics data
│   └── useRecurringExpenses.js ✅ Recurring templates
└── src/components/expenses/
    ├── ApprovalTimeline.jsx   ✅ Timeline visualization
    ├── ExpenseFilters.jsx     ✅ Filter UI
    ├── BudgetProgressBar.jsx  ✅ Budget tracking
    └── ReceiptUploader.jsx    ✅ File upload
```

**Total**: 10 frontend files created  
**Total**: 20+ API endpoints wired  
**Total**: 5 custom hooks ready  
**Total**: 4 reusable components ready  

---

**Frontend Integration: 100% COMPLETE**  
**Ready for page development** 🚀
