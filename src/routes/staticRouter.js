const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    name: 'urbanoak',
    status: 'ok',
    api: '/api',
  });
});

module.exports = router;
