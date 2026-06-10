/**
 * Loads .env files before any other config module reads process.env.
 * Precedence (later files do not override already-set variables):
 *   .env -> .env.{APP_ENV} -> .env.local -> .env.{APP_ENV}.local
 */
const fs = require('fs');
const path = require('path');
const { config: loadDotenv } = require('dotenv');

const projectRoot = path.resolve(__dirname, '../..');

function resolveAppEnv() {
  if (process.env.APP_ENV) {
    return process.env.APP_ENV;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }
  return 'local';
}

const appEnv = resolveAppEnv();
process.env.APP_ENV = appEnv;

const envFiles = [
  '.env',
  `.env.${appEnv}`,
  '.env.local',
  `.env.${appEnv}.local`,
];

for (const file of envFiles) {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    loadDotenv({ path: filePath });
  }
}

module.exports = { appEnv, projectRoot };
