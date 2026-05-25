// MySQL queries for categories, spaces, and sections; MongoDB for products

const { mongoose } = require('../../config/db');
const { Schema } = mongoose;

//--------------------------------category--------------------------------

const createCategoryQuery = `
  INSERT INTO categories (name)
  VALUES (?);
`;

function categoryParams(category) {
  return [category.name];
}

const saveCategoryQuery = `
  UPDATE categories
  SET name = ?
  WHERE id = ?;
`;

function saveCategoryParams(category) {
  return [category.name, category.id];
}

const deleteCategoryQuery = `
  DELETE FROM categories WHERE id = ?;
`;

const getCategoryByIdQuery = `
  SELECT * FROM categories WHERE id = ?;
`;

const getCategoryByNameQuery = `
  SELECT * FROM categories WHERE name = ?;
`;

const getAllCategoriesQuery = `
  SELECT * FROM categories;
`;

//--------------------------------space--------------------------------

const createSpaceQuery = `
  INSERT INTO spaces (name, cover_image)
  VALUES (?, ?);
`;

function spaceParams(space) {
  return [space.name, space.cover_image];
}

const saveSpaceQuery = `
  UPDATE spaces
  SET name = ?, cover_image = ?
  WHERE id = ?;
`;

function saveSpaceParams(space) {
  return [space.name, space.cover_image, space.id];
}

const deleteSpaceQuery = `
  DELETE FROM spaces WHERE id = ?;
`;

const getSpaceByIdQuery = `
  SELECT * FROM spaces WHERE id = ?;
`;

const getSpaceByNameQuery = `
  SELECT * FROM spaces WHERE name = ?;
`;

const getAllSpacesQuery = `
  SELECT * FROM spaces;
`;

//--------------------------------section--------------------------------

const createSectionQuery = `
  INSERT INTO sections (space_id, category_id)
  VALUES (?, ?);
`;

function sectionParams(section) {
  return [section.space_id, section.category_id];
}

const saveSectionQuery = `
  UPDATE sections
  SET space_id = ?, category_id = ?
  WHERE id = ?;
`;

function saveSectionParams(section) {
  return [section.space_id, section.category_id, section.id];
}

const deleteSectionQuery = `
  DELETE FROM sections WHERE id = ?;
`;

const getSectionByIdQuery = `
  SELECT * FROM sections WHERE id = ?;
`;

const getAllSectionsQuery = `
  SELECT * FROM sections;
`;

const getSectionsBySpaceIdQuery = `
  SELECT * FROM sections WHERE space_id = ?;
`;

//--------------------------------product--------------------------------

const COLLECTIONS = {
  PRODUCTS: 'products',
};

const productSchema = new Schema(
  {
    title: { type: String, required: true },
    category_id: { type: Number, required: true, index: true },
    category: { type: String, required: true },
    wood_type: { type: String, required: true },
    dimensions: { type: String },
    mrp: { type: Number, required: true },
    discount: { type: Number },
    images: { type: Schema.Types.Mixed },
    details: { type: String, required: true },
    units: { type: Number, required: true },
  },
  { collection: COLLECTIONS.PRODUCTS, timestamps: true }
);

const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema);

function productDocument(product) {
  return {
    title: product.title,
    category_id: product.category_id,
    category: product.category,
    wood_type: product.wood_type,
    dimensions: product.dimensions,
    mrp: product.mrp,
    discount: product.discount,
    images: product.images,
    details: product.details,
    units: product.units,
  };
}

function productsByCategoryIdsFilter(categoryIds) {
  return {
    category_id: { $in: categoryIds.map(id => Number(id)) },
  };
}

function toProduct(doc) {
  if (!doc) {
    return null;
  }

  const obj = doc.toObject();
  return {
    id: obj._id.toString(),
    title: obj.title,
    category_id: obj.category_id,
    category: obj.category,
    wood_type: obj.wood_type,
    dimensions: obj.dimensions,
    mrp: obj.mrp,
    discount: obj.discount,
    images: obj.images,
    details: obj.details,
    units: obj.units,
  };
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

module.exports = {
  createCategoryQuery,
  saveCategoryQuery,
  deleteCategoryQuery,
  getCategoryByIdQuery,
  getCategoryByNameQuery,
  getAllCategoriesQuery,
  categoryParams,
  saveCategoryParams,
  createSpaceQuery,
  saveSpaceQuery,
  deleteSpaceQuery,
  getSpaceByIdQuery,
  getSpaceByNameQuery,
  getAllSpacesQuery,
  spaceParams,
  saveSpaceParams,
  createSectionQuery,
  saveSectionQuery,
  deleteSectionQuery,
  getSectionByIdQuery,
  getAllSectionsQuery,
  getSectionsBySpaceIdQuery,
  sectionParams,
  saveSectionParams,
  COLLECTIONS,
  ProductModel,
  productDocument,
  productsByCategoryIdsFilter,
  toProduct,
  isValidObjectId,
};
