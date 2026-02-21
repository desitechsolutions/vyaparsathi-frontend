export const categoryData = {
  CLOTHING: {
    MEN: {
      'MEN CASUAL': ['T-Shirts', 'Jeans', 'Chinos', 'Shorts'],
      'MEN FORMAL': ['Shirts', 'Trousers', 'Suits', 'Blazers'],
    },
    WOMEN: {
      'WOMEN ETHNIC': ['Sarees', 'Lehengas', 'Kurtis'],
      'WOMEN WESTERN': ['Dresses', 'Tops', 'Jeans'],
    },
    KIDS: {
      BOYS: ['T-shirts', 'Shirts', 'Pants'],
      GIRLS: ['Dresses', 'Tops', 'Skirts'],
    },
    FOOTWEAR: ['Sneakers', 'Formal Shoes', 'Sandals', 'Heels']
  },
  ELECTRONICS: {
    'MOBILES & TABLETS': ['Smartphones', 'Feature Phones', 'Android Tablets', 'iPads'],
    'LAPTOPS & COMPUTERS': ['Laptops', 'Desktops', 'Monitors', 'Peripherals'],
    'HOME APPLIANCES': ['Refrigerators', 'Washing Machines', 'Microwaves', 'ACs'],
    'AUDIO & ACCESSORIES': ['Earbuds', 'Headphones', 'Speakers', 'Chargers', 'Cables'],
    WEARABLES: ['Smartwatches', 'Fitness Bands']
  },
  HARDWARE: {
    ELECTRICALS: ['Switches', 'Wires', 'MCBs', 'LED Bulbs', 'Conduits'],
    PLUMBING: ['Pipes', 'Taps', 'Valves', 'Couplers', 'Tanks'],
    'TOOLS & FASTENERS': ['Drills', 'Hammers', 'Screws', 'Nails', 'Bolts'],
    PAINTS: ['Interior', 'Exterior', 'Primers', 'Thinners', 'Brushes']
  },
  PHARMACY: {
    MEDICINES: ['Tablets', 'Capsules', 'Syrups', 'Injections'],
    'PERSONAL CARE': ['Skincare', 'Haircare', 'Oral Care'],
    SURGICALS: ['Bandages', 'Gloves', 'Syringes', 'Masks'],
    WELLNESS: ['Supplements', 'Protein Powders', 'Vitamins']
  },
  GROCERY: {
    'DAIRY & BAKERY': ['Milk', 'Bread', 'Butter', 'Cheese'],
    STAPLES: ['Rice', 'Flour', 'Pulses', 'Oil', 'Sugar'],
    'SNACKS & BEVERAGES': ['Biscuits', 'Chips', 'Soft Drinks', 'Tea', 'Coffee'],
    'HOUSEHOLD CARE': ['Detergents', 'Cleaners', 'Soaps']
  },
  AUTOMOBILE: {
    'SPARE PARTS': ['Engine Parts', 'Brakes', 'Filters', 'Spark Plugs'],
    LUBRICANTS: ['Engine Oil', 'Gear Oil', 'Coolant', 'Grease'],
    TYRES: ['Car Tyres', 'Bike Tyres', 'Tubes'],
    ACCESSORIES: ['Helmets', 'Seat Covers', 'Car Mats']
  },
  STATIONERY: {
    'OFFICE SUPPLIES': ['Paper', 'Pens', 'Files', 'Staplers'],
    'SCHOOL SUPPLIES': ['Notebooks', 'Textbooks', 'Geometry Boxes'],
    'ART & CRAFT': ['Paints', 'Canvases', 'Brushes', 'Glue']
  }
};

