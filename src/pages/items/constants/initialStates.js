export const initialVariantState = {
  unit: '',
  pricePerUnit: '',
  size: '', // Maps to: Storage (Elec) / Dimensions (Hardw)
  color: '', // Maps to: Finish (Elec) / Material (Hardw)
  design: '', // Maps to: Model (Elec) / Grade (Hardw)
  fit: '', // Maps to: Connectivity (Elec) / Installation (Hardw)
  gstRate: '',
  photoFile: null,
  photoPreviewUrl: null,
  lowStockThreshold: '',
};

export const initialItemFormData = {
  name: '',
  description: '',
  categoryId: '',
  brandName: '',
  // RENAMED FOR GENERALITY:
  attribute1: '', // Maps to: Fabric (Cloth) / Build Material (Elec) / Material (Hardw)
  attribute2: '', // Maps to: Season (Cloth) / Warranty (Elec) / Usage Env (Hardw)
};