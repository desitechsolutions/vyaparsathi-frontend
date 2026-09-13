# Offline Sales → Invoice Generation Flow

**Critical Question:** "Will offline sale generate invoice?"

**Answer:** ❌ No invoice offline, ✅ Automatically generated on sync

---

## Invoice Generation Timeline

### When OFFLINE (Creating Sale)
```
1. User creates sale (3 items, ₹15,000)
   ↓
2. System saves to localStorage
   {
     _offlineId: "sale-xyz",
     customerId: "cust-123",
     items: [...],
     totalAmount: 15000,
     saleNotes: "Created offline"
   }
   ↓
3. Shows: "Sale queued offline (3 items)"
   ↓
4. ❌ NO invoice yet
   ❌ NO sale ID from backend yet
   ❌ NO invoice URL yet
```

### When ONLINE (Syncing Sale)
```
1. User comes online
   ↓
2. System auto-replays queued sale
   → POST /api/sales {sale data}
   ↓
3. Backend creates:
   ✅ Sale record with ID
   ✅ Invoice (PDF generated)
   ✅ Invoice URL (signed URL for download)
   ✅ Invoice number (INV-2026-00123)
   ↓
4. Response:
   {
     id: "sale-server-456",
     invoiceNumber: "INV-2026-00123",
     invoiceSignedUrl: "https://...",
     status: "completed"
   }
   ↓
5. Frontend:
   ✅ Shows: "Sale created: INV-2026-00123"
   ✅ Invoice available for download
   ✅ Invoice in SalesHistory
```

---

## User Experience

### Offline Mode
```
Salesperson: "I'll create this sale offline"
    ↓
System: "Sale queued (3 items)"
    ↓
Salesperson: "Invoice? Not yet. It will be generated when we get internet"
    ↓
Shows: "Invoice will be available when online"
```

### Goes Online
```
System: "Syncing sales..."
    ↓
Backend: "Creating invoices..."
    ↓
System: "✅ Sale created: INV-2026-00123"
    ↓
Salesperson: "Perfect! Invoice ready to send"
    ↓
Shows: Invoice with download/share buttons
```

---

## Invoice Storage Strategy

### Option A: Generate Server-Side (Recommended ⭐)

**What Happens:**
```
1. Offline: Sale queued (no invoice)
2. Online: Backend generates invoice PDF
3. Backend stores invoice in:
   - Signed URL (temporary download link)
   - S3/Cloud storage (permanent)
   - Database reference (links to file)
4. Frontend shows: "Invoice ready"
```

**Advantages:**
- ✅ Always latest invoice template
- ✅ Digital signature included
- ✅ GST compliance built-in
- ✅ Stored in secure backend
- ✅ Accessible from anywhere
- ✅ Like Zoho, SAP, Xero

**Implementation:**
```javascript
// Already done in backend
// src/main/java/.../invoice/InvoiceService.java
// generateInvoice(Sale sale) → Creates PDF
```

### Option B: Generate Offline Locally (Complex)

**What Would Happen:**
```
1. Offline: Calculate invoice data
2. Generate PDF locally in browser (jsPDF)
3. Store PDF in localStorage or IndexedDB
4. When online: 
   - Send sale to backend
   - Send PDF receipt
   - Backend validates PDF matches data
```

**Disadvantages:**
- ❌ Complex logic duplication
- ❌ Frontend PDF ≠ Backend PDF (formatting differs)
- ❌ Digital signature not possible
- ❌ GST compliance harder
- ❌ Not how SaaS apps work
- ❌ Maintenance nightmare

### Option C: Email/Share Link (Best UX)

**Recommended Flow:**
```
1. Offline: Create sale
2. Online: Sale syncs
3. Backend generates invoice + sends email
4. User gets: "Invoice sent to customer@email.com"
5. Customer receives invoice immediately
6. No download needed
```

---

## Recommended Implementation

### For Offline Sales

**Step 1: Queue Sale (No Invoice)**
```javascript
// In useOfflineSalesQueue hook
const enqueueOfflineSale = (saleData) => {
  const offlineSale = {
    _offlineId: `sale-${Date.now()}`,
    _syncStatus: 'pending',
    _invoiceStatus: 'not_generated', // ← Key field
    ...saleData,
  };
  localStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, offlineSale]));
  return offlineSale._offlineId;
};
```

**Step 2: Replay & Sync**
```javascript
// In useOfflineSalesReplay hook
const replaySales = async () => {
  const queue = getQueuedSales();
  
  for (const sale of queue) {
    try {
      // Remove offline metadata
      const { _offlineId, _syncStatus, _invoiceStatus, ...saleData } = sale;
      
      // Send to backend
      const response = await createSale(saleData);
      // Response includes: id, invoiceNumber, invoiceSignedUrl
      
      // Show user
      showSnackbar(`Sale created: ${response.invoiceNumber}`);
      
      // Make invoice available
      setInvoiceData({
        saleId: response.id,
        invoiceNumber: response.invoiceNumber,
        invoiceUrl: response.invoiceSignedUrl, // ← Download link
        customerEmail: response.customerEmail,
      });
      
    } catch (err) {
      // Sale sync failed
      showSnackbar('Failed to create sale');
    }
  }
};
```

