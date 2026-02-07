export const getStatusColor = (status) => {
  switch (status) {
    case 'COMPLETED':
    case 'RECEIVED': return 'success';
    case 'PENDING': return 'warning';
    case 'PARTIALLY_RECEIVED': return 'primary';
    default: return 'default';
  }
};

export const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : '-';