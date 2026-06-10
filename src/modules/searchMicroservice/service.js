const ApiError = require('../../common/apiError');
const config = require('../../config');
const repository = require('./repository');

const SEARCH_CONFIG = config.elasticsearch || {};
const SEARCH_INDEX_NAME = SEARCH_CONFIG.index_name;

function normalizeCategoryIds(categoryIds) {
  if (!Array.isArray(categoryIds)) {
    return [];
  }

  return categoryIds
    .map(Number)
    .filter(id => !Number.isNaN(id));
}

async function searchProducts({ q, categoryIds, page, limit } = {}) {
  if (!q || !String(q).trim()) {
    throw ApiError.badRequest('q is required');
  }

  const normalizedCategoryIds = normalizeCategoryIds(categoryIds);
  const normalizedPage = Number(page) > 0 ? Number(page) : 1;
  const normalizedLimit = Number(limit) > 0 ? Number(limit) : 20;

  return repository.searchProducts(SEARCH_INDEX_NAME, {
    queryText: String(q).trim(),
    categoryIds: normalizedCategoryIds,
    page: normalizedPage,
    limit: normalizedLimit,
  });
}

async function suggestProducts({ q, limit } = {}) {
  if (!q || !String(q).trim()) {
    throw ApiError.badRequest('q is required');
  }

  const normalizedLimit = Number(limit) > 0 ? Number(limit) : 10;
  return repository.suggestProducts(SEARCH_INDEX_NAME, {
    queryText: String(q).trim(),
    limit: normalizedLimit,
  });
}

module.exports = {
  searchProducts,
  suggestProducts,
  SEARCH_INDEX_NAME,
};
