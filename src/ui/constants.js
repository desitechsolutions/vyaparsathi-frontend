// --- Categories ---
export const clothingCategories = {
  MEN: {
    FORMAL: ['Shirts', 'Trousers', 'Suits', 'Blazers', 'Nehru Jackets'],
    CASUAL: ['T-Shirts', 'Shirts', 'Jeans', 'Chinos', 'Shorts', 'Joggers', 'Polo T-shirts'],
    ETHNIC: ['Kurta Pajama', 'Sherwani', 'Dhoti Kurta', 'Bandhgala', 'Achkan'],
    ACTIVEWEAR: ['T-Shirts', 'Shorts', 'Tracksuits', 'Hoodies'],
    INNERWEAR: ['Underwear', 'Vests', 'Thermals'],
    OUTERWEAR: ['Jackets', 'Sweaters', 'Hoodies', 'Cardigans'],
  },
  WOMEN: {
    ETHNIC: ['Sarees', 'Lehengas', 'Salwar Kameez', 'Kurtis', 'Anarkali Suits', 'Sharara Suits', 'Ghagra Choli', 'Mekhela Chador'],
    WESTERN: ['Dresses', 'Tops', 'Shirts', 'Trousers', 'Jeans', 'Skirts', 'Jackets'],
    FUSION: ['Indo-Western Dresses', 'Kurtis with Western bottoms'],
    ACTIVEWEAR: ['Leggings', 'Track Pants', 'Sports Bras', 'T-Shirts'],
    LINGERIE_NIGHTWEAR: ['Bras', 'Panties', 'Camisoles', 'Slips', 'Nightgowns', 'Sleepwear', 'Robes', 'Thermals'],
    OUTERWEAR: ['Jackets', 'Sweaters', 'Hoodies', 'Cardigans'],
  },
  KIDS: {
    BOYS: ['T-shirts', 'Shirts', 'Jeans', 'Shorts', 'Kurta Pajama', 'Jackets', 'Sleepwear'],
    GIRLS: ['Dresses', 'Tops', 'Skirts', 'Lehengas', 'Kurtis', 'Frocks', 'Sleepwear', 'Jackets'],
    // Populated age-based categories for better filtering
    INFANT_0_12_MONTHS: ['Rompers', 'Onesies', 'Sleepsuits', 'Sets'],
    TODDLER_1_3_YEARS: ['T-shirts', 'Dresses', 'Shorts', 'Sets'],
    YOUNG_KIDS_4_8_YEARS: ['T-shirts', 'Dresses', 'Jeans', 'Skirts', 'Ethnic Wear'],
    PRE_TEENS_9_16_YEARS: ['Tops', 'Dresses', 'Jeans', 'Activewear', 'Ethnic Wear'],
  },
};

// --- Sizes ---
export const clothingSizes = {
  ALPHA_STANDARD: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'],
  NUMERIC_MENS_SHIRTS: ['36', '38', '40', '42', '44', '46'], // Based on Chest Size in Inches
  NUMERIC_MENS_TROUSERS: ['28', '30', '32', '34', '36', '38', '40', '42', '44'], // Based on Waist Size in Inches
  KIDS_AGE_BASED: ['6 Months', '9 Months', '12 Months', '18 Months', '2 Years', '3 Years', '4 Years', '5 Years', '6 Years', '7 Years', '8 Years', '9 Years', '10 Years', '11 Years', '12 Years', '13 Years', '14 Years', '15 Years', '16 Years'],
  KIDS_NUMERIC_STANDARD: ['22', '24', '26', '28', '30', '32', '34', '36'], // Commonly used for kids dresses/sets
  PLUS_SIZE: ['7XL', '8XL', '9XL', '10XL'], // Extend as needed based on supplier availability
  FOOTWEAR_UK_IND: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], // For Men/Women
  FOOTWEAR_EU: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'], // For Men/Women
  FREE_SIZE: ['Free Size', 'One Size Fits All'], // Crucial for many items
};

// --- Colors ---
export const clothingColors = [
  'Black', 'White', 'Cream', 'Off-White', 'Grey', 'Brown', 'Beige',
  'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Pink', 'Purple',
  'Light Blue', 'Blush Pink', 'Mint Green', 'Lavender', 'Peach',
  'Emerald Green', 'Sapphire Blue', 'Ruby Red', 'Teal', 'Maroon', 'Bottle Green',
  'Olive Green', 'Mustard Yellow', 'Rust', 'Terracotta',
  'Fuchsia', 'Neon Green', 'Cobalt Blue',
  'Gold', 'Silver', 'Bronze', // For embellishments or metallic fabrics
];

// --- Designs ---
export const clothingDesigns = {
  PRINTS: [
    'Solid', 'Striped', 'Checked/Plaid', 'Floral', 'Geometric', 'Abstract', 'Paisley', 'Animal Print',
    // Indian Specific Prints
    'Ajrakh', 'Bagh', 'Bandhani', 'Batik', 'Dabu', 'Ikat', 'Kalamkari', 'Khari', 'Leheriya', 'Patola', 'Sanganer'
  ],
  WEAVES_TEXTURES: [
    'Plain', 'Textured', 'Jacquard', 'Brocade', 'Embroidered',
    // Indian Specific Weaves
    'Khadi', 'Jamdani'
  ],
  EMBELLISHMENTS_WORK: [
    'Embroidery', 'Sequins', 'Zari Work', 'Mirror Work (Shisha)', 'Gota Patti', 'Chikankari',
    'Phulkari', 'Kantha', 'Zardozi', 'Resham Work', 'Bead Work'
  ],
  FEATURES: [ // Might be useful for general product description
    'Drapey', 'Sheer', 'Tiered', 'Layered', 'Asymmetric'
  ]
};

// --- NEW: Fit ---
export const clothingFits = [
  'Regular Fit', 'Slim Fit', 'Loose Fit', 'Relaxed Fit', 'Skinny Fit', 'Tailored Fit', 'Boxy Fit', 'Asymmetric Fit'
];

// --- NEW: Season ---
export const clothingSeasons = [
  'Summer', 'Winter', 'Monsoon', 'Spring', 'Autumn', 'All-Season'
];

// --- Units ---
export const clothingUnits = ['PIECE', 'SET', 'METER', 'YARD']; // Include 'SET' for outfits, 'METER/YARD' for fabrics

// --- Fabric ---
// Added famous Indian textiles to the fabric list
export const clothingFabrics = [
  'Cotton', 'Linen', 'Silk', 'Polyester', 'Rayon', 'Viscose', 'Wool', 'Denim',
  'Satin', 'Velvet', 'Chiffon', 'Georgette', 'Crepe', 'Organza', 'Net', 'Lace',
  'Cotton Blend', 'Poly-Cotton', 'Silk Blend', 'Wool Blend',
  // Famous Indian Fabrics
  'Khadi', 'Chanderi Silk', 'Banarasi Silk', 'Kanjeevaram Silk', 'Tussar Silk', 'Muga Silk', 'Pashmina'
];