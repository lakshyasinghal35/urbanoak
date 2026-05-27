const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const service = require('./service');

function parseCategoryIds(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map(id => Number(id.trim()))
    .filter(id => !Number.isNaN(id));
}

//--------------------------------space routes--------------------------------

router.post('/spaces', asyncHandler(async (req, res) => {
  const data = await service.saveSpace(req.body);
  sendSuccess(res, data, 201);
}));

router.put('/spaces', asyncHandler(async (req, res) => {
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

router.delete('/spaces/:id', asyncHandler(async (req, res) => {
  await service.removeSpace(req.params.id);
  sendSuccess(res, { deleted: true });
}));

//--------------------------------category routes--------------------------------

router.post('/categories', asyncHandler(async (req, res) => {
  const data = await service.saveCategory(req.body);
  sendSuccess(res, data, 201);
}));

router.put('/categories', asyncHandler(async (req, res) => {
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

router.delete('/categories/:id', asyncHandler(async (req, res) => {
  await service.removeCategory(req.params.id);
  sendSuccess(res, { deleted: true });
}));

//--------------------------------section routes--------------------------------

router.post('/sections', asyncHandler(async (req, res) => {
  const data = await service.saveSection(req.body);
  sendSuccess(res, data, 201);
}));

router.put('/sections', asyncHandler(async (req, res) => {
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

router.delete('/sections/:id', asyncHandler(async (req, res) => {
  await service.removeSection(req.params.id);
  sendSuccess(res, { deleted: true });
}));

//--------------------------------product routes--------------------------------

router.post('/products', asyncHandler(async (req, res) => {
  const data = await service.saveProduct(req.body);
  sendSuccess(res, data, 201);
}));

router.put('/products', asyncHandler(async (req, res) => {
  const data = await service.saveProduct(req.body);
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

router.delete('/products/:id', asyncHandler(async (req, res) => {
  await service.removeProduct(req.params.id);
  sendSuccess(res, { deleted: true });
}));

module.exports = router;
