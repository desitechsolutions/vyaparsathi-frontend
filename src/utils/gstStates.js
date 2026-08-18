// Indian GST state codes (01–38, 97). Kept flat for a snappy dropdown UX.
// Shared across SettingsPage, Sales, PO, GRN and any other editor that needs
// to capture Place of Supply for statutory documents.

export const GST_STATES = [
  ['01', 'Jammu & Kashmir'], ['02', 'Himachal Pradesh'], ['03', 'Punjab'],
  ['04', 'Chandigarh'], ['05', 'Uttarakhand'], ['06', 'Haryana'],
  ['07', 'Delhi'], ['08', 'Rajasthan'], ['09', 'Uttar Pradesh'],
  ['10', 'Bihar'], ['11', 'Sikkim'], ['12', 'Arunachal Pradesh'],
  ['13', 'Nagaland'], ['14', 'Manipur'], ['15', 'Mizoram'],
  ['16', 'Tripura'], ['17', 'Meghalaya'], ['18', 'Assam'],
  ['19', 'West Bengal'], ['20', 'Jharkhand'], ['21', 'Odisha'],
  ['22', 'Chhattisgarh'], ['23', 'Madhya Pradesh'], ['24', 'Gujarat'],
  ['25', 'Daman & Diu'], ['26', 'Dadra & Nagar Haveli'],
  ['27', 'Maharashtra'], ['28', 'Andhra Pradesh (Old)'], ['29', 'Karnataka'],
  ['30', 'Goa'], ['31', 'Lakshadweep'], ['32', 'Kerala'],
  ['33', 'Tamil Nadu'], ['34', 'Puducherry'], ['35', 'Andaman & Nicobar'],
  ['36', 'Telangana'], ['37', 'Andhra Pradesh'], ['38', 'Ladakh'],
  ['97', 'Other Territory'],
];

// SupplyType matches the backend enum (common.enums.SupplyType). Kept here
// as {value, label} pairs so the dropdown renders human-readable text while
// posting the exact enum name back.
export const SUPPLY_TYPES = [
  { value: 'INTRASTATE',            label: 'Intrastate (CGST + SGST)' },
  { value: 'INTERSTATE',            label: 'Interstate (IGST)' },
  { value: 'SEZ_WITH_PAYMENT',      label: 'SEZ with payment of tax' },
  { value: 'SEZ_WITHOUT_PAYMENT',   label: 'SEZ under LUT / Bond' },
  { value: 'EXPORT_WITH_PAYMENT',   label: 'Export with payment of tax' },
  { value: 'EXPORT_WITHOUT_PAYMENT',label: 'Export under LUT / Bond' },
  { value: 'DEEMED_EXPORT',         label: 'Deemed export' },
  { value: 'COMPOSITION',           label: 'Composition (Bill of Supply)' },
  { value: 'NON_GST',               label: 'Non-GST (challan only)' },
];

/** Format a value+name pair into the "XX-Name" string the backend expects. */
export const formatPlaceOfSupply = (code, name) =>
  code && name ? `${code}-${name}` : (name || '');

/** Split "27-Maharashtra" into ["27", "Maharashtra"]. Falls back gracefully. */
export const parsePlaceOfSupply = (v) => {
  if (!v) return { code: '', name: '' };
  const m = String(v).match(/^(\d{2})[-\s]+(.+)$/);
  return m ? { code: m[1], name: m[2].trim() } : { code: '', name: String(v) };
};
