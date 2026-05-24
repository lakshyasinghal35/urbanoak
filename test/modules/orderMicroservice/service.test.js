const repository = require('../../../src/modules/orderMicroservice/repository');
const orderService = require('../../../src/modules/orderMicroservice/service');

jest.mock('../../../src/modules/orderMicroservice/repository');

describe('orderMicroservice/service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validOrder = {
    user_id: 1,
    items: [{ product_id: 10, quantity: 2 }],
    delivery_details: { city: 'X' },
    billing_details: { city: 'X' },
    total_amount: 500,
  };

  describe('saveOrder', () => {
    it('throws when required order fields are missing', async () => {
      await expect(orderService.saveOrder({ user_id: 1 })).rejects.toMatchObject({
        message: expect.stringContaining('Missing required order fields'),
        statusCode: 400,
      });
    });

    it('creates order when id is absent', async () => {
      repository.createOrder.mockResolvedValue({ id: 1, ...validOrder });

      const result = await orderService.saveOrder(validOrder);

      expect(repository.createOrder).toHaveBeenCalledWith(validOrder);
      expect(repository.saveOrder).not.toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('updates order when id is present', async () => {
      const order = { id: 5, ...validOrder };
      repository.saveOrder.mockResolvedValue(order);

      const result = await orderService.saveOrder(order);

      expect(repository.saveOrder).toHaveBeenCalledWith(order);
      expect(result).toBe(order);
    });
  });

  describe('fetchOrder', () => {
    it('throws when id and user_id are missing', async () => {
      await expect(orderService.fetchOrder()).rejects.toMatchObject({
        message: 'Order id or user_id is required',
        statusCode: 400,
      });
    });

    it('fetches order by id', async () => {
      repository.getOrderById.mockResolvedValue({ id: 1 });

      const result = await orderService.fetchOrder(1);

      expect(repository.getOrderById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });

    it('fetches orders by user_id', async () => {
      repository.getOrdersByUserId.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await orderService.fetchOrder(null, 7);

      expect(repository.getOrdersByUserId).toHaveBeenCalledWith(7);
      expect(result).toHaveLength(2);
    });
  });

  describe('removeOrder', () => {
    it('throws when id is missing', async () => {
      await expect(orderService.removeOrder()).rejects.toMatchObject({
        message: 'Order id is required',
        statusCode: 400,
      });
    });

    it('throws not found when delete fails', async () => {
      repository.deleteOrder.mockResolvedValue(false);

      await expect(orderService.removeOrder(1)).rejects.toMatchObject({
        message: 'Order not found',
        statusCode: 404,
      });
    });

    it('returns true on successful delete', async () => {
      repository.deleteOrder.mockResolvedValue(true);

      expect(await orderService.removeOrder(1)).toBe(true);
    });
  });

  describe('saveCart', () => {
    it('throws when user_id is missing', async () => {
      await expect(orderService.saveCart({})).rejects.toMatchObject({
        message: 'Cart user_id is required',
        statusCode: 400,
      });
    });

    it('throws when cart id is provided (update not supported)', async () => {
      await expect(orderService.saveCart({ id: 1, user_id: 2 })).rejects.toMatchObject({
        message: 'Cart update is not supported',
        statusCode: 400,
      });
    });

    it('throws conflict when cart already exists for user', async () => {
      repository.getCartByUserId.mockResolvedValue({ id: 10, user_id: 1 });

      await expect(orderService.saveCart({ user_id: 1 })).rejects.toMatchObject({
        message: 'Cart already exists for this user',
        statusCode: 409,
      });
    });

    it('creates cart when none exists', async () => {
      repository.getCartByUserId.mockResolvedValue(null);
      repository.createCart.mockResolvedValue({ id: 3, user_id: 1 });

      const result = await orderService.saveCart({ user_id: 1 });

      expect(repository.createCart).toHaveBeenCalledWith({ user_id: 1 });
      expect(result).toEqual({ id: 3, user_id: 1 });
    });
  });

  describe('fetchCart', () => {
    it('throws when id and user_id are missing', async () => {
      await expect(orderService.fetchCart()).rejects.toMatchObject({
        message: 'Cart id or user_id is required',
        statusCode: 400,
      });
    });

    it('returns null when cart is not found', async () => {
      repository.getCartByUserId.mockResolvedValue(null);

      const result = await orderService.fetchCart(null, 99);

      expect(result).toBeNull();
    });

    it('returns cart with items by user_id', async () => {
      repository.getCartByUserId.mockResolvedValue({ id: 5, user_id: 1 });
      repository.getCartItemsByCartId.mockResolvedValue([{ id: 1, product_id: 2 }]);

      const result = await orderService.fetchCart(null, 1);

      expect(repository.getCartItemsByCartId).toHaveBeenCalledWith(5);
      expect(result).toEqual({
        id: 5,
        user_id: 1,
        items: [{ id: 1, product_id: 2 }],
      });
    });

    it('returns cart with empty items array when items are null', async () => {
      repository.getCartById.mockResolvedValue({ id: 6, user_id: 2 });
      repository.getCartItemsByCartId.mockResolvedValue(null);

      const result = await orderService.fetchCart(6);

      expect(result.items).toEqual([]);
    });
  });

  describe('removeCart', () => {
    it('throws when id is missing', async () => {
      await expect(orderService.removeCart()).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws not found when delete fails', async () => {
      repository.deleteCart.mockResolvedValue(false);

      await expect(orderService.removeCart(1)).rejects.toMatchObject({
        message: 'Cart not found',
        statusCode: 404,
      });
    });

    it('returns true on successful delete', async () => {
      repository.deleteCart.mockResolvedValue(true);

      expect(await orderService.removeCart(1)).toBe(true);
    });
  });

  describe('saveCartItem', () => {
    const validCartItem = {
      user_id: 1,
      product_id: 10,
      quantity: 2,
    };

    it('throws when required fields are missing', async () => {
      await expect(orderService.saveCartItem({ user_id: 1 })).rejects.toMatchObject({
        message: expect.stringContaining('Missing required cart item fields'),
        statusCode: 400,
      });
    });

    it('creates cart when cart_id is missing and user has no cart', async () => {
      const cartItem = { ...validCartItem };
      repository.getCartByUserId.mockResolvedValue(null);
      repository.createCart.mockResolvedValue({ id: 20, user_id: 1 });
      repository.createCartItem.mockResolvedValue({ id: 1, cart_id: 20, ...cartItem });

      await orderService.saveCartItem(cartItem);

      expect(repository.createCart).toHaveBeenCalledWith({ user_id: 1 });
      expect(repository.createCartItem).toHaveBeenCalledWith(
        expect.objectContaining({ cart_id: 20, user_id: 1, product_id: 10, quantity: 2 })
      );
    });

    it('uses existing cart when cart_id is missing', async () => {
      const cartItem = { ...validCartItem };
      repository.getCartByUserId.mockResolvedValue({ id: 15, user_id: 1 });
      repository.createCartItem.mockResolvedValue({ id: 2 });

      await orderService.saveCartItem(cartItem);

      expect(repository.createCart).not.toHaveBeenCalled();
      expect(repository.createCartItem).toHaveBeenCalledWith(
        expect.objectContaining({ cart_id: 15 })
      );
    });

    it('updates cart item when id is present', async () => {
      const cartItem = { id: 3, cart_id: 5, ...validCartItem };
      repository.saveCartItem.mockResolvedValue(cartItem);

      await orderService.saveCartItem(cartItem);

      expect(repository.saveCartItem).toHaveBeenCalledWith(cartItem);
      expect(repository.createCartItem).not.toHaveBeenCalled();
    });

    it('creates cart item when id is absent and cart_id is set', async () => {
      const cartItem = { ...validCartItem, cart_id: 5 };
      repository.createCartItem.mockResolvedValue({ id: 4, ...cartItem });

      await orderService.saveCartItem(cartItem);

      expect(repository.createCartItem).toHaveBeenCalledWith(cartItem);
    });
  });

  describe('fetchCartItem', () => {
    it('throws when id, user_id, and cart_id are missing', async () => {
      await expect(orderService.fetchCartItem()).rejects.toMatchObject({
        message: 'Cart item id, user_id, or cart_id is required',
        statusCode: 400,
      });
    });

    it('fetches by id', async () => {
      repository.getCartItemById.mockResolvedValue({ id: 1 });

      const result = await orderService.fetchCartItem(1);

      expect(repository.getCartItemById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });

    it('fetches by user_id', async () => {
      repository.getCartItemsByUserId.mockResolvedValue([{ id: 1 }]);

      await orderService.fetchCartItem(null, 7);

      expect(repository.getCartItemsByUserId).toHaveBeenCalledWith(7);
    });

    it('fetches by cart_id', async () => {
      repository.getCartItemsByCartId.mockResolvedValue([{ id: 2 }]);

      await orderService.fetchCartItem(null, null, 10);

      expect(repository.getCartItemsByCartId).toHaveBeenCalledWith(10);
    });
  });

  describe('removeCartItem', () => {
    it('throws when id is missing', async () => {
      await expect(orderService.removeCartItem()).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws not found when delete fails', async () => {
      repository.deleteCartItem.mockResolvedValue(false);

      await expect(orderService.removeCartItem(1)).rejects.toMatchObject({
        message: 'Cart item not found',
        statusCode: 404,
      });
    });

    it('returns true on successful delete', async () => {
      repository.deleteCartItem.mockResolvedValue(true);

      expect(await orderService.removeCartItem(1)).toBe(true);
    });
  });
});
