# Biruma Pharmacy Offline Implementation - Analysis & Learnings

**Goal:** Understand Biruma's offline system to properly implement for VyaparSathi Sales

---

## Biruma Architecture Overview

### Frontend (IndexedDB-Based)

**Storage:** IndexedDB (not localStorage - much more robust)
```
Database: vyaparmitra_offline
Stores:
  1. invoices (queue)
     - Key: clientTxnId (UUID)
     - Indexes: by_shopId, by_status, by_shopId_status, by_createdAt
     - Statuses: DRAFT, SYNCING, SYNCED, FAILED, CONFLICT
  
  2. meta (device metadata)
     - Key: deviceId, lastSyncTime, etc.
```

**Key Components:**
- `offline.js` - IndexedDB API wrapper (zero dependencies!)
- `offlineSyncService.js` - Sync orchestration
- `offlineSyncService.flushAll()` - Batch push with retry logic
- Device ID generation (permanent identifier)
- Idempotency via clientTxnId

### Backend (Java Spring Boot)

**Database Table:** `offline_sync_jobs`
```
Columns:
- shop_id, client_txn_id (unique constraint together)
- device_id (track device)
- operation_type (SALE, PAYMENT, etc.)
- status (PENDING, PROCESSING, COMPLETED, FAILED, CONFLICT)
- request_payload_json (the full sale data)
- metadata_json (extra data)
- error_code, error_message
- retry_count
- synced_at, created_at, updated_at
```

**Key Services:**
- `OfflineSyncService` - Queue management
- `OfflineSyncProcessorService` - Async job processor
- `OfflineSyncController` - REST endpoints

**Endpoints:**
```
POST /offline-sync/invoices?shopId=X     → Enqueue
POST /offline-sync/process?shopId=X      → Trigger processor
GET  /offline-sync/jobs/{clientTxnId}    → Check status
GET  /offline-sync/pending?shopId=X      → Pending count
```

**Status Flow:**
```
DRAFT → SYNCING → SYNCED (success) | FAILED (retriable) | CONFLICT (409)
```

### Key Features

✅ **Idempotency**
- clientTxnId as unique key
- If duplicate: return existing instead of creating again
- Safe for retries

✅ **Conflict Resolution**
- 409 = CONFLICT status (manual review needed)
- Not auto-retried
- Shows in admin UI

✅ **Retry Logic**
- FAILED items retry up to maxRetries (default 3)
- Exponential backoff possible
- Retry count tracked

✅ **Async Processing**
- Frontend enqueues
- Backend processes asynchronously
- Job status queryable

✅ **Multi-Tenant Safety**
- Shop ID isolation
- Device ID tracking
- User validation

---

## What Biruma Does

✅ **Offline Invoice Creation (Complete)**
- Create invoice while offline
- Stored in IndexedDB
- Syncs when online
- Status tracking
- Retry on failure

✅ **Offline Sync Service (Complete)**
- Auto-detection of online/offline
- Lock mechanism (prevents concurrent syncs)
- Batch push (multiple invoices at once)
- Progress tracking

✅ **Backend Job Queue (Complete)**
- Stores queued jobs
- Async processing
- Error handling
- Status persistence

✅ **Admin Dashboard (Complete)**
- View pending syncs
- View failed syncs
- Manual retry option
- Conflict resolution UI

---

## What Biruma Does NOT Have (For Sales)

❌ **Inventory Caching**
- No offline inventory check
- No stock validation
- Just queues whatever was created

❌ **Offline Sales (Different from Invoice)**
- Invoices are final billing records
- Sales in VyaparSathi include:
  - Inventory allocation
  - Payment method selection
  - Delivery details
  - Credit balance adjustments

❌ **Payment Queuing**
- Biruma focuses on invoices
- Payment handling separate

---

## Recommended Implementation for VyaparSathi

### Adapt Biruma's Pattern (Proven ✅)

1. **Use IndexedDB (not localStorage)**
   - More reliable
   - Larger storage
   - Better performance
   - Indexed queries

2. **Client TxnId Pattern**
   - UUID for idempotency
   - Prevents duplicates on retry

3. **Status Flow**
   - DRAFT → SYNCING → SYNCED | FAILED | CONFLICT
   - Matches Biruma exactly

4. **Backend Endpoint Pattern**
   - POST /api/offline-sales (queue)
   - POST /api/offline-sync (process)
   - GET /api/offline-sales/{clientTxnId} (status)

5. **Lock Mechanism**
   - Prevent concurrent syncs
   - Auto-release after timeout

### Add VyaparSathi-Specific Features

1. **Inventory Validation**
   - Cache stock on load
   - Validate before queuing
   - Show warning if qty exceeds cache

2. **Sale-Specific Data**
   - Delivery details
   - Payment methods
   - GST applicable flag
   - Credit terms

