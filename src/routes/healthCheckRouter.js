const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    name: 'urbanoak',
    status: 'ok',
  });
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
  });
});

module.exports = router;
