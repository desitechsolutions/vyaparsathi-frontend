/**
 * Initial state for a single item variant.
 * These 4 fields (size, color, design, fit) map dynamically in the UI
 * based on the detected industry (ShopCategory).
 */
export const initialVariantState = {
  // Generic IDs & Codes
  sku: '',
  barcode: '',

  // Pricing & Metrics
  unit: '',
  pricePerUnit: '',
  gstRate: '18', // Defaulting to 18% as it's common, or leave empty ''
  lowStockThreshold: '5',

  // Dynamic Mapping Fields
  size: '',   // Maps to: Strength (Pharm) / Weight (Groc) / Storage (Elec) / Size (Cloth)
  color: '',  // Maps to: Finish (Elec) / Metal Tone (Jewel) / Material (Hard)
  design: '', // Maps to: Model (Elec) / Grade (Hard) / Pattern (Jewel)
  fit: '',    // Maps to: Connectivity (Elec) / Usage (Pharm) / Assembly (Furn)

  // Pharmacy-specific variant fields (ItemVariant entity)
  batchNumber: '',       // Manufacturer batch/lot number
  manufacturingDate: '', // Date of manufacture (ISO date string yyyy-MM-dd)
  expiryDate: '',        // Expiry date (ISO date string yyyy-MM-dd)
  mrp: '',               // Maximum Retail Price — must not be exceeded

  // Media
  photoFile: null,
  photoPreviewUrl: null,
  photoUrl: null, // For existing items during edit
};

/**
 * Initial state for the parent Item metadata.
 */
export const initialItemFormData = {
  name: '',
  description: '',
  categoryId: '',
  brandName: '',
  
  // Generic attributes used for Industry-specific details
  // Examples:
  // CLOTHING:    attr1 = Fabric,         attr2 = Season
  // PHARMACY:    attr1 = Dosage Form,    attr2 = Storage Condition
  // ELECTRONICS: attr1 = Build Material, attr2 = Warranty Period
  attribute1: '', 
  attribute2: '',

  // Pharmacy-specific item fields (Item entity)
  drugSchedule: '',         // DrugSchedule enum: OTC | NON_SCHEDULED | SCHEDULE_H | SCHEDULE_H1 | SCHEDULE_X
  requiresPrescription: false, // Whether a prescription is required to sell
};