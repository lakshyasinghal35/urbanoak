const { pool } = require('../../config/db');
const Product = require('./model/product');
const Category = require('./model/category');
const Space = require('./model/space');
const Section = require('./model/section');
const queries = require('./query');
const ApiError = require('../../common/apiError');
const { ProductModel, isDuplicateKeyError } = require('../../models/mongoSchemas');

//--------------------------------category--------------------------------

async function createCategory(category) {
  const sql = queries.createCategoryQuery;

  const [result] = await pool.execute(sql, queries.categoryParams(category));

  return new Category({
    id: result.insertId,
    ...category,
  });
}

async function saveCategory(category) {
  const sql = queries.saveCategoryQuery;

  const [result] = await pool.execute(sql, queries.saveCategoryParams(category));

  if (result.affectedRows === 0) {
    return null;
  }

  return new Category(category);
}

async function deleteCategory(id) {
  const sql = queries.deleteCategoryQuery;

  const [result] = await pool.execute(sql, [id]);

  return result.affectedRows > 0;
}

async function getCategoryById(id) {
  const sql = queries.getCategoryByIdQuery;

  const [rows] = await pool.execute(sql, [id]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return new Category(rows[0]);
}

async function getCategoryByName(name) {
  const sql = queries.getCategoryByNameQuery;

  const [rows] = await pool.execute(sql, [name]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return new Category(rows[0]);
}

async function getAllCategories() {
  const sql = queries.getAllCategoriesQuery;

  const [rows] = await pool.execute(sql);
  return rows.map(row => new Category(row));
}

//--------------------------------space--------------------------------

async function createSpace(space) {
  const sql = queries.createSpaceQuery;

  const [result] = await pool.execute(sql, queries.spaceParams(space));

  return new Space({
    id: result.insertId,
    ...space,
  });
}

async function saveSpace(space) {
  const sql = queries.saveSpaceQuery;

  await pool.execute(sql, queries.saveSpaceParams(space));

  return new Space(space);
}

async function deleteSpace(id) {
  const sql = queries.deleteSpaceQuery;

  const [result] = await pool.execute(sql, [id]);

  return result.affectedRows > 0;
}

async function getSpaceById(id) {
  const sql = queries.getSpaceByIdQuery;

  const [rows] = await pool.execute(sql, [id]);
  if (!rows || rows.length === 0) {
    return null;
  }
  return new Space(rows[0]);
}

async function getSpaceByName(name) {
  const sql = queries.getSpaceByNameQuery;

  const [rows] = await pool.execute(sql, [name]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return new Space(rows[0]);
}

async function getAllSpaces() {
  const sql = queries.getAllSpacesQuery;

  const [rows] = await pool.execute(sql);
  return rows.map(row => new Space(row));
}

//--------------------------------section--------------------------------

async function createSection(section) {
  const sql = queries.createSectionQuery;

  const [result] = await pool.execute(sql, queries.sectionParams(section));

  return new Section({
    id: result.insertId,
    ...section,
  });
}

async function saveSection(section) {
  const sql = queries.saveSectionQuery;

  await pool.execute(sql, queries.saveSectionParams(section));

  return new Section(section);
}

async function deleteSection(id) {
  const sql = queries.deleteSectionQuery;

  const [result] = await pool.execute(sql, [id]);

  return result.affectedRows > 0;
}

async function getSectionById(id) {
  const sql = queries.getSectionByIdQuery;

  const [rows] = await pool.execute(sql, [id]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return new Section(rows[0]);
}

async function getAllSections() {
  const sql = queries.getAllSectionsQuery;

  const [rows] = await pool.execute(sql);
  return rows.map(row => new Section(row));
}

async function getSectionsBySpaceId(space_id) {
  const sql = queries.getSectionsBySpaceIdQuery;

  const [rows] = await pool.execute(sql, [space_id]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return rows.map(row => new Section(row));
}

//--------------------------------product--------------------------------

async function createProduct(product) {
  try {
    const doc = await ProductModel.create(queries.productDocument(product));
    return new Product(queries.toProduct(doc));
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw ApiError.conflict('Product with this title already exists');
    }
    throw err;
  }
}

async function saveProduct(product) {
  if (!queries.isValidObjectId(product.id)) {
    return null;
  }

  try {
    const doc = await ProductModel.findByIdAndUpdate(
      product.id,
      queries.productDocument(product),
      { new: true, runValidators: true }
    );

    if (!doc) {
      return null;
    }

    return new Product(queries.toProduct(doc));
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw ApiError.conflict('Product with this title already exists');
    }
    throw err;
  }
}

async function deleteProduct(id) {
  if (!queries.isValidObjectId(id)) {
    return false;
  }

  const doc = await ProductModel.findByIdAndDelete(id);
  return doc != null;
}

async function getProductById(id) {
  if (!queries.isValidObjectId(id)) {
    return null;
  }

  const doc = await ProductModel.findById(id);
  if (!doc) {
    return null;
  }

  return new Product(queries.toProduct(doc));
}

async function getProductUnitsById(id) {
  if (!queries.isValidObjectId(id)) {
    return null;
  }

  const doc = await ProductModel.findById(id)
    .select({ units: 1 })
    .lean();
  if (!doc) {
    return null;
  }

  return {
    id: doc._id.toString(),
    units: doc.units,
  };
}

async function getProducts({ offset = 0, limit = 20 } = {}) {
  const docs = await ProductModel.find()
    .skip(offset)
    .limit(limit);

  return docs.map(doc => new Product(queries.toProduct(doc)));
}

async function getProductsByCategoryIds(categoryIds) {
  if (!categoryIds || categoryIds.length === 0) {
    return [];
  }

  const docs = await ProductModel.find(
    queries.productsByCategoryIdsFilter(categoryIds)
  );

  return docs.map(doc => new Product(queries.toProduct(doc)));
}

async function updateProductUnits(productId, units) {
  if (!queries.isValidObjectId(productId)) {
    return null;
  }

  const doc = await ProductModel.findByIdAndUpdate(
    productId,
    { $set: { units } },
    { new: true, runValidators: true }
  );

  if (!doc) {
    return null;
  }

  return new Product(queries.toProduct(doc));
}

async function decrementProductUnitsIfAvailable(productId, quantity) {
  if (!queries.isValidObjectId(productId)) {
    return null;
  }

  const doc = await ProductModel.findOneAndUpdate(
    {
      _id: productId,
      units: { $gte: quantity },
    },
    { $inc: { units: -quantity } },
    { new: true, runValidators: true }
  );

  if (!doc) {
    return null;
  }

  return new Product(queries.toProduct(doc));
}

async function incrementProductUnits(productId, quantity) {
  if (!queries.isValidObjectId(productId)) {
    return null;
  }

  const doc = await ProductModel.findByIdAndUpdate(
    productId,
    { $inc: { units: quantity } },
    { new: true, runValidators: true }
  );

  if (!doc) {
    return null;
  }

  return new Product(queries.toProduct(doc));
}

module.exports = {
  createCategory,
  saveCategory,
  deleteCategory,
  getCategoryById,
  getCategoryByName,
  getAllCategories,
  createSpace,
  saveSpace,
  deleteSpace,
  getSpaceById,
  getSpaceByName,
  getAllSpaces,
  createSection,
  saveSection,
  deleteSection,
  getSectionById,
  getAllSections,
  getSectionsBySpaceId,
  createProduct,
  saveProduct,
  deleteProduct,
  getProductById,
  getProductUnitsById,
  getProducts,
  getProductsByCategoryIds,
  updateProductUnits,
  decrementProductUnitsIfAvailable,
  incrementProductUnits,
};
