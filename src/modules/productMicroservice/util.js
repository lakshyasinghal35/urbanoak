const cache = require('../../common/cache');

const CACHE_TTL_SECONDS = {
  CATALOG: 1800,
  PRODUCT: 300,
};
const { buildCacheKey } = cache;

function normalizeCategoryIds(categoryIds) {
  return [...categoryIds]
    .map(Number)
    .filter(id => !Number.isNaN(id))
    .sort((a, b) => a - b);
}

async function invalidateCatalogCaches({
  categoryId,
  spaceId,
  sectionId,
  sectionSpaceId,
  productId,
} = {}) {
  await cache.deleteKeys([
    categoryId ? buildCacheKey('category', 'id', categoryId) : null,
    spaceId ? buildCacheKey('space', 'id', spaceId) : null,
    sectionId ? buildCacheKey('section', 'id', sectionId) : null,
    sectionSpaceId ? buildCacheKey('sections', 'space', sectionSpaceId) : null,
    productId ? buildCacheKey('product', 'id', productId) : null,
    buildCacheKey('categories', 'all'),
    buildCacheKey('spaces', 'all'),
    buildCacheKey('sections', 'all'),
  ]);

  await cache.deleteByPrefix([
    buildCacheKey('category', 'name'),
    buildCacheKey('space', 'name'),
    buildCacheKey('products', 'categories'),
    buildCacheKey('products', 'page'),
  ]);
}

module.exports = {
  CACHE_TTL_SECONDS,
  normalizeCategoryIds,
  invalidateCatalogCaches,
};
