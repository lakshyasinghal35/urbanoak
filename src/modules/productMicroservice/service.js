const repository = require('./repository');
const ApiError = require('../../common/apiError');
const cache = require('../../common/cache');
const { uploadImageToS3 } = require('../../common/s3Uploader');
const searchOutbox = require('../searchMicroservice/outbox.repository');
const { buildCacheKey, normalizeName } = cache;
const {
  CACHE_TTL_SECONDS,
  normalizeCategoryIds,
  invalidateCatalogCaches,
} = require('./util');

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function parseNonNegativeInteger(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

//--------------------------------category--------------------------------

async function saveCategory(category) {
  if (!category.name) {
    throw ApiError.badRequest('Category name is required');
  }

  let savedCategory = null;
  if (category.id) {
    const updated = await repository.saveCategory(category);
    if (!updated) {
      throw ApiError.notFound('Category not found');
    }
    savedCategory = updated;
  } else {
    savedCategory = await repository.createCategory(category);
  }

  await invalidateCatalogCaches({
    categoryId: savedCategory.id || category.id,
  });

  return savedCategory;
}

async function fetchCategory(id, name) {
  if (!id && !name) {
    throw ApiError.badRequest('Category id or name is required');
  }

  if (id) {
    return cache.save(
      buildCacheKey('category', 'id', id),
      CACHE_TTL_SECONDS.CATALOG,
      () => repository.getCategoryById(id),
    );
  }

  return cache.save(
    buildCacheKey('category', 'name', normalizeName(name)),
    CACHE_TTL_SECONDS.CATALOG,
    () => repository.getCategoryByName(name),
  );
}

async function fetchAllCategories() {
  return cache.save(
    buildCacheKey('categories', 'all'),
    CACHE_TTL_SECONDS.CATALOG,
    () => repository.getAllCategories(),
  );
}

async function removeCategory(id) {
  if (!id) {
    throw ApiError.badRequest('Category id is required');
  }

  const deleted = await repository.deleteCategory(id);
  if (!deleted) {
    throw ApiError.notFound('Category not found');
  }

  await invalidateCatalogCaches({ categoryId: id });
  return true;
}

//--------------------------------space--------------------------------

async function saveSpace(space) {
  if (!space.name) {
    throw ApiError.badRequest('Space name is required');
  }

  const savedSpace = space.id
    ? await repository.saveSpace(space)
    : await repository.createSpace(space);

  await invalidateCatalogCaches({
    spaceId: savedSpace?.id || space.id,
  });

  return savedSpace;
}

async function fetchSpace(id, name) {
  if (!id && !name) {
    throw ApiError.badRequest('Space id or name is required');
  }

  if (id) {
    return cache.save(
      buildCacheKey('space', 'id', id),
      CACHE_TTL_SECONDS.CATALOG,
      () => repository.getSpaceById(id),
    );
  }

  return cache.save(
    buildCacheKey('space', 'name', normalizeName(name)),
    CACHE_TTL_SECONDS.CATALOG,
    () => repository.getSpaceByName(name),
  );
}

async function fetchAllSpaces() {
  return cache.save(
    buildCacheKey('spaces', 'all'),
    CACHE_TTL_SECONDS.CATALOG,
    () => repository.getAllSpaces(),
  );
}

async function removeSpace(id) {
  if (!id) {
    throw ApiError.badRequest('Space id is required');
  }

  const deleted = await repository.deleteSpace(id);
  if (!deleted) {
    throw ApiError.notFound('Space not found');
  }

  await invalidateCatalogCaches({ spaceId: id });
  return true;
}

//--------------------------------section--------------------------------

async function saveSection(section) {
  if (!section.space_id || !section.category_id) {
    throw ApiError.badRequest('Section space_id and category_id are required');
  }

  const savedSection = section.id
    ? await repository.saveSection(section)
    : await repository.createSection(section);

  await invalidateCatalogCaches({
    sectionId: savedSection?.id || section.id,
    sectionSpaceId: savedSection?.space_id || section.space_id,
  });

  return savedSection;
}

async function fetchSection(id, space_id) {
  if (!id && !space_id) {
    throw ApiError.badRequest('Section id or space_id is required');
  }

  if (id) {
    return cache.save(
      buildCacheKey('section', 'id', id),
      CACHE_TTL_SECONDS.CATALOG,
      () => repository.getSectionById(id),
    );
  }

  return cache.save(
    buildCacheKey('sections', 'space', space_id),
    CACHE_TTL_SECONDS.CATALOG,
    () => repository.getSectionsBySpaceId(space_id),
  );
}

async function fetchAllSections() {
  return cache.save(
    buildCacheKey('sections', 'all'),
    CACHE_TTL_SECONDS.CATALOG,
    () => repository.getAllSections(),
  );
}

async function removeSection(id) {
  if (!id) {
    throw ApiError.badRequest('Section id is required');
  }

  const deleted = await repository.deleteSection(id);
  if (!deleted) {
    throw ApiError.notFound('Section not found');
  }

  await invalidateCatalogCaches({ sectionId: id });
  return true;
}

//--------------------------------product--------------------------------

async function saveProduct(product) {
  if (!product.title || !product.category_id || !product.category || !product.wood_type ||
        !product.mrp || !product.details || product.units == null) {
    throw ApiError.badRequest('Missing required product fields: title, category_id, category, wood_type, mrp, details, units');
  }

  const savedProduct = product.id
    ? await repository.saveProduct(product)
    : await repository.createProduct(product);

  await invalidateCatalogCaches({
    productId: savedProduct?.id || product.id,
    categoryId: savedProduct?.category_id || product.category_id,
  });
  await enqueueProductUpsert(savedProduct?.id || product.id);

  return savedProduct;
}

async function fetchProducts({ id, categoryIds, page, limit } = {}) {
  if (id) {
    return cache.save(
      buildCacheKey('product', 'id', id),
      CACHE_TTL_SECONDS.PRODUCT,
      () => repository.getProductById(id),
    );
  }

  if (categoryIds?.length) {
    const normalizedCategoryIds = normalizeCategoryIds(categoryIds);
    return cache.save(
      buildCacheKey('products', 'categories', normalizedCategoryIds.join(',')),
      CACHE_TTL_SECONDS.PRODUCT,
      () => repository.getProductsByCategoryIds(normalizedCategoryIds),
    );
  }

  if (page !== undefined || limit !== undefined) {
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Number(limit) : 20;
    const offset = (pageNum - 1) * limitNum;
    return cache.save(
      buildCacheKey('products', 'page', pageNum, 'limit', limitNum),
      CACHE_TTL_SECONDS.PRODUCT,
      () => repository.getProducts({ offset, limit: limitNum }),
    );
  }

  throw ApiError.badRequest('Product id or category_ids is required');
}

async function removeProduct(id) {
  if (!id) {
    throw ApiError.badRequest('Product id is required');
  }

  const deleted = await repository.deleteProduct(id);
  if (!deleted) {
    throw ApiError.notFound('Product not found');
  }

  await invalidateCatalogCaches({ productId: id });
  await enqueueProductDelete(id);
  return true;
}

async function updateProductInventory(productId, units) {
  if (!productId) {
    throw ApiError.badRequest('Product id is required');
  }

  const parsedUnits = parseNonNegativeInteger(units);
  if (parsedUnits == null) {
    throw ApiError.badRequest('Inventory units must be a non-negative integer');
  }

  const updatedProduct = await repository.updateProductUnits(productId, parsedUnits);
  if (!updatedProduct) {
    throw ApiError.notFound('Product not found');
  }

  await invalidateCatalogCaches({
    productId,
    categoryId: updatedProduct.category_id,
  });

  return updatedProduct;
}

async function decrementProductInventoryIfAvailable(productId, quantity) {
  const parsedQuantity = parseNonNegativeInteger(quantity);
  if (parsedQuantity == null || parsedQuantity === 0) {
    throw ApiError.badRequest('Inventory quantity must be a positive integer');
  }

  const updatedProduct = await repository.decrementProductUnitsIfAvailable(productId, parsedQuantity);
  if (!updatedProduct) {
    return null;
  }

  await invalidateCatalogCaches({
    productId,
    categoryId: updatedProduct.category_id,
  });

  return updatedProduct;
}

async function incrementProductInventory(productId, quantity) {
  const parsedQuantity = parseNonNegativeInteger(quantity);
  if (parsedQuantity == null || parsedQuantity === 0) {
    throw ApiError.badRequest('Inventory quantity must be a positive integer');
  }

  const updatedProduct = await repository.incrementProductUnits(productId, parsedQuantity);
  if (!updatedProduct) {
    throw ApiError.notFound('Product not found');
  }

  await invalidateCatalogCaches({
    productId,
    categoryId: updatedProduct.category_id,
  });

  return updatedProduct;
}

async function uploadCatalogImage(file, productId) {
  if (!file) {
    throw ApiError.badRequest('Image file is required');
  }

  if (!productId) {
    throw ApiError.badRequest('product_id is required');
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    throw ApiError.badRequest('Only jpeg, png, webp and gif images are supported');
  }

  const uploaded = await uploadImageToS3({
    buffer: file.buffer,
    mimeType: file.mimetype,
    originalName: file.originalname,
  });

  const product = await repository.getProductById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const existingImages = Array.isArray(product.images) ? product.images : [];
  const updatedImages = [...existingImages, uploaded.url];

  const updatedProduct = await repository.saveProduct({
    ...product,
    images: updatedImages,
  });

  if (!updatedProduct) {
    throw ApiError.notFound('Product not found');
  }

  await enqueueProductUpsert(updatedProduct.id || productId);

  return {
    product_id: productId,
    file_name: file.originalname,
    content_type: file.mimetype,
    size: file.size,
    bucket: uploaded.bucket,
    key: uploaded.key,
    url: uploaded.url,
    images: updatedImages,
  };
}

//--------------------------------push to search index queue--------------------------------

async function enqueueProductUpsert(productId) {
  if (!productId) {
    return;
  }

  await searchOutbox.enqueueProductEvent(
    searchOutbox.SEARCH_EVENT_TYPES.PRODUCT_UPSERT,
    String(productId)
  );
}

async function enqueueProductDelete(productId) {
  if (!productId) {
    return;
  }

  await searchOutbox.enqueueProductEvent(
    searchOutbox.SEARCH_EVENT_TYPES.PRODUCT_DELETE,
    String(productId)
  );
}

module.exports = {
  saveCategory,
  fetchCategory,
  fetchAllCategories,
  removeCategory,
  saveSpace,
  fetchSpace,
  fetchAllSpaces,
  removeSpace,
  saveSection,
  fetchSection,
  fetchAllSections,
  removeSection,
  saveProduct,
  fetchProducts,
  removeProduct,
  updateProductInventory,
  decrementProductInventoryIfAvailable,
  incrementProductInventory,
  uploadCatalogImage,
};
