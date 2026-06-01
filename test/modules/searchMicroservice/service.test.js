const searchRepository = require('../../../src/modules/searchMicroservice/repository');
const searchService = require('../../../src/modules/searchMicroservice/service');

jest.mock('../../../src/modules/searchMicroservice/repository');

describe('searchMicroservice/service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchProducts', () => {
    it('throws bad request when q is missing', async () => {
      await expect(searchService.searchProducts({})).rejects.toMatchObject({
        message: 'q is required',
        statusCode: 400,
      });
    });

    it('calls repository with normalized pagination and category ids', async () => {
      searchRepository.searchProducts.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });

      await searchService.searchProducts({
        q: 'oak',
        categoryIds: ['1', 'abc', '2'],
        page: '0',
        limit: '-1',
      });

      expect(searchRepository.searchProducts).toHaveBeenCalledWith(
        searchService.SEARCH_INDEX_NAME,
        {
          queryText: 'oak',
          categoryIds: [1, 2],
          page: 1,
          limit: 20,
        }
      );
    });
  });

  describe('suggestProducts', () => {
    it('throws bad request when q is missing', async () => {
      await expect(searchService.suggestProducts({})).rejects.toMatchObject({
        message: 'q is required',
        statusCode: 400,
      });
    });

    it('calls repository with normalized limit', async () => {
      searchRepository.suggestProducts.mockResolvedValue(['Oak Chair']);

      await searchService.suggestProducts({
        q: 'oa',
        limit: '0',
      });

      expect(searchRepository.suggestProducts).toHaveBeenCalledWith(
        searchService.SEARCH_INDEX_NAME,
        {
          queryText: 'oa',
          limit: 10,
        }
      );
    });
  });
});
