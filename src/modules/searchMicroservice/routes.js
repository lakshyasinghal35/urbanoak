const express = require('express');
const { sendSuccess } = require('../../common/response');
const asyncHandler = require('../../common/asyncHandler');
const service = require('./service');

const router = express.Router();

function parseCategoryIds(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map(id => Number(id.trim()))
    .filter(id => !Number.isNaN(id));
}

router.get('/products/search', asyncHandler(async (req, res) => {
  const data = await service.searchProducts({
    q: req.query.q,
    categoryIds: parseCategoryIds(req.query.category_ids),
    page: req.query.page,
    limit: req.query.limit,
  });
  sendSuccess(res, data);
}));

router.get('/products/suggest', asyncHandler(async (req, res) => {
  const data = await service.suggestProducts({
    q: req.query.q,
    limit: req.query.limit,
  });
  sendSuccess(res, data);
}));

module.exports = router;
