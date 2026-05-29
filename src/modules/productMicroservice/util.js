const cache = require('../../common/cache');
const multer = require('multer');
const ApiError = require('../../common/apiError');

const CACHE_TTL_SECONDS = {
  CATALOG: 1800,
  PRODUCT: 300,
};
const { buildCacheKey } = cache;

//--------------------------------upload image util functions--------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.S3_MAX_IMAGE_SIZE_BYTES || 10 * 1024 * 1024),
  },
});

const uploadSingleImage = upload.single('image');

function singleImageUploadMiddleware(req, res, next) {
  uploadSingleImage(req, res, error => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('Image exceeds max allowed size'));
      }
      return next(ApiError.badRequest(error.message));
    }

    return next(error);
  });
}

//--------------------------------category util functions--------------------------------


function parseCategoryIds(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map(id => Number(id.trim()))
    .filter(id => !Number.isNaN(id));
}

//--------------------------------cache util functions--------------------------------

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
  singleImageUploadMiddleware,
  parseCategoryIds,
};