// --- 2. SIZES / SPECIFICATIONS (variantSpecs) ---
export const clothingSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42'];
export const variantSpecs = {
  CLOTHING: clothingSizes,
  ELECTRONICS: ['2GB', '4GB', '8GB', '16GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
  HARDWARE: ['1/2 inch', '3/4 inch', '1 inch', '50mm', '100mm', 'M8', 'M10'],
  PHARMACY: ['50mg', '100mg', '250mg', '500mg', '650mg', '10ml', '100ml', '500ml'],
  GROCERY: ['50g', '100g', '250g', '500g', '1kg', '2kg', '5kg', '10kg', '1L', '2L', '5L'],
  AUTOMOBILE: ['Standard', 'Universal', '12V', 'Heavy Duty'],
  STATIONERY: ['A4', 'A3', 'Legal', '70 GSM', '80 GSM'],
  FOOTWEAR: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
  FURNITURE: ['Single', 'Double', 'King Size', 'Queen Size', 'Ergonomic'],
  JEWELLERY: ['Adjustable', '16 inch', '18 inch', 'Size 6', 'Size 7', 'Size 8']
};

// --- 3. COLORS / FINISHES (variantColors) ---
export const clothingColors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Pink', 'Navy', 'Beige'];
export const variantColors = {
  CLOTHING: clothingColors,
  ELECTRONICS: ['Space Grey', 'Silver', 'Gold', 'Midnight', 'Black', 'White'],
  HARDWARE: ['Stainless Steel', 'Brass', 'Chrome', 'Galvanized', 'Glossy', 'Matte'],
  PHARMACY: ['Transparent', 'White', 'Amber', 'Assorted'],
  GROCERY: ['Natural', 'Organic', 'Processed'],
  AUTOMOBILE: ['Black', 'Chrome', 'Metallic', 'Matte'],
  STATIONERY: ['Blue', 'Black', 'Red', 'Green', 'Multicolor'],
  FOOTWEAR: ['Black', 'Brown', 'White', 'Tan', 'Grey', 'Blue'],
  FURNITURE: ['Teak', 'Walnut', 'Oak', 'Wenge', 'White', 'Grey'],
  JEWELLERY: ['Gold', 'Rose Gold', 'Silver', 'Platinum', 'Antique']
};

// --- 4. UNITS (shopUnits) ---
export const clothingUnits = ['PIECE', 'SET', 'METER'];
export const shopUnits = {
  CLOTHING: clothingUnits,
  ELECTRONICS: ['PIECE', 'BOX', 'PACK', 'UNIT'],
  HARDWARE: ['PIECE', 'KG', 'PACK', 'BOX', 'BUNDLE', 'FEET', 'METER', 'ROLL'],
  PHARMACY: ['STRIP', 'BOTTLE', 'BOX', 'PIECE', 'TUBE'],
  GROCERY: ['PACK', 'KG', 'GRAM', 'LITRE', 'ML', 'PIECE', 'DOZEN'],
  AUTOMOBILE: ['PIECE', 'LITRE', 'SET', 'UNIT'],
  STATIONERY: ['PIECE', 'PACK', 'BOX', 'DOZEN', 'SET'],
  FOOTWEAR: ['PAIR', 'BOX'],
  FURNITURE: ['UNIT', 'SET'],
  JEWELLERY: ['PIECE', 'GRAM', 'PAIR']
};

// --- 5. MODELS / DESIGNS (variantModels) ---
export const clothingDesigns = ['Solid', 'Striped', 'Checked', 'Floral', 'Printed', 'Embroidered'];
export const variantModels = {
  CLOTHING: clothingDesigns,
  ELECTRONICS: ['Original', 'OEM', 'Generic', 'Refurbished', 'Global Version'],
  HARDWARE: ['Grade 304', 'Grade 316', 'Heavy Duty', 'Standard', 'Eco-Friendly'],
  PHARMACY: ['Generic', 'Branded', 'Ayurvedic', 'Homeopathic'],
  GROCERY: ['Premium', 'Regular', 'Fresh Produce', 'Frozen'],
  AUTOMOBILE: ['Aftermarket', 'Genuine', 'High Performance'],
  STATIONERY: ['Hardbound', 'Softbound', 'Spiral', 'Executive'],
  FOOTWEAR: ['Running', 'Walking', 'Office', 'Party Wear'],
  FURNITURE: ['Modern', 'Contemporary', 'Vintage', 'Minimalist'],
  JEWELLERY: ['Handmade', 'Machine Cut', 'Traditional', 'Modern']
};

// --- 6. FITS / INSTALLATION (variantFits) ---
export const clothingFits = ['Slim Fit', 'Regular Fit', 'Loose Fit', 'Tailored Fit'];
export const variantFits = {
  CLOTHING: clothingFits,
  ELECTRONICS: ['Wired', 'Wireless', 'Bluetooth 5.0', 'USB-C', 'Lightning'],
  HARDWARE: ['Wall Mount', 'Floor Mount', 'Screw-in', 'Clip-on', 'Recessed'],
  PHARMACY: ['External Use', 'Internal Use', 'Disposable', 'Re-usable'],
  GROCERY: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Gluten-Free'],
  AUTOMOBILE: ['Direct Fit', 'Universal Fit', 'Front', 'Rear', 'Left', 'Right'],
  STATIONERY: ['Ruled', 'Unruled', 'Grid', 'Dotted'],
  FOOTWEAR: ['Wide Fit', 'Narrow Fit', 'Standard Fit'],
  FURNITURE: ['Pre-assembled', 'DIY (Assembly Required)', 'Professional Install'],
  JEWELLERY: ['Clip-on', 'Pierced', 'Lobster Claw', 'Elastic']
};

// --- 7. MATERIALS / FABRICS (variantMaterials) ---
export const clothingFabrics = ['Cotton', 'Polyester', 'Silk', 'Linen', 'Wool', 'Denim', 'Rayon'];
export const variantMaterials = {
  CLOTHING: clothingFabrics,
  ELECTRONICS: ['Aluminum', 'Plastic', 'Polycarbonate', 'Glass', 'Stainless Steel'],
  HARDWARE: ['Mild Steel', 'Brass', 'PVC', 'UPVC', 'Cast Iron', 'Wood', 'Ceramic'],
  PHARMACY: ['Plastic', 'Glass', 'Metal', 'Latex'],
  GROCERY: ['Plastic Wrap', 'Paper Bag', 'Glass Jar', 'Tin Can'],
  AUTOMOBILE: ['Rubber', 'Carbon Fiber', 'Alloy', 'Leather', 'Vinyl'],
  STATIONERY: ['Paper', 'Cardboard', 'Plastic', 'Wood'],
  FOOTWEAR: ['Leather', 'Canvas', 'Synthetic', 'Suede', 'Mesh'],
  FURNITURE: ['Solid Wood', 'MDF', 'Engineered Wood', 'Metal', 'Plastic'],
  JEWELLERY: ['22K Gold', '18K Gold', '925 Silver', 'Stainless Steel', 'Brass']
};

// --- 8. USAGE / SEASONS (variantUsage) ---
export const clothingSeasons = ['Summer', 'Winter', 'Spring', 'Autumn', 'All Season'];
export const variantUsage = {
  CLOTHING: clothingSeasons,
  ELECTRONICS: ['1 Year Warranty', '2 Year Warranty', 'No Warranty', 'Limited Warranty'],
  HARDWARE: ['Indoor Use', 'Outdoor Use', 'Industrial', 'Residential'],
  PHARMACY: ['Prescription Required', 'Over-the-Counter', 'Store in Cool Place'],
  GROCERY: ['Perishable', 'Long Shelf Life', 'Keep Refrigerated'],
  AUTOMOBILE: ['Heavy Vehicle', 'Light Vehicle', 'Two Wheeler', 'Four Wheeler'],
  STATIONERY: ['Professional', 'Student', 'Artist'],
  FOOTWEAR: ['Daily Wear', 'Sports', 'Occasional'],
  FURNITURE: ['Home Office', 'Living Room', 'Bedroom', 'Outdoor'],
  JEWELLERY: ['Daily Wear', 'Bridal', 'Party Wear']
};