3. **Payment Integration**
   - Queue payments separately
   - Or: Queue entire sale with payments

4. **Invoice Generation**
   - Backend generates on sync (like Biruma)
   - But also generate offline receipt (temporary)

---

## Implementation Checklist for VyaparSathi

### Frontend

- [ ] Create IndexedDB wrapper (like `offline.js`)
  - Database: `vyaparsathi_offline`
  - Stores: `sales`, `meta`
  - Indexes: by_shopId, by_status, by_createdAt

- [ ] Create useOfflineSalesQueue hook
  - `queueSale(saleData)` → returns clientTxnId
  - `getSalesByStatus(shopId, status)` → for listing
  - `getSaleQueueCount(shopId)` → for UI badge

- [ ] Create useOfflineSalesSync hook
  - `flushAll(shopId)` → batch push
  - Lock mechanism (prevents concurrent)
  - Retry logic

- [ ] Integrate into SalesPage
  - Detect offline
  - Queue instead of POST
  - Show status

- [ ] Add UI Indicators
  - Offline badge
  - Queue count
  - Sync status

### Backend

- [ ] Create OfflineSalesQueue table
  ```
  shop_id, client_txn_id, device_id, status
  sale_data_json, metadata_json
  error_code, error_message, retry_count
  synced_at, created_at, updated_at
  ```

- [ ] Create endpoint: POST /api/offline-sales/enqueue
  - Accept sale data
  - Store in queue
  - Return clientTxnId

- [ ] Create endpoint: POST /api/offline-sales/process
  - Async process queued sales
  - Generate invoices
  - Update statuses

- [ ] Create endpoint: GET /api/offline-sales/{clientTxnId}
  - Return sale + status
  - Error details if failed

- [ ] Create OfflineSalesService
  - Idempotency checks
  - Retry logic
  - Error handling

---

## Key Differences: Invoices vs Sales

| Aspect | Biruma (Invoices) | VyaparSathi (Sales) |
|--------|-------------------|-------------------|
| **Data** | Just billing | Sale + Payments + Delivery |
| **Inventory** | Not checked offline | Check cached stock |
| **Invoice Gen** | Backend | Backend (but UI shows temporary) |
| **Payments** | Post-sale | Part of sale |
| **Complexity** | Lower | Higher |

---

## Why IndexedDB Over localStorage

| Feature | localStorage | IndexedDB |
|---------|--------------|----------|
| **Size** | 5-10 MB | 50+ MB |
| **Indexing** | No | Yes (fast queries) |
| **Transactions** | No | Yes (atomic ops) |
| **Query** | Scan all | Index lookup |
| **Performance** | Slow for large data | Fast |
| **Type Safety** | No | Structured |

---

## Testing Strategy (From Biruma)

### Unit Tests
- [ ] IndexedDB wrapper tests
- [ ] Idempotency tests
- [ ] Retry logic tests

### Integration Tests
- [ ] Queue → Sync → Invoice
- [ ] Conflict handling
- [ ] Multi-user scenarios

### E2E Tests (DevTools)
- [ ] DevTools Offline → Create sale → Verify queue
- [ ] Go online → Verify sync
- [ ] Multiple sales → Batch verify
- [ ] Retry on failure

---

## Timeline Estimate (Using Biruma as Template)

**Frontend:**
- IndexedDB wrapper: 1 hour
- Queue hooks: 1 hour
- Sync hooks: 1 hour
- UI integration: 1 hour
- Total: 4 hours

**Backend:**
- Database table: 30 min
- Service: 1 hour
- Endpoints: 30 min
- Testing: 1 hour
- Total: 3 hours

**Overall: 7-8 hours** (or ~2 days)

---

## Success Criteria (From Biruma)

✅ Create sale offline → Queue stored  
✅ Go online → Auto sync  
✅ Sync complete → Invoice generated  
✅ Failure → Retry automatically  
✅ Max retries → Show in admin  
✅ Conflict (409) → Manual review  
✅ Idempotency → No duplicates  
✅ Multi-user → User A's queue ≠ User B's  

---

## Lessons from Biruma Implementation

### What Works Well ✅
- IndexedDB for offline data
- Device ID tracking
- Client TxnId idempotency
- Status tracking in DB
- Async processing
- Lock mechanism

### What Could Improve
- ❓ Inventory caching (VyaparSathi specific)
- ❓ Offline receipt generation
- ❓ Conflict UI/UX
- ❓ Batch retry optimization

---

## Next Steps

1. **Use Biruma as Template**
   - Adapt IndexedDB structure
   - Use their endpoint pattern
   - Follow their status flows

2. **Add VyaparSathi Features**
   - Inventory caching
   - Sale-specific data (delivery, payments)
   - Offline receipt

3. **Implement & Test**
   - Frontend queue
   - Backend processor
   - E2E testing

---

**Status: Analysis Complete. Ready to Implement.**

