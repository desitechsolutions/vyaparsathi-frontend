/**
 * Calculate the discount percentage of selling price below MRP.
 * Returns null when MRP is not set or selling price is not below MRP.
 * @param {number|string} mrp - Maximum Retail Price
 * @param {number|string} unitPrice - Actual selling price
 * @returns {string|null} discount percentage string like "20.0", or null
 */
export const calcMrpDiscountPct = (mrp, unitPrice) => {
  const m = Number(mrp);
  const p = Number(unitPrice);
  if (!m || p >= m) return null;
  return ((m - p) / m * 100).toFixed(1);
};

export const buildSalePayload = (formData, selectedCustomer, paymentMethods, status) => {

  return {
    id: formData.id || null,   // null for new sale, existing id for draft/resume

    customer: selectedCustomer 
      ? { id: selectedCustomer.value || selectedCustomer.id }
      : null,

    status: status,   // "DRAFT" or "COMPLETED"

    // Optional sale-type classifier. "PROFORMA" produces a non-binding proforma
    // (own number series PI/…, no stock deduction, no ledger post). Any other
    // value / omission defaults to a real INVOICE on the backend.
    saleType: formData.saleType || null,

    items: (formData.items || []).map(si => {
      let vId = si.id || si.variantId;
      const cleanId = (vId !== "" && vId !== null && vId !== undefined) ? Number(vId) : null;
      return {
        id: cleanId,
        itemName: si.itemName,
        qty: Number(si.qty),
        unitPrice: Number(si.unitPrice),
        discount: Number(si.discount || 0),
        gstRate: Number(si.gstRate || 0),
        // Batch tracking (optional)
        batchNumber: si.batchNumber || null,
        expiryDate: si.expiryDate || null,
        // Free-text / service line fields — populated only when id is null
        customItemName: si.customItemName || null,
        customDescription: si.customDescription || null,
        customHsnSac: si.customHsnSac || null,
        customUnit: si.customUnit || null,
      };
    }),

    totalAmount: parseFloat(formData.totalAmount),
    discount: parseFloat(formData.discount || 0),
    invoiceDiscount: parseFloat(formData.invoiceDiscount || formData.discount || 0),
    shippingCharges: parseFloat(formData.deliveryCharge || formData.shippingCharges || 0),
    otherCharges: parseFloat(formData.otherCharges || 0),
    isGstRequired: formData.isGstRequired === 'yes',

    // Sale-level notes (metadata only, no ledger/stock impact). Backend field: notes.
    notes: (formData.saleNotes && formData.saleNotes.trim()) || null,

    delivery: formData.deliveryRequired
      ? {
          deliveryAddress: formData.deliveryAddress,
          deliveryCharge: parseFloat(formData.deliveryCharge || 0),
          deliveryStatus: formData.deliveryStatus || "PACKED",
          deliveryNotes: formData.deliveryNotes,
          deliveryPaidBy: formData.deliveryPaidBy
        }
      : null,

    // Only attach payments when completing sale
    paymentDetails:
    status === "COMPLETED"
    ? (paymentMethods || [])
        .filter(pm => Number(pm.amount) && Number(pm.amount) > 0)
        .map(pm => ({
          amount: Number(pm.amount),
          paymentMethod: pm.paymentMethod,
          transactionId: pm.transactionId || null,
          reference: pm.reference || null,
          notes: pm.notes || null,
          paymentDate: new Date().toISOString(),
          sourceType: "SALE"
        }))
    : []

  };
};