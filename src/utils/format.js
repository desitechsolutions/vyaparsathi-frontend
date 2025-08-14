export const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;
export const formatDate = (dateString) => new Date(dateString).toLocaleDateString();