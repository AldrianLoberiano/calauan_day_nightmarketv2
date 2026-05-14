import { Stall, StallCategory, StallSize, StallStatus } from '../types';

const stallImages: Record<string, string> = {
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  veggies: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  dry: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  clothing: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  general: 'https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
};

const priceBySize: Record<StallSize, number> = {
  small: 1500,
  medium: 2500,
  large: 3500,
  corner: 4500,
};

const descriptions: Record<StallCategory, string[]> = {
  'Cooked Food': [
    'Ideal for selling cooked meals, snacks, and Filipino dishes.',
    'Perfect spot for a carinderia or food stall near the main aisle.',
    'High-traffic location great for fast food and ready-to-eat items.',
    'Corner stall with extra space for cooking equipment and display.',
    'Suitable for selling breakfast meals, kakanin, and beverages.',
    'Great for silog meals, merienda, and affordable daily lunches.',
    'Prime location for barbecue, grilled items, and pulutan.',
    'Excellent for baked goods, pastries, and Filipino desserts.',
  ],
  'Vegetables & Fruits': [
    'Spacious stall perfect for fresh vegetables and seasonal produce.',
    'Conveniently located near the entrance for easy customer access.',
    'Great for fruits, vegetables, herbs, and fresh condiments.',
    'Well-ventilated space ideal for fresh tropical fruits.',
    'Corner stall with wide display area for colorful produce.',
    'Suitable for exotic fruits, organic veggies, and fresh herbs.',
    'Near the wet section, ideal for root crops and leafy greens.',
    'Prime spot for selling locally sourced farm produce.',
  ],
  'Dry Goods & Groceries': [
    'Ideal for selling canned goods, condiments, and dry groceries.',
    'Large stall suitable for wholesale and retail dry goods.',
    'Perfect for rice, flour, sugar, salt, and pantry essentials.',
    'Great for spices, seasonings, and cooking ingredients.',
    'Corner location with high foot traffic, ideal for grocery items.',
    'Suitable for noodles, crackers, biscuits, and packaged foods.',
    'Excellent for coffee, sugar, and everyday household needs.',
    'Wide display space for organizing dry goods and groceries.',
  ],
  'Clothing & Apparel': [
    'Trendy location for ukay-ukay, ref items, and fashion pieces.',
    'Perfect for selling everyday clothing and accessories.',
    'Ideal for school uniforms, casual wear, and workwear.',
    'Great spot for selling bags, shoes, and fashion accessories.',
    'Corner stall with extra space for hanging clothes and display.',
    'High-visibility location for fashion retail and trendy items.',
    "Suitable for children's clothing, school supplies, and toys.",
    'Excellent for local designer pieces and handcrafted goods.',
  ],
  'General Merchandise': [
    'Versatile stall for hardware, tools, and household items.',
    'Ideal for selling electronics, phone accessories, and gadgets.',
    'Perfect for kitchenware, cookware, and home essentials.',
    'Great for personal care products and hygiene goods.',
    'Corner stall with wide space for displaying varied merchandise.',
    'Suitable for school supplies, notebooks, and art materials.',
    'Excellent for seeds, gardening tools, and farm supplies.',
    'Wide-open stall ideal for wholesale general goods.',
  ],
};

const categoryOrder: StallCategory[] = [
  'Cooked Food',
  'Vegetables & Fruits',
  'Dry Goods & Groceries',
  'Clothing & Apparel',
  'General Merchandise',
];

const categoryImages: Record<StallCategory, string> = {
  'Cooked Food': stallImages.food,
  'Vegetables & Fruits': stallImages.veggies,
  'Dry Goods & Groceries': stallImages.dry,
  'Clothing & Apparel': stallImages.clothing,
  'General Merchandise': stallImages.general,
};

const sizeCycle: StallSize[] = ['small', 'medium', 'medium', 'large', 'medium'];

function getSizeForStall(num: number): StallSize {
  return sizeCycle[(num - 1) % sizeCycle.length];
}

function getStatusForStall(num: number): StallStatus {
  if (num % 29 === 0) return 'occupied';
  if (num % 17 === 0) return 'reserved';
  if (num % 11 === 0) return 'pending';
  return 'available';
}

function getCategoryForStall(num: number): StallCategory {
  return categoryOrder[(num - 1) % categoryOrder.length];
}

function getDescriptionForStall(num: number, category: StallCategory): string {
  const descs = descriptions[category];
  return descs[(num - 1) % descs.length];
}

function getSectionForNumber(num: number): string {
  if (num <= 71) return 'Bottom Row';
  if (num <= 134) return 'Left Column';
  if (num === 135) return 'Top Left Corner';
  if (num <= 196) return 'Top Row';
  if (num <= 225) return 'Upper Right Row';
  return 'Right Column';
}

export function generateInitialStalls(): Stall[] {
  const stalls: Stall[] = [];

  for (let i = 1; i <= 258; i++) {
    const category = getCategoryForStall(i);
    const size = getSizeForStall(i);
    const status = getStatusForStall(i);

    stalls.push({
      id: String(i),
      section: getSectionForNumber(i),
      number: i,
      status,
      price: priceBySize[size],
      size,
      category,
      description: getDescriptionForStall(i, category),
      image: categoryImages[category],
      reservationId: undefined,
    });
  }

  const cornerConfigs = [
    { section: 'Corner A', prefix: 'A', count: 5 },
    { section: 'Corner B', prefix: 'B', count: 4 },
    { section: 'Corner C', prefix: 'C', count: 4 },
    { section: 'Corner D', prefix: 'D', count: 6 },
  ];

  let cornerSeed = 1000;
  for (const config of cornerConfigs) {
    for (let i = 1; i <= config.count; i++) {
      const category: StallCategory = 'General Merchandise';
      const status = getStatusForStall(cornerSeed++);

      stalls.push({
        id: `${config.prefix}${i}`,
        section: config.section,
        number: 0,
        status,
        price: priceBySize.corner,
        size: 'corner',
        category,
        description: getDescriptionForStall(i, category),
        image: categoryImages[category],
        reservationId: undefined,
      });
    }
  }

  return stalls;
}
