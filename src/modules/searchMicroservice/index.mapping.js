const PRODUCT_SEARCH_INDEX_SETTINGS = {
  settings: {
    analysis: {
      normalizer: {
        lowercase_normalizer: {
          type: 'custom',
          filter: ['lowercase'],
        },
      },
    },
  },
  mappings: {
    properties: {
      id: { type: 'keyword' },
      title: { type: 'text' },
      category: { type: 'text' },
      category_id: { type: 'integer' },
      wood_type: { type: 'text' },
      dimensions: { type: 'text' },
      details_text: { type: 'text' },
      mrp: { type: 'double' },
      discount: { type: 'double' },
      units: { type: 'integer' },
      images: { type: 'keyword' },
      title_suggest: { type: 'completion' },
    },
  },
};

module.exports = {
  PRODUCT_SEARCH_INDEX_SETTINGS,
};
