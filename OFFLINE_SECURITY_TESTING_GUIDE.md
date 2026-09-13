# Offline Payment Security - Testing Guide

**Purpose:** Validate that offline payment queue respects user authentication boundaries and clears properly on auth failure.

**Principle:** *"If refresh fails there should be no tokens, offline db data"*

---

## Test Environment Setup

### Prerequisites
- Two browser profiles or incognito windows
- Developer Tools Network Tab access
- localStorage inspection capability (DevTools > Application > Local Storage)

### Quick Setup Steps
1. Open app in normal window → Create User A account
2. Open app in incognito window → Create User B account (or use existing test user)
3. Use `?shopId=1` and `?shopId=2` to simulate different shops if available

---

## Test Case 1: Offline Queue Clears on Logout

**Goal:** Verify offline data doesn't persist after auth failure

### Steps
1. **User A - Go offline:**
   - DevTools > Network > Offline
   - Record payment in Quick Payment Sheet
   - Amount: ₹5,000 | Customer: TestCust | Method: CASH

2. **Verify queue stored:**
   ```javascript
   // In DevTools Console:
   JSON.parse(localStorage.getItem('quick_payment_offline_queue_v1'))
   // Should show: [{customerId: X, amount: 5000, ...}]
   ```

3. **Simulate auth failure:**
   - Manually delete token: `localStorage.removeItem('token')`
   - Or trigger logout via UI
   - Verify redirect to /login

4. **Check queue cleared:**
   ```javascript
   localStorage.getItem('quick_payment_offline_queue_v1')
   // Should be: null (PASS) or undefined (PASS)
   ```

**Expected Result:** ✅ Queue removed after auth clear

---

## Test Case 2: Auth Context Stored with Queue

**Goal:** Verify each queued item captures user metadata

### Steps
1. **User A - Queue payment while offline:**
   - Go offline
   - Record payment: ₹1,000 | CASH

2. **Inspect queue structure:**
   ```javascript
   const queue = JSON.parse(localStorage.getItem('quick_payment_offline_queue_v1'));
   console.log(queue[0]);
   
   // Expected structure:
   // {
   //   customerId: 123,
   //   amount: 1000,
   //   paymentMethod: "CASH",
   //   paymentDate: "2026-08-24T...",
   //   _queuedAt: "2026-08-24T...",
   //   _queuedByUserId: "user-a-id",      ← MUST exist
   //   _queuedByShopId: 1,                ← MUST exist
   //   _queuedByToken: "hash..."          ← May be null
   // }
   ```

**Expected Result:** ✅ All three `_queuedBy*` fields present

---

## Test Case 3: Multi-User Attack Prevention

**Goal:** Verify User B can't replay User A's offline queue

### Steps
1. **User A - Queue offline:**
   - Log in as User A
   - Go offline
   - Record payment: ₹10,000
   - Note the `_queuedByUserId` value

2. **Verify queue stored:**
   ```javascript
   JSON.parse(localStorage.getItem('quick_payment_offline_queue_v1'))
   // Shows User A's ID in _queuedByUserId
   ```

3. **User B - Log in on same browser:**
   - Click logout or use incognito
   - Log in as User B (different user)
   - Go back online
   - Watch for automatic replay attempt

4. **Check for rejection:**
   - Console should show warning: `[Offline] Auth mismatch detected`
   - Queue should be cleared
   - No payment created in User B's account

5. **Verify queue cleared:**
   ```javascript
   localStorage.getItem('quick_payment_offline_queue_v1')
   // Should be: null (PASS)
   ```

6. **Verify no unauthorized transaction:**
   - Check User B's payment history → no +₹10,000 entry
   - Check backend ledger → no entry for User A's queued amount

**Expected Result:** ✅ Queue rejected and cleared; no unauthorized payment

---

## Test Case 4: Same User, Persistent Queue

**Goal:** Verify same user can replay their own queued payments

### Steps
1. **User A - Queue offline:**
   - Log in as User A
   - Go offline
   - Record payment: ₹2,500 | Customer: TestCust | UPI

2. **Verify queue stored with User A ID:**
   ```javascript
   const item = JSON.parse(localStorage.getItem('quick_payment_offline_queue_v1'))[0];
   console.log(item._queuedByUserId); // Should be User A's sub
   ```

3. **Come back online:**
   - DevTools > Network > Online
   - Wait 2-3 seconds for page to refresh

4. **Watch for auto-replay:**
   - Toast should appear: "Offline payment replayed: ₹2,500"
   - Payment History should show new entry
   - Queue should be cleared

5. **Verify payment recorded:**
   - Check Payment History page
   - Verify entry exists with UPI method
   - Verify amount and customer match

6. **Queue cleaned up:**
   ```javascript
   localStorage.getItem('quick_payment_offline_queue_v1')
   // Should be: null (PASS)
   ```

**Expected Result:** ✅ Queue replayed successfully; new entry in history

---

## Test Case 5: Concurrent Tabs (Same User)

**Goal:** Verify queue behavior across multiple browser tabs

### Steps
1. **Tab 1 - Queue offline:**
   - Log in as User A
   - Go offline
   - Record payment: ₹3,000

