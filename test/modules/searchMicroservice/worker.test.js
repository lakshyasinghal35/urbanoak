jest.mock('../../../src/config/elasticsearch', () => ({
  isSearchEnabled: jest.fn(() => true),
}));

jest.mock('../../../src/modules/searchMicroservice/service', () => ({
  SEARCH_INDEX_NAME: 'urbanoak_products',
}));

jest.mock('../../../src/modules/searchMicroservice/repository', () => ({
  upsertProductDocument: jest.fn(),
  deleteProductDocument: jest.fn(),
}));

jest.mock('../../../src/modules/searchMicroservice/outbox.repository', () => ({
  SEARCH_EVENT_TYPES: {
    PRODUCT_UPSERT: 'product_upsert',
    PRODUCT_DELETE: 'product_delete',
  },
  claimPendingEvents: jest.fn(),
  completeEvent: jest.fn(),
  failEvent: jest.fn(),
}));

jest.mock('../../../src/modules/productMicroservice/repository', () => ({
  getProductById: jest.fn(),
}));

const worker = require('../../../src/modules/searchMicroservice/index.worker');
const outboxRepository = require('../../../src/modules/searchMicroservice/outbox.repository');
const searchRepository = require('../../../src/modules/searchMicroservice/repository');
const productRepository = require('../../../src/modules/productMicroservice/repository');
const elasticsearchConfig = require('../../../src/config/elasticsearch');

describe('searchMicroservice/index.worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    elasticsearchConfig.isSearchEnabled.mockReturnValue(true);
  });

  it('upserts product for product_upsert events', async () => {
    outboxRepository.claimPendingEvents.mockResolvedValue([
      {
        id: 'evt_1',
        event_type: 'product_upsert',
        product_id: '507f1f77bcf86cd799439011',
        attempts: 0,
      },
    ]);
    productRepository.getProductById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      title: 'Chair',
      category_id: 1,
      category: 'Chairs',
      wood_type: 'Oak',
      details: 'solid',
      mrp: 1000,
      units: 2,
    });

    await worker.processPendingEvents();

    expect(searchRepository.upsertProductDocument).toHaveBeenCalled();
    expect(outboxRepository.completeEvent).toHaveBeenCalledWith('evt_1');
  });

  it('deletes product document for product_delete events', async () => {
    outboxRepository.claimPendingEvents.mockResolvedValue([
      {
        id: 'evt_2',
        event_type: 'product_delete',
        product_id: '507f1f77bcf86cd799439012',
        attempts: 1,
      },
    ]);

    await worker.processPendingEvents();

    expect(searchRepository.deleteProductDocument).toHaveBeenCalledWith(
      'urbanoak_products',
      '507f1f77bcf86cd799439012'
    );
    expect(outboxRepository.completeEvent).toHaveBeenCalledWith('evt_2');
  });
});
