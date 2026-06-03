const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../../common/response');
const asyncHandler = require('../../common/asyncHandler');
const service = require('./service');
const { requireAdmin } = require('../../common/middleware/auth');
const {
  singleImageUploadMiddleware,
  parseCategoryIds,
} = require('./util');

//--------------------------------space routes--------------------------------

router.post('/spaces', ...requireAdmin, asyncHandler(async (req, res) => {
  const data = await service.saveSpace(req.body);
  sendSuccess(res, data, 201);
}));

router.put('/spaces', ...requireAdmin, asyncHandler(async (req, res) => {
  const data = await service.saveSpace(req.body);
  sendSuccess(res, data);
}));

router.get('/spaces', asyncHandler(async (req, res) => {
  const { id, name } = req.query;
  const data = await service.fetchSpace(id, name);
  sendSuccess(res, data);
}));

router.get('/spaces/all', asyncHandler(async (req, res) => {
  const data = await service.fetchAllSpaces();
  sendSuccess(res, data);
}));

router.delete('/spaces/:id', ...requireAdmin, asyncHandler(async (req, res) => {
  await service.removeSpace(req.params.id);
  sendSuccess(res, { deleted: true });
}));

//--------------------------------category routes--------------------------------

router.post('/categories', ...requireAdmin, asyncHandler(async (req, res) => {
  const data = await service.saveCategory(req.body);
  sendSuccess(res, data, 201);
}));

router.put('/categories', ...requireAdmin, asyncHandler(async (req, res) => {
  const data = await service.saveCategory(req.body);
  sendSuccess(res, data);
}));

router.get('/categories', asyncHandler(async (req, res) => {
  const { id, name } = req.query;
  const data = await service.fetchCategory(id, name);
  sendSuccess(res, data);
}));

router.get('/categories/all', asyncHandler(async (req, res) => {
  const data = await service.fetchAllCategories();
  sendSuccess(res, data);
}));

router.delete('/categories/:id', ...requireAdmin, asyncHandler(async (req, res) => {
  await service.removeCategory(req.params.id);
  sendSuccess(res, { deleted: true });
}));

//--------------------------------section routes--------------------------------

router.post('/sections', ...requireAdmin, asyncHandler(async (req, res) => {
  const data = await service.saveSection(req.body);
  sendSuccess(res, data, 201);
}));

router.put('/sections', ...requireAdmin, asyncHandler(async (req, res) => {
  const data = await service.saveSection(req.body);
  sendSuccess(res, data);
}));

router.get('/sections', asyncHandler(async (req, res) => {
  const { id, space_id } = req.query;
  const data = await service.fetchSection(id, space_id);
  sendSuccess(res, data);
}));

router.get('/sections/all', asyncHandler(async (req, res) => {
  const data = await service.fetchAllSections();
  sendSuccess(res, data);
}));

router.delete('/sections/:id', ...requireAdmin, asyncHandler(async (req, res) => {
  await service.removeSection(req.params.id);
  sendSuccess(res, { deleted: true });
}));

//--------------------------------product routes--------------------------------

router.post('/products', ...requireAdmin, asyncHandler(async (req, res) => {
  const data = await service.saveProduct(req.body);
  sendSuccess(res, data, 201);
}));

router.put('/products', ...requireAdmin, asyncHandler(async (req, res) => {
  const data = await service.saveProduct(req.body);
  sendSuccess(res, data);
}));

router.patch('/products/:id/inventory', ...requireAdmin, asyncHandler(async (req, res) => {
  const data = await service.updateProductInventory(req.params.id, req.body.units);
  sendSuccess(res, data);
}));

router.get('/products/:id/inventory', asyncHandler(async (req, res) => {
  const data = await service.fetchProductInventory(req.params.id);
  sendSuccess(res, data);
}));

router.get('/products', asyncHandler(async (req, res) => {
  const { id } = req.query;
  const categoryIds = parseCategoryIds(req.query.category_ids);
  const data = await service.fetchProducts({
    id,
    categoryIds: categoryIds.length ? categoryIds : null,
  });
  sendSuccess(res, data);
}));

router.get('/products/list', asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const data = await service.fetchProducts({
    page: page ?? 1,
    limit: limit ?? 20,
  });
  sendSuccess(res, data);
}));

router.delete('/products/:id', ...requireAdmin, asyncHandler(async (req, res) => {
  await service.removeProduct(req.params.id);
  sendSuccess(res, { deleted: true });
}));

router.post('/products/images/upload', ...requireAdmin, singleImageUploadMiddleware, asyncHandler(async (req, res) => {
  const data = await service.uploadCatalogImage(req.file, req.body.product_id);
  sendSuccess(res, data, 201);
}));

module.exports = router;
