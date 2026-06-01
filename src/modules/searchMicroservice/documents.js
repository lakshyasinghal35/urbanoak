function toDetailsText(details) {
  if (details == null) {
    return '';
  }

  if (typeof details === 'string') {
    return details;
  }

  try {
    return JSON.stringify(details);
  } catch (error) {
    return '';
  }
}

function toSearchDocument(product) {
  const detailsText = toDetailsText(product.details);

  return {
    id: product.id,
    title: product.title || '',
    category: product.category || '',
    category_id: Number(product.category_id) || 0,
    wood_type: product.wood_type || '',
    dimensions: product.dimensions || '',
    mrp: Number(product.mrp) || 0,
    discount: product.discount == null ? null : Number(product.discount),
    units: Number(product.units) || 0,
    images: Array.isArray(product.images) ? product.images : [],
    details_text: detailsText,
    title_suggest: {
      input: [product.title, product.category, product.wood_type]
        .filter(Boolean)
        .map(value => String(value)),
    },
  };
}

module.exports = {
  toSearchDocument,
};
