const path = require('path');

module.exports = {
  rootDir: path.join(__dirname, '..'),
  setupFiles: ['<rootDir>/test/setup.js'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.js'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  forceExit: true,
};
