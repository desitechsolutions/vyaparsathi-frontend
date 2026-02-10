// --- 1. CATEGORIES (Industry Specific) ---
export const categoryData = {
  CLOTHING: {
    MEN: {
      FORMAL: ['Shirts', 'Trousers', 'Suits', 'Blazers'],
      CASUAL: ['T-Shirts', 'Jeans', 'Chinos', 'Shorts'],
      ETHNIC: ['Kurta Pajama', 'Sherwani'],
    },
    WOMEN: {
      ETHNIC: ['Sarees', 'Lehengas', 'Kurtis'],
      WESTERN: ['Dresses', 'Tops', 'Jeans'],
    },
    KIDS: {
      BOYS: ['T-shirts', 'Shirts'],
      GIRLS: ['Dresses', 'Tops'],
    }
  },
  ELECTRONICS: {
    MOBILES: ['Smartphones', 'Feature Phones', 'Tablets'],
    ACCESSORIES: ['Chargers', 'Cables', 'Cases', 'Screen Protectors', 'Power Banks'],
    AUDIO: ['Earbuds', 'Headphones', 'Speakers', 'Neckbands'],
    COMPUTING: ['Laptops', 'Monitors', 'Keyboards', 'Mice', 'External Drives'],
    WEARABLES: ['Smartwatches', 'Fitness Bands']
  },
  HARDWARE: {
    ELECTRICAL: ['Switches', 'Wires', 'MCBs', 'LED Bulbs', 'Conduits'],
    PLUMBING: ['Pipes', 'Taps', 'Valves', 'Couplers', 'Tanks'],
    TOOLS: ['Drills', 'Hammers', 'Screwdrivers', 'Wrenches', 'Saws'],
    FASTENERS: ['Screws', 'Nails', 'Bolts', 'Washers', 'Anchors'],
    PAINTS: ['Interior', 'Exterior', 'Primers', 'Thinners', 'Brushes']
  }
};

// --- 2. SIZES / SPECIFICATIONS ---
export const clothingSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42'];
export const variantSpecs = {
  CLOTHING: clothingSizes,
  ELECTRONICS: ['2GB', '4GB', '8GB', '16GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
  HARDWARE: ['1/2 inch', '3/4 inch', '1 inch', '50mm', '100mm', 'M8', 'M10', '500g', '1kg']
};

// --- 3. COLORS / FINISHES ---
export const clothingColors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Pink', 'Navy', 'Beige'];
export const variantColors = {
  CLOTHING: clothingColors,
  ELECTRONICS: ['Space Grey', 'Silver', 'Gold', 'Midnight', 'Starlight', 'Matte Black', 'Phantom White'],
  HARDWARE: ['Stainless Steel', 'Brass', 'Chrome', 'Galvanized', 'Glossy', 'Matte', 'Powder Coated']
};

// --- 4. UNITS ---
export const clothingUnits = ['PIECE', 'SET', 'METER'];
export const shopUnits = {
  CLOTHING: clothingUnits,
  ELECTRONICS: ['PIECE', 'BOX', 'PACK', 'UNIT'],
  HARDWARE: ['PIECE', 'KG', 'PACK', 'BOX', 'BUNDLE', 'FEET', 'METER', 'ROLL']
};

// --- 5. MODELS / DESIGNS ---
export const clothingDesigns = ['Solid', 'Striped', 'Checked', 'Floral', 'Printed', 'Embroidered'];
export const variantModels = {
  CLOTHING: clothingDesigns,
  ELECTRONICS: ['Original', 'OEM', 'Generic', 'Refurbished', 'Version 1.0', 'Version 2.0'],
  HARDWARE: ['Grade 304', 'Grade 316', 'Heavy Duty', 'Standard', 'Eco-Friendly']
};

// --- 6. FITS / INSTALLATION ---
export const clothingFits = ['Slim Fit', 'Regular Fit', 'Loose Fit', 'Tailored Fit'];
export const variantFits = {
  CLOTHING: clothingFits,
  ELECTRONICS: ['Wired', 'Wireless', 'Bluetooth 5.0', 'USB-C', 'Lightning', 'Thunderbolt'],
  HARDWARE: ['Wall Mount', 'Floor Mount', 'Screw-in', 'Clip-on', 'Surface Mount', 'Recessed']
};

// --- 7. NEW: ATTRIBUTES (Added to fix export errors) ---
export const clothingFabrics = ['Cotton', 'Polyester', 'Silk', 'Linen', 'Wool', 'Denim', 'Nylon', 'Rayon'];
export const clothingSeasons = ['Summer', 'Winter', 'Spring', 'Autumn', 'All Season', 'Monsoon'];

export const variantMaterials = {
  CLOTHING: clothingFabrics,
  ELECTRONICS: ['Aluminum', 'Plastic', 'Polycarbonate', 'Glass', 'Stainless Steel'],
  HARDWARE: ['Mild Steel', 'Brass', 'PVC', 'UPVC', 'Cast Iron', 'Wood', 'Ceramic']
};

export const variantUsage = {
  CLOTHING: clothingSeasons,
  ELECTRONICS: ['1 Year Warranty', '2 Year Warranty', 'No Warranty', 'International Warranty'],
  HARDWARE: ['Indoor Use', 'Outdoor Use', 'Heavy Industrial', 'Residential', 'Underground']
};