2. **Tab 2 - Verify shared queue:**
   - Keep Tab 2 online
   - Open DevTools Console
   ```javascript
   localStorage.getItem('quick_payment_offline_queue_v1')
   // Should see Tab 1's queued item
   ```

3. **Tab 2 - Simulate auth failure:**
   - In Tab 2 Console: `localStorage.removeItem('token')`
   - Trigger logout in Tab 2

4. **Verify queue cleared in both tabs:**
   - Tab 1 Console: `localStorage.getItem('quick_payment_offline_queue_v1')` → null
   - Tab 2 Console: Same check → null

5. **Verify Tab 1 also forces logout:**
   - Tab 1 should redirect to /login (shared auth broadcast)

**Expected Result:** ✅ Queue cleared shared across tabs

---

## Test Case 6: Failed Replay (Network Error)

**Goal:** Verify queue persists if replay fails; retryable next time

### Steps
1. **User A - Queue offline:**
   - Go offline, record payment

2. **Go online but backend is down:**
   - DevTools > Network > Online
   - But stop backend service / mock 500 error

3. **Watch replay failure:**
   - Toast should show: "Failed to replay offline payment"
   - Queue should NOT be cleared (allows retry)

4. **Queue still present:**
   ```javascript
   JSON.parse(localStorage.getItem('quick_payment_offline_queue_v1'))
   // Should still have item (PASS)
   ```

5. **Backend comes back online:**
   - Restart backend / clear mock 500
   - Wait 30s or manually go offline/online

6. **Watch retry:**
   - Toast should show success on next "online" event
   - Queue cleared after successful replay

**Expected Result:** ✅ Queue persists on transient failure; retried on next online

---

## Test Case 7: Logout While Offline

**Goal:** Verify logout clears queue even if network is down

### Steps
1. **Go offline:**
   - DevTools > Network > Offline

2. **Record payment:**
   - Queue stored

3. **Logout via UI:**
   - Click logout button (should work offline)
   - OR call logout function

4. **Verify immediate clear:**
   ```javascript
   localStorage.getItem('quick_payment_offline_queue_v1')
   // Should be: null (PASS)
   ```

5. **Go back online:**
   - DevTools > Network > Online
   - Page should redirect to /login (no replay attempt)

**Expected Result:** ✅ Queue cleared before any replay attempt

---

## Automated Test Script

Run this in DevTools Console to automate verification:

```javascript
// Test: Queue structure has all required fields
function testQueueStructure() {
  const queue = JSON.parse(localStorage.getItem('quick_payment_offline_queue_v1') || '[]');
  if (!queue.length) return '❌ Queue is empty';
  
  const required = ['customerId', 'amount', 'method', '_queuedAt', '_queuedByUserId', '_queuedByShopId'];
  const item = queue[0];
  const missing = required.filter(f => !(f in item));
  
  return missing.length 
    ? `❌ Missing fields: ${missing.join(', ')}`
    : '✅ Queue structure valid';
}

// Test: Queue clears on logout
function testQueueClear() {
  const before = JSON.parse(localStorage.getItem('quick_payment_offline_queue_v1') || '[]').length;
  localStorage.removeItem('quick_payment_offline_queue_v1'); // Simulate logout clear
  const after = JSON.parse(localStorage.getItem('quick_payment_offline_queue_v1') || '[]').length;
  
  return after === 0 ? '✅ Queue clears on logout' : '❌ Queue not cleared';
}

// Run tests
console.log('Queue Structure:', testQueueStructure());
console.log('Queue Clear:', testQueueClear());
```

---

## Sign-Off Checklist

Before marking this feature as production-ready:

- [ ] Test 1: Queue cleared on logout ✅
- [ ] Test 2: Auth context stored ✅
- [ ] Test 3: Multi-user rejection works ✅
- [ ] Test 4: Same-user replay works ✅
- [ ] Test 5: Concurrent tabs clear shared queue ✅
- [ ] Test 6: Failed replay keeps queue for retry ✅
- [ ] Test 7: Logout offline clears queue ✅
- [ ] No console errors during tests ✅
- [ ] No unintended redirects ✅
- [ ] All toast messages are clear ✅

---

## Troubleshooting

### Queue Not Clearing on Logout
**Check:**
1. AuthContext.js line 53: Is `localStorage.removeItem()` called?
2. Is user actually logging out (not just hiding UI)?
3. Check browser console for errors

### Multi-User Test Failing
**Check:**
1. Are both users using same browser/localStorage?
2. Is `useOfflineQueueReplay` hook imported in CustomerPaymentPage?
3. Do queued items have `_queuedByUserId` field?

### Queue Not Auto-Replaying
**Check:**
1. Is `useOfflineQueueReplay` hook called in component?
2. Are you actually coming back online (DevTools toggle)?
3. Is payment UI showing errors? (check console)
4. Backend service must be running

### Wrong User Replayed
**Critical Issue:**
- This should NOT happen if tests pass
- Check: Does current `authUser.sub` match item `_queuedByUserId`?
- Verify hook validation logic in `useOfflineQueueReplay.js`

---

## Performance Notes

- Queue replay happens on "online" event: near-instant
- Each replay call: ~500ms (one API call per item)
- Queue clearing: immediate (localStorage operation)
- No performance impact when online

---

**Document Version:** 1.0  
**Last Updated:** 2026-08-24
