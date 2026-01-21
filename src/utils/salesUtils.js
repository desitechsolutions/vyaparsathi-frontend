export const buildSalePayload = (formData, selectedCustomer, paymentMethods, status) => {

  return {
    id: formData.id || null,   // null for new sale, existing id for draft/resume

    customer: selectedCustomer 
      ? { id: selectedCustomer.value || selectedCustomer.id }
      : null,

    status: status,   // "DRAFT" or "COMPLETED"

    items: (formData.items || []).map(si => {
      let vId = si.id || si.variantId;
      const cleanId = (vId !== "" && vId !== null && vId !== undefined) ? Number(vId) : null;
      return {
        id: cleanId, 
        itemName: si.itemName,
        qty: Number(si.qty),
        unitPrice: Number(si.unitPrice),
        discount: Number(si.discount || 0)
      };
    }),

    totalAmount: parseFloat(formData.totalAmount),
    discount: parseFloat(formData.discount || 0),
    isGstRequired: formData.isGstRequired === 'yes',

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
            .filter(pm => pm.amount > 0)
            .map(pm => ({
              paymentMethod: pm.paymentMethod,
              amount: parseFloat(pm.amount),
              transactionId: pm.transactionId || pm.reference,
              paymentDate: new Date().toISOString(),
            }))
        : []
  };
};