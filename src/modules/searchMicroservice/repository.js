const ApiError = require('../../common/apiError');
const { elasticsearchClient } = require('../../config/elasticsearch');
const { toSearchDocument } = require('./documents');

const client = elasticsearchClient();

async function upsertProductDocument(indexName, product) {
  if (!client) {
    return;
  }

  await client.index({
    index: indexName,
    id: String(product.id),
    document: toSearchDocument(product),
    refresh: false,
  });
}

async function deleteProductDocument(indexName, productId) {
  if (!client) {
    return;
  }

  try {
    await client.delete({
      index: indexName,
      id: String(productId),
      refresh: false,
    });
  } catch (error) {
    if (error?.meta?.statusCode === 404) {
      return;
    }
    throw error;
  }
}

async function searchProducts(indexName, { queryText, categoryIds, page, limit }) {
  if (!client) {
    throw ApiError.serviceUnavailable('Search service is unavailable');
  }

  const from = (page - 1) * limit;
  const must = queryText
    ? [{
      multi_match: {
        query: queryText,
        fields: ['title^3', 'category^2', 'wood_type^2', 'dimensions', 'details_text'],
        fuzziness: 'AUTO',
      },
    }]
    : [{ match_all: {} }];

  const filter = [];
  if (categoryIds?.length) {
    filter.push({
      terms: {
        category_id: categoryIds.map(id => Number(id)),
      },
    });
  }

  const result = await client.search({
    index: indexName,
    from,
    size: limit,
    query: {
      bool: {
        must,
        filter,
      },
    },
  });

  return {
    total: Number(result.hits?.total?.value || 0),
    page,
    limit,
    items: (result.hits?.hits || []).map(hit => ({
      id: hit._id,
      ...(hit._source || {}),
    })),
  };
}

async function suggestProducts(indexName, { queryText, limit }) {
  if (!client) {
    throw ApiError.serviceUnavailable('Search service is unavailable');
  }

  const result = await client.search({
    index: indexName,
    suggest: {
      product_title_suggest: {
        prefix: queryText,
        completion: {
          field: 'title_suggest',
          skip_duplicates: true,
          size: limit,
        },
      },
    },
    size: 0,
  });

  const options = result.suggest?.product_title_suggest?.[0]?.options || [];
  return options.map(option => option.text);
}

module.exports = {
  upsertProductDocument,
  deleteProductDocument,
  searchProducts,
  suggestProducts,
};
