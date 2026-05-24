const repository = require('./repository');
const ApiError = require('../../utils/apiError');

//--------------------------------category--------------------------------

async function saveCategory(category) {
  if (!category.name) {
    throw ApiError.badRequest('Category name is required');
  }

  return category.id ? repository.saveCategory(category) : repository.createCategory(category);
}

async function fetchCategory(id, name) {
  if (!id && !name) {
    throw ApiError.badRequest('Category id or name is required');
  }

  return id ? repository.getCategoryById(id) : repository.getCategoryByName(name);
}

async function fetchAllCategories() {
  return repository.getAllCategories();
}

async function removeCategory(id) {
  if (!id) {
    throw ApiError.badRequest('Category id is required');
  }

  const deleted = await repository.deleteCategory(id);
  if (!deleted) {
    throw ApiError.notFound('Category not found');
  }

  return true;
}

//--------------------------------space--------------------------------

async function saveSpace(space) {
  if (!space.name) {
    throw ApiError.badRequest('Space name is required');
  }

  return space.id ? repository.saveSpace(space) : repository.createSpace(space);
}

async function fetchSpace(id, name) {
  if (!id && !name) {
    throw ApiError.badRequest('Space id or name is required');
  }

  return id ? repository.getSpaceById(id) : repository.getSpaceByName(name);
}

async function fetchAllSpaces() {
  return repository.getAllSpaces();
}

async function removeSpace(id) {
  if (!id) {
    throw ApiError.badRequest('Space id is required');
  }

  const deleted = await repository.deleteSpace(id);
  if (!deleted) {
    throw ApiError.notFound('Space not found');
  }

  return true;
}

//--------------------------------section--------------------------------

async function saveSection(section) {
  if (!section.space_id || !section.category_id) {
    throw ApiError.badRequest('Section space_id and category_id are required');
  }

  return section.id ? repository.saveSection(section) : repository.createSection(section);
}

async function fetchSection(id, space_id) {
  if (!id && !space_id) {
    throw ApiError.badRequest('Section id or space_id is required');
  }

  return id ? repository.getSectionById(id) : repository.getSectionsBySpaceId(space_id);
}

async function fetchAllSections() {
  return repository.getAllSections();
}

async function removeSection(id) {
  if (!id) {
    throw ApiError.badRequest('Section id is required');
  }

  const deleted = await repository.deleteSection(id);
  if (!deleted) {
    throw ApiError.notFound('Section not found');
  }

  return true;
}

//--------------------------------product--------------------------------

async function saveProduct(product) {
  if (!product.title || !product.category_id || !product.category || !product.wood_type ||
        !product.mrp || !product.details || product.units == null) {
    throw ApiError.badRequest('Missing required product fields: title, category_id, category, wood_type, mrp, details, units');
  }

  return product.id ? repository.saveProduct(product) : repository.createProduct(product);
}

async function fetchProducts({ id, categoryIds, page = 1, limit = 20 } = {}) {
  if ((page !== undefined && limit !== undefined) || (page !== undefined && !id && !categoryIds)) {
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Number(limit) : 20;
    const offset = (pageNum - 1) * limitNum;
    return repository.getProducts({ offset, limit: limitNum });
  }

  if (!id && !categoryIds) {
    throw ApiError.badRequest('Product id or category_ids is required');
  }

  return id ? repository.getProductById(id) : repository.getProductsByCategoryIds(categoryIds);
}

async function removeProduct(id) {
  if (!id) {
    throw ApiError.badRequest('Product id is required');
  }

  const deleted = await repository.deleteProduct(id);
  if (!deleted) {
    throw ApiError.notFound('Product not found');
  }

  return true;
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
};
