const path = require('path');

global.appRoot = path.join(__dirname, '../../src');

require('../../src/config/db');
const { ProductModel } = require('../../src/models/mongoSchemas');
const { ensureSearchIndex } = require('../../src/modules/searchMicroservice/indexManager');
const { SEARCH_INDEX_NAME } = require('../../src/modules/searchMicroservice/service');
const searchRepository = require('../../src/modules/searchMicroservice/repository');
const query = require('../../src/modules/productMicroservice/query');

async function run() {
  console.log('[reindex] ensuring search index...');
  await ensureSearchIndex();

  console.log('[reindex] reading products from MongoDB...');
  const BATCH_SIZE = 200;
  let totalCount = await ProductModel.countDocuments();
  let indexed = 0;

  console.log(`[reindex] found ${totalCount} products to index...`);
  for (let skip = 0; skip < totalCount; skip += BATCH_SIZE) {
    const docs = await ProductModel.find().skip(skip).limit(BATCH_SIZE);

    console.log(`[reindex] indexing products ${skip + 1}-${skip + docs.length}...`);
    for (const doc of docs) {
      const product = query.toProduct(doc);
      // eslint-disable-next-line no-await-in-loop
      await searchRepository.upsertProductDocument(SEARCH_INDEX_NAME, product);
      indexed++;
    }
  }

  console.log('[reindex] done');
  process.exit(0);
}

run().catch(error => {
  console.error('[reindex] failed:', error);
  process.exit(1);
});
