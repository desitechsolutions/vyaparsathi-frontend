// ===============================
// 1. INDUSTRY CATEGORY HIERARCHY
// ===============================

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
      BOYS: ['T-Shirts', 'Shirts', 'Pants'],
      GIRLS: ['Dresses', 'Tops', 'Skirts'],
    }
  },

  FOOTWEAR: {
    MEN: ['Sneakers', 'Formal Shoes', 'Sandals'],
    WOMEN: ['Heels', 'Flats', 'Sandals'],
    KIDS: ['School Shoes', 'Casual Shoes']
  },

  ELECTRONICS: {
    'MOBILES & TABLETS': ['Smartphones','Feature Phones','Android Tablets','iPads'],
    'LAPTOPS & COMPUTERS': ['Laptops','Desktops','Monitors','Peripherals'],
    'HOME APPLIANCES': ['Refrigerators','Washing Machines','Microwaves','ACs'],
    'AUDIO & ACCESSORIES': ['Earbuds','Headphones','Speakers','Chargers','Cables'],
    WEARABLES: ['Smartwatches','Fitness Bands']
  },

  HARDWARE: {
    ELECTRICALS: ['Switches','Wires','MCBs','LED Bulbs','Conduits'],
    PLUMBING: ['Pipes','Taps','Valves','Couplers','Water Tanks'],
    'TOOLS & FASTENERS': ['Drills','Hammers','Screws','Nails','Bolts'],
    PAINTS: ['Interior Paint','Exterior Paint','Primers','Thinners']
  },

  PHARMACY: {
    MEDICINES: ['Tablets','Capsules','Syrups','Injections'],
    'PERSONAL CARE': ['Skincare','Haircare','Oral Care'],
    SURGICALS: ['Bandages','Gloves','Syringes','Masks'],
    WELLNESS: ['Supplements','Protein Powders','Vitamins']
  },

  GROCERY: {
    'DAIRY & BAKERY': ['Milk','Bread','Butter','Cheese'],
    STAPLES: ['Rice','Flour','Pulses','Oil','Sugar'],
    'SNACKS & BEVERAGES': ['Biscuits','Chips','Soft Drinks','Tea','Coffee'],
    'HOUSEHOLD CARE': ['Detergents','Cleaners','Soaps']
  },

  AUTOMOBILE: {
    'SPARE PARTS': ['Engine Parts','Brake Pads','Filters','Spark Plugs'],
    LUBRICANTS: ['Engine Oil','Gear Oil','Coolant','Grease'],
    TYRES: ['Car Tyres','Bike Tyres','Tubes'],
    ACCESSORIES: ['Helmets','Seat Covers','Car Mats']
  },

  STATIONERY: {
    'OFFICE SUPPLIES': ['Paper','Pens','Files','Staplers'],
    'SCHOOL SUPPLIES': ['Notebooks','Textbooks','Geometry Boxes'],
    'ART & CRAFT': ['Paints','Canvases','Brushes','Glue']
  },

  FURNITURE: {
    HOME: ['Beds','Sofas','Tables','Wardrobes'],
    OFFICE: ['Office Chairs','Office Tables','Cabinets']
  },

  JEWELLERY: {
    GOLD: ['Necklaces','Rings','Bracelets'],
    SILVER: ['Chains','Rings'],
    FASHION: ['Imitation Necklaces','Fashion Earrings']
  }
};



// ===============================
// 2. SIZE / SPECIFICATIONS
// ===============================

export const variantSpecs = {

  CLOTHING: ['XS','S','M','L','XL','XXL','38','40','42'],

  FOOTWEAR: ['UK 6','UK 7','UK 8','UK 9','UK 10','UK 11'],

  ELECTRONICS: ['2GB','4GB','8GB','16GB','64GB','128GB','256GB','512GB','1TB'],

  HARDWARE: ['1/2 inch','3/4 inch','1 inch','50mm','100mm','M8','M10'],

  PHARMACY: ['50mg','100mg','250mg','500mg','650mg','10ml','100ml'],

  GROCERY: ['100g','250g','500g','1kg','2kg','5kg','10kg'],

  AUTOMOBILE: ['Standard','Heavy Duty','Universal'],

  STATIONERY: ['A4','A3','Legal','70 GSM','80 GSM'],

  FURNITURE: ['Single','Double','Queen','King'],

  JEWELLERY: ['Adjustable','16 inch','18 inch','Size 6','Size 7'],

  GENERAL: ['Small','Medium','Large','Standard']
};



// ===============================
// 3. COLORS
// ===============================

export const variantColors = {

  CLOTHING: ['Black','White','Blue','Red','Green','Pink','Navy','Beige'],

  FOOTWEAR: ['Black','Brown','White','Tan','Grey','Blue'],

  ELECTRONICS: ['Space Grey','Silver','Gold','Black','White'],

  HARDWARE: ['Stainless Steel','Brass','Chrome','Matte','Glossy'],

  PHARMACY: ['Transparent','White','Amber'],

  GROCERY: ['Natural','Organic'],

  AUTOMOBILE: ['Black','Chrome','Metallic'],

  STATIONERY: ['Blue','Black','Red','Green','Multicolor'],

  FURNITURE: ['Teak','Walnut','Oak','White','Grey'],

  JEWELLERY: ['Gold','Rose Gold','Silver','Platinum'],

  GENERAL: ['Black','White','Grey']
};