**Step 3: Show Invoice to User**
```javascript
// In SalesPage or SalesHistory

useEffect(() => {
  // After offline sales sync
  if (invoiceData.saleId && invoiceData.invoiceUrl) {
    showDialog({
      title: `Invoice Created: ${invoiceData.invoiceNumber}`,
      message: `Invoice ready. What would you like to do?`,
      actions: [
        { label: 'Download', action: () => downloadInvoice(invoiceData.invoiceUrl) },
        { label: 'Send via Email', action: () => sendInvoiceEmail(invoiceData) },
        { label: 'Share WhatsApp', action: () => shareViaWhatsApp(invoiceData) },
        { label: 'View', action: () => openInvoiceModal(invoiceData) },
      ]
    });
  }
}, [invoiceData]);
```

---

## Testing Invoice Generation

### Test Scenario 1: Offline Sale → Invoice
```
1. DevTools → Offline
2. SalesPage → Create sale (3 items, ₹15,000)
3. Click "Save Sale"
   ✅ "Sale queued offline (3 items)"
   ❌ NO invoice shown (because offline)
4. DevTools → Online
5. Auto-sync happens
   ✅ "Sale created: INV-2026-00123"
   ✅ Download button appears
   ✅ Invoice available
```

### Test Scenario 2: Download Invoice
```
1. After sync (above)
2. Click "Download Invoice"
   ✅ PDF downloads: INV-2026-00123.pdf
   ✅ Contains all sale data
   ✅ Contains GST calculations
   ✅ Contains digital signature (if enabled)
```

### Test Scenario 3: Share Invoice
```
1. After sync
2. Click "Send via WhatsApp"
   ✅ Opens WhatsApp
   ✅ Message: "Here's your invoice: INV-2026-00123"
   ✅ Includes invoice download link
3. Click "Email"
   ✅ Opens email client
   ✅ Includes invoice attachment or link
```

### Test Scenario 4: Multiple Offline Sales
```
1. DevTools → Offline
2. Create 3 sales
   ✅ "Sale 1 queued"
   ✅ "Sale 2 queued"
   ✅ "Sale 3 queued"
   ✅ Shows "3 sales queued"
3. DevTools → Online
4. Auto-sync
   ✅ "Syncing 3 sales..."
   ✅ "Sale 1 created: INV-2026-00123"
   ✅ "Sale 2 created: INV-2026-00124"
   ✅ "Sale 3 created: INV-2026-00125"
   ✅ All 3 invoices available
```

---

## Database Records

### What Gets Created on Sync

**Backend Database:**
```
SALES Table:
id: sale-server-456
customerId: cust-123
totalAmount: 15000
status: COMPLETED
createdAt: 2026-08-25 15:30
invoiceNumber: INV-2026-00123

SALE_ITEMS Table:
saleId: sale-server-456
itemId: item-1
qty: 3
unitPrice: 5000

INVOICES Table:
id: inv-456
saleId: sale-server-456
invoiceNumber: INV-2026-00123
filePath: /invoices/2026/INV-2026-00123.pdf
signedUrl: https://...signed...
generatedAt: 2026-08-25 15:30
```

**Frontend (localStorage - cleared after sync):**
```
OFFLINE_SALES_QUEUE: []  // Empty after sync
INVOICE_CACHE: {
  'INV-2026-00123': {
    saleId: 'sale-server-456',
    url: 'https://...',
    downloadedAt: 1693046400000
  }
}
```

---

## User Messages Timeline

### Offline → Creating
```
"📱 You're offline. Sales will sync when internet returns."
```

### Offline → Sale Created
```
"Sale queued offline (3 items, ₹15,000)"
"Invoice will be generated when online"
```

### Coming Online
```
"Syncing sales..."
```

### Sync Complete
```
"✅ Sale created: INV-2026-00123"
"Invoice ready"
[Download] [Email] [WhatsApp] [View]
```

### If Multiple Sales
```
"✅ 3 sales created"
"Invoices: INV-2026-00123, INV-2026-00124, INV-2026-00125"
"All ready to download"
```

---

## Important Points

### ✅ Invoice Will Always Be Generated

When offline sale syncs:
1. Backend creates sale
2. Backend generates invoice
3. Invoice is official, signed, GST-compliant
4. Invoice is permanent

### ❌ Cannot Generate Invoice Offline

Why offline invoice is not recommended:
- Browser PDF library ≠ Backend PDF template
- Digital signature requires backend
- GST compliance needs backend validation
- Accounting records need backend invoice
- Like Zoho, Xero, SAP - all generate invoices on sync

### ✅ Invoice Is Immediately Available

After sync:
- User can download instantly
- User can share immediately
- Invoice appears in SalesHistory
- Invoice email can be sent
- No waiting for background job

---

## Recommended Implementation Checklist

- [ ] Queue offline sale WITHOUT invoice metadata
- [ ] Show: "Invoice will be generated when online"
- [ ] On sync: Call backend /api/sales endpoint
- [ ] Backend creates sale + invoice
- [ ] Frontend receives: invoiceUrl, invoiceNumber
- [ ] Show dialog with invoice actions
- [ ] Save invoice data to invoice cache
- [ ] Allow download/share/email
- [ ] Clear offline queue
- [ ] Test all 4 scenarios above

---

## Summary

| Scenario | Invoice Generated | When | Where |
|----------|------------------|------|-------|
| Creating offline | ❌ No | - | - |
| Online sale | ✅ Yes | Immediately | Backend |
| Offline sync | ✅ Yes | On replay | Backend |
| Download | ✅ Yes | After sync | Server |
| Email share | ✅ Yes | After sync | Server |

---

**Answer to "Will offline sale generate invoice?"**

**No** - Not while offline (makes sense - no backend connection)  
**Yes** - Automatically when it syncs and backend receives it  
**Best Practice** - Like Zoho, SAP, Xero (server-generated, always official)

