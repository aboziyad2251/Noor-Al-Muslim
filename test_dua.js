const { AZKAR_BY_CATEGORY, CATEGORIES } = require('./data/azkar.js');

const query = 'الرزق'.trim().toLowerCase();
let found = [];

Object.keys(AZKAR_BY_CATEGORY).forEach((catId) => {
  const azkarList = AZKAR_BY_CATEGORY[catId];
  const category = CATEGORIES.find((c) => c.id === catId);
  
  if (azkarList && Array.isArray(azkarList)) {
    azkarList.forEach((item) => {
      const match = 
        (item.translation && item.translation.toLowerCase().includes(query)) ||
        (item.description && item.description.includes(query)) ||
        (item.arabic && item.arabic.includes(query)) ||
        (category && category.title && category.title.includes(query)) ||
        (category && category.subtitle && category.subtitle.toLowerCase().includes(query));
        
      if (match) {
        if (!found.some(f => f.id === item.id)) {
          found.push({ ...item, category });
        }
      }
    });
  }
});

console.log(`Found: ${found.length}`);
console.log(found[0]?.arabic);