// ===============================
// 4. SHOP UNITS
// ===============================

export const shopUnits = {

  CLOTHING: ['PIECE','SET','METER'],

  FOOTWEAR: ['PAIR','BOX'],

  ELECTRONICS: ['PIECE','BOX','UNIT'],

  HARDWARE: ['PIECE','KG','PACK','BOX','ROLL'],

  PHARMACY: ['STRIP','BOTTLE','BOX','PIECE'],

  GROCERY: ['PACK','KG','GRAM','LITRE','ML'],

  AUTOMOBILE: ['PIECE','SET','UNIT'],

  STATIONERY: ['PIECE','PACK','BOX','DOZEN'],

  FURNITURE: ['UNIT','SET'],

  JEWELLERY: ['PIECE','GRAM','PAIR'],

  GENERAL: ['PIECE','UNIT']
};



// ===============================
// 5. MODELS / DESIGNS
// ===============================

export const variantModels = {

  CLOTHING: ['Solid','Striped','Checked','Floral','Printed','Embroidered'],

  FOOTWEAR: ['Running','Walking','Office','Party Wear'],

  ELECTRONICS: ['Original','OEM','Refurbished','Generic','Global Version'],

  HARDWARE: ['Grade 304','Grade 316','Heavy Duty','Standard'],

  PHARMACY: ['Generic','Branded','Ayurvedic','Homeopathic'],

  GROCERY: ['Premium','Regular','Fresh','Frozen'],

  AUTOMOBILE: ['Aftermarket','Genuine','Performance'],

  STATIONERY: ['Hardbound','Softbound','Spiral','Executive'],

  FURNITURE: ['Modern','Vintage','Minimalist'],

  JEWELLERY: ['Handmade','Machine Cut','Traditional'],

  GENERAL: ['Standard','Premium']
};



// ===============================
// 6. FIT / INSTALLATION
// ===============================

export const variantFits = {

  CLOTHING: ['Slim Fit','Regular Fit','Loose Fit','Tailored Fit'],

  FOOTWEAR: ['Wide Fit','Narrow Fit','Standard Fit'],

  ELECTRONICS: ['Wired','Wireless','Bluetooth'],

  HARDWARE: ['Wall Mount','Floor Mount','Screw-in'],

  PHARMACY: ['External Use','Internal Use'],

  GROCERY: ['Vegetarian','Non-Vegetarian','Vegan'],

  AUTOMOBILE: ['Front','Rear','Universal Fit'],

  STATIONERY: ['Ruled','Unruled','Grid'],

  FURNITURE: ['Pre-assembled','DIY'],

  JEWELLERY: ['Clip-on','Pierced'],

  GENERAL: ['Standard','Adjustable']
};



// ===============================
// 7. MATERIALS / FABRICS
// ===============================

export const variantMaterials = {

  CLOTHING: ['Cotton','Polyester','Silk','Linen','Wool','Denim','Rayon'],

  ELECTRONICS: ['Aluminum','Plastic','Polycarbonate','Glass','Stainless Steel'],

  HARDWARE: ['Mild Steel','Brass','PVC','UPVC','Cast Iron','Ceramic'],

  PHARMACY: ['Plastic','Glass','Metal','Latex'],

  GROCERY: ['Plastic Wrap','Paper Bag','Glass Jar','Tin Can'],

  AUTOMOBILE: ['Rubber','Carbon Fiber','Alloy','Leather','Vinyl'],

  STATIONERY: ['Paper','Cardboard','Plastic','Wood'],

  FOOTWEAR: ['Leather','Canvas','Synthetic','Suede','Mesh'],

  FURNITURE: ['Solid Wood','MDF','Engineered Wood','Metal'],

  JEWELLERY: ['22K Gold','18K Gold','925 Silver','Stainless Steel','Brass'],

  GENERAL: ['Plastic','Metal','Wood','Glass','Other']
};



// ===============================
// 8. USAGE / SEASONS
// ===============================

export const variantUsage = {

  CLOTHING: ['Summer','Winter','Spring','Autumn','All Season'],

  ELECTRONICS: ['1 Year Warranty','2 Year Warranty','No Warranty'],

  HARDWARE: ['Indoor Use','Outdoor Use','Industrial','Residential'],

  PHARMACY: ['Prescription Required','Over-the-Counter','Store in Cool Place'],

  GROCERY: ['Perishable','Long Shelf Life','Keep Refrigerated'],

  AUTOMOBILE: ['Heavy Vehicle','Light Vehicle','Two Wheeler','Four Wheeler'],

  STATIONERY: ['Professional','Student','Artist'],

  FOOTWEAR: ['Daily Wear','Sports','Occasional'],

  FURNITURE: ['Home Office','Living Room','Bedroom','Outdoor'],

  JEWELLERY: ['Daily Wear','Bridal','Party Wear'],

  GENERAL: ['Daily Use','Professional','Industrial','Household']
};