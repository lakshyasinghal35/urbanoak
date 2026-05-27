const repository = require('../../../src/modules/productMicroservice/repository');
const ApiError = require('../../../src/utils/apiError');
const productService = require('../../../src/modules/productMicroservice/service');

jest.mock('../../../src/modules/productMicroservice/repository');

describe('productMicroservice/service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveCategory', () => {
    it('throws bad request when name is missing', async () => {
      await expect(productService.saveCategory({})).rejects.toMatchObject({
        message: 'Category name is required',
        statusCode: 400,
      });
    });

    it('creates category when id is absent', async () => {
      const category = { name: 'Chairs' };
      repository.createCategory.mockResolvedValue({ id: 1, ...category });

      const result = await productService.saveCategory(category);

      expect(repository.createCategory).toHaveBeenCalledWith(category);
      expect(repository.saveCategory).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 1, name: 'Chairs' });
    });

    it('updates category when id is present', async () => {
      const category = { id: 1, name: 'Tables' };
      repository.saveCategory.mockResolvedValue(category);

      const result = await productService.saveCategory(category);

      expect(repository.saveCategory).toHaveBeenCalledWith(category);
      expect(repository.createCategory).not.toHaveBeenCalled();
      expect(result).toBe(category);
    });
  });

  describe('fetchCategory', () => {
    it('throws when id and name are missing', async () => {
      await expect(productService.fetchCategory()).rejects.toMatchObject({
        message: 'Category id or name is required',
        statusCode: 400,
      });
    });

    it('fetches by id', async () => {
      repository.getCategoryById.mockResolvedValue({ id: 1, name: 'Sofas' });

      const result = await productService.fetchCategory(1);

      expect(repository.getCategoryById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, name: 'Sofas' });
    });

    it('fetches by name', async () => {
      repository.getCategoryByName.mockResolvedValue({ id: 2, name: 'Beds' });

      const result = await productService.fetchCategory(null, 'Beds');

      expect(repository.getCategoryByName).toHaveBeenCalledWith('Beds');
      expect(result.name).toBe('Beds');
    });
  });

  describe('fetchAllCategories', () => {
    it('delegates to repository', async () => {
      const categories = [{ id: 1 }, { id: 2 }];
      repository.getAllCategories.mockResolvedValue(categories);

      const result = await productService.fetchAllCategories();

      expect(repository.getAllCategories).toHaveBeenCalled();
      expect(result).toBe(categories);
    });
  });

  describe('removeCategory', () => {
    it('throws when id is missing', async () => {
      await expect(productService.removeCategory()).rejects.toMatchObject({
        message: 'Category id is required',
        statusCode: 400,
      });
    });

    it('throws not found when delete returns false', async () => {
      repository.deleteCategory.mockResolvedValue(false);

      await expect(productService.removeCategory(1)).rejects.toMatchObject({
        message: 'Category not found',
        statusCode: 404,
      });
    });

    it('returns true when category is deleted', async () => {
      repository.deleteCategory.mockResolvedValue(true);

      const result = await productService.removeCategory(1);

      expect(repository.deleteCategory).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe('saveSpace', () => {
    it('throws when name is missing', async () => {
      await expect(productService.saveSpace({})).rejects.toBeInstanceOf(ApiError);
    });

    it('creates space without id', async () => {
      const space = { name: 'Living Room' };
      repository.createSpace.mockResolvedValue({ id: 1, ...space });

      await productService.saveSpace(space);

      expect(repository.createSpace).toHaveBeenCalledWith(space);
    });

    it('updates space with id', async () => {
      const space = { id: 2, name: 'Bedroom' };
      repository.saveSpace.mockResolvedValue(space);

      await productService.saveSpace(space);

      expect(repository.saveSpace).toHaveBeenCalledWith(space);
    });
  });

  describe('fetchSpace', () => {
    it('throws when id and name are missing', async () => {
      await expect(productService.fetchSpace()).rejects.toMatchObject({
        message: 'Space id or name is required',
        statusCode: 400,
      });
    });

    it('fetches by id', async () => {
      repository.getSpaceById.mockResolvedValue({ id: 1 });

      await productService.fetchSpace(1);

      expect(repository.getSpaceById).toHaveBeenCalledWith(1);
    });

    it('fetches by name', async () => {
      repository.getSpaceByName.mockResolvedValue({ id: 2, name: 'Office' });

      await productService.fetchSpace(null, 'Office');

      expect(repository.getSpaceByName).toHaveBeenCalledWith('Office');
    });
  });

  describe('fetchAllSpaces', () => {
    it('delegates to repository', async () => {
      repository.getAllSpaces.mockResolvedValue([]);

      await productService.fetchAllSpaces();

      expect(repository.getAllSpaces).toHaveBeenCalled();
    });
  });

  describe('removeSpace', () => {
    it('throws when id is missing', async () => {
      await expect(productService.removeSpace()).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('throws not found when delete fails', async () => {
      repository.deleteSpace.mockResolvedValue(false);

      await expect(productService.removeSpace(5)).rejects.toMatchObject({
        message: 'Space not found',
        statusCode: 404,
      });
    });

    it('returns true on successful delete', async () => {
      repository.deleteSpace.mockResolvedValue(true);

      expect(await productService.removeSpace(5)).toBe(true);
    });
  });

  describe('saveSection', () => {
    it('throws when space_id or category_id is missing', async () => {
      await expect(productService.saveSection({ space_id: 1 })).rejects.toMatchObject({
        message: 'Section space_id and category_id are required',
        statusCode: 400,
      });
    });

    it('creates section without id', async () => {
      const section = { space_id: 1, category_id: 2 };
      repository.createSection.mockResolvedValue({ id: 1, ...section });

      await productService.saveSection(section);

      expect(repository.createSection).toHaveBeenCalledWith(section);
    });

    it('updates section with id', async () => {
      const section = { id: 3, space_id: 1, category_id: 2 };
      repository.saveSection.mockResolvedValue(section);

      await productService.saveSection(section);

      expect(repository.saveSection).toHaveBeenCalledWith(section);
    });
  });

  describe('fetchSection', () => {
    it('throws when id and space_id are missing', async () => {
      await expect(productService.fetchSection()).rejects.toMatchObject({
        message: 'Section id or space_id is required',
        statusCode: 400,
      });
    });

    it('fetches by id', async () => {
      repository.getSectionById.mockResolvedValue({ id: 1 });

      await productService.fetchSection(1);

      expect(repository.getSectionById).toHaveBeenCalledWith(1);
    });

    it('fetches by space_id', async () => {
      repository.getSectionsBySpaceId.mockResolvedValue([{ id: 1 }]);

      await productService.fetchSection(null, 10);

      expect(repository.getSectionsBySpaceId).toHaveBeenCalledWith(10);
    });
  });

  describe('fetchAllSections', () => {
    it('delegates to repository', async () => {
      repository.getAllSections.mockResolvedValue([]);

      await productService.fetchAllSections();

      expect(repository.getAllSections).toHaveBeenCalled();
    });
  });

  describe('removeSection', () => {
    it('throws when id is missing', async () => {
      await expect(productService.removeSection()).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws not found when delete fails', async () => {
      repository.deleteSection.mockResolvedValue(false);

      await expect(productService.removeSection(1)).rejects.toMatchObject({
        message: 'Section not found',
        statusCode: 404,
      });
    });

    it('returns true on successful delete', async () => {
      repository.deleteSection.mockResolvedValue(true);

      expect(await productService.removeSection(1)).toBe(true);
    });
  });

  describe('saveProduct', () => {
    const validProduct = {
      title: 'Oak Table',
      category_id: 1,
      category: 'Tables',
      wood_type: 'Oak',
      mrp: 1000,
      details: 'Solid wood',
      units: 5,
    };

    it('throws when required fields are missing', async () => {
      await expect(productService.saveProduct({ title: 'Only title' })).rejects.toMatchObject({
        message: expect.stringContaining('Missing required product fields'),
        statusCode: 400,
      });
    });

    it('creates product without id', async () => {
      repository.createProduct.mockResolvedValue({ id: 1, ...validProduct });

      await productService.saveProduct(validProduct);

      expect(repository.createProduct).toHaveBeenCalledWith(validProduct);
    });

    it('updates product with id', async () => {
      const product = { id: 9, ...validProduct };
      repository.saveProduct.mockResolvedValue(product);

      await productService.saveProduct(product);

      expect(repository.saveProduct).toHaveBeenCalledWith(product);
    });
  });

  describe('fetchProducts', () => {
    it('throws when no id, categoryIds, or pagination params', async () => {
      await expect(productService.fetchProducts()).rejects.toMatchObject({ statusCode: 400 });

      expect(repository.getProducts).not.toHaveBeenCalled();
      expect(repository.getProductById).not.toHaveBeenCalled();
      expect(repository.getProductsByCategoryIds).not.toHaveBeenCalled();
    });

    it('fetches by id when id is provided', async () => {
      repository.getProductById.mockResolvedValue({ id: '507f1f77bcf86cd799439011' });

      await productService.fetchProducts({ id: '507f1f77bcf86cd799439011' });

      expect(repository.getProductById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(repository.getProducts).not.toHaveBeenCalled();
      expect(repository.getProductsByCategoryIds).not.toHaveBeenCalled();
    });

    it('paginates when page and limit are provided', async () => {
      repository.getProducts.mockResolvedValue({ rows: [], total: 0 });

      await productService.fetchProducts({ page: 2, limit: 10 });

      expect(repository.getProducts).toHaveBeenCalledWith({ offset: 10, limit: 10 });
    });

    it('uses default page and limit when invalid numbers are passed', async () => {
      repository.getProducts.mockResolvedValue([]);

      await productService.fetchProducts({ page: -1, limit: 0 });

      expect(repository.getProducts).toHaveBeenCalledWith({ offset: 0, limit: 20 });
    });
  });

  describe('removeProduct', () => {
    it('throws when id is missing', async () => {
      await expect(productService.removeProduct()).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws not found when delete fails', async () => {
      repository.deleteProduct.mockResolvedValue(false);

      await expect(productService.removeProduct(1)).rejects.toMatchObject({
        message: 'Product not found',
        statusCode: 404,
      });
    });

    it('returns true on successful delete', async () => {
      repository.deleteProduct.mockResolvedValue(true);

      expect(await productService.removeProduct(1)).toBe(true);
    });
  });
});
