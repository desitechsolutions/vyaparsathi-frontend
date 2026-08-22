export const INDUSTRY_LABELS = {
  CLOTHING: 'Clothing & Apparel',
  ELECTRONICS: 'Electronics & Mobiles',
  HARDWARE: 'Hardware & Electricals',
  GROCERY: 'Grocery',
  AUTOMOBILE: 'Automobile',
  STATIONERY: 'Stationery',
  FOOTWEAR: 'Footwear',
  FURNITURE: 'Furniture',
  JEWELLERY: 'Jewellery',
  GENERAL: 'General Store / Others',
  BUILDING_MATERIALS: 'Building Materials & Construction',
  RESTAURANT: 'Restaurant & Food Service',
  BAKERY: 'Bakery, Sweets & Confectionery',
  DAIRY: 'Dairy & Milk Products',
  SUPERMARKET: 'Supermarket & Mini-Mart',
  COSMETICS: 'Cosmetics & Beauty',
  OPTICAL: 'Optical & Eyewear',
  AGRICULTURE: 'Agriculture, Seeds & Fertilizers',
  SPORTS: 'Sports & Fitness',
  BOOKS: 'Books & Bookstore',
  TOYS: 'Toys & Games',
  MOBILE_ACCESSORIES: 'Mobile & Accessories',
  HOME_APPLIANCES: 'Home Appliances',
  KITCHENWARE: 'Kitchenware & Utensils',
  TEXTILE: 'Textile & Fabric',
  PAINT: 'Paint & Coatings',
  SANITARY_TILES: 'Sanitary Ware & Tiles',
  MEDICAL_EQUIPMENT: 'Medical Devices & Equipment',
  PET_SUPPLIES: 'Pet Supplies',
  MUSICAL_INSTRUMENTS: 'Musical Instruments',
  FLORIST: 'Flowers & Florist',
  HANDICRAFTS: 'Handicrafts & Art',
  SALON_SPA: 'Salon & Spa',
  LAUNDRY: 'Laundry & Dry Cleaning',
  SERVICES: 'Professional Services',
  WHOLESALE: 'Wholesale & Distribution',
  MANUFACTURING: 'Manufacturing',
};

export const titleCase = (v) =>
  String(v || '')
    .toLowerCase()
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

export const industryLabel = (value) => INDUSTRY_LABELS[value] || titleCase(value);
