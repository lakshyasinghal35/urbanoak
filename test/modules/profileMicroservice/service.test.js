const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../../../src/modules/profileMicroservice/repository');
const profileService = require('../../../src/modules/profileMicroservice/service');

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../src/modules/profileMicroservice/repository');

describe('profileMicroservice/service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveUser', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'secret123',
      firstname: 'Jane',
      lastname: 'Doe',
    };

    it('throws when required fields are missing', async () => {
      await expect(profileService.saveUser({ email: 'a@b.com' })).rejects.toThrow(
        'Missing required fields: email, password, firstname, lastname'
      );
      expect(userRepository.getUserByEmail).not.toHaveBeenCalled();
    });

    it('throws when email already exists', async () => {
      userRepository.getUserByEmail.mockResolvedValue({ id: 1, email: validUser.email });

      await expect(profileService.saveUser(validUser)).rejects.toThrow(
        'A user with this email already exists'
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('hashes password, creates user, and returns sanitized user', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed-password');
      const created = {
        id: 1,
        email: validUser.email,
        password: 'hashed-password',
        firstname: validUser.firstname,
        lastname: validUser.lastname,
      };
      userRepository.createUser.mockResolvedValue(created);

      const result = await profileService.saveUser(validUser);

      expect(bcrypt.hash).toHaveBeenCalledWith(validUser.password, 10);
      expect(userRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validUser.email,
          password: 'hashed-password',
          sign_up_date: expect.any(Date),
        })
      );
      expect(result).toEqual({
        email: validUser.email,
        firstname: validUser.firstname,
        lastname: validUser.lastname,
      });
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('fetchUser', () => {
    it('throws when neither id nor email is provided', async () => {
      await expect(profileService.fetchUser()).rejects.toThrow('User ID or email is required');
    });

    it('fetches user by id and sanitizes result', async () => {
      userRepository.getUserById.mockResolvedValue({
        id: 2,
        email: 'u@example.com',
        password: 'hash',
        firstname: 'A',
      });

      const result = await profileService.fetchUser(2);

      expect(userRepository.getUserById).toHaveBeenCalledWith(2);
      expect(userRepository.getUserByEmail).not.toHaveBeenCalled();
      expect(result).toEqual({ email: 'u@example.com', firstname: 'A' });
    });

    it('fetches user by email when id is not provided', async () => {
      userRepository.getUserByEmail.mockResolvedValue({
        id: 3,
        email: 'find@example.com',
        password: 'hash',
      });

      const result = await profileService.fetchUser(null, 'find@example.com');

      expect(userRepository.getUserByEmail).toHaveBeenCalledWith('find@example.com');
      expect(result).toEqual({ email: 'find@example.com' });
    });

    it('returns null when user is not found', async () => {
      userRepository.getUserById.mockResolvedValue(null);

      const result = await profileService.fetchUser(99);

      expect(result).toBeNull();
    });
  });

  describe('fetchAllUsers', () => {
    it('returns sanitized users', async () => {
      userRepository.getAllUsers.mockResolvedValue([
        { id: 1, email: 'a@b.com', password: 'x', firstname: 'A' },
        { id: 2, email: 'c@d.com', password: 'y', lastname: 'B' },
      ]);

      const result = await profileService.fetchAllUsers();

      expect(result).toEqual([
        { email: 'a@b.com', firstname: 'A' },
        { email: 'c@d.com', lastname: 'B' },
      ]);
    });
  });

  describe('loginUser', () => {
    it('throws when email or password is missing', async () => {
      await expect(profileService.loginUser({ email: 'a@b.com' })).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('throws when user does not exist', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);

      await expect(
        profileService.loginUser({ email: 'missing@example.com', password: 'pass' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws when password does not match', async () => {
      userRepository.getUserByEmail.mockResolvedValue({
        id: 1,
        email: 'u@example.com',
        password: 'stored-hash',
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        profileService.loginUser({ email: 'u@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('returns token and sanitized user on success', async () => {
      const user = { id: 5, email: 'ok@example.com', password: 'stored-hash', firstname: 'Ok' };
      userRepository.getUserByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('signed-jwt');

      const result = await profileService.loginUser({
        email: user.email,
        password: 'correct',
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: user.id, email: user.email },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(result).toEqual({
        token: 'signed-jwt',
        user: { email: user.email, firstname: 'Ok' },
      });
    });
  });

  describe('logoutUser', () => {
    it('throws when token is missing', () => {
      expect(() => profileService.logoutUser()).toThrow('Token is required for logout');
    });

    it('blacklists token and returns true', () => {
      const token = `logout-token-${Date.now()}`;
      expect(profileService.isTokenBlacklisted(token)).toBe(false);

      const result = profileService.logoutUser(token);

      expect(result).toBe(true);
      expect(profileService.isTokenBlacklisted(token)).toBe(true);
    });
  });

  describe('isTokenBlacklisted', () => {
    it('returns false for unknown token', () => {
      expect(profileService.isTokenBlacklisted('never-logged-out')).toBe(false);
    });
  });

  describe('saveAddress', () => {
    const validAddress = {
      mobile: '9999999999',
      house_no: '12',
      area: 'Main St',
      city: 'City',
      state: 'State',
      country: 'Country',
      pincode: '110001',
      user_id: 1,
    };

    it('throws when required address fields are missing', async () => {
      await expect(profileService.saveAddress({ mobile: '1' })).rejects.toThrow(
        'Missing required fields: mobile, house_no, area, landmark, city, state, country, pincode'
      );
    });

    it('creates address and returns sanitized address', async () => {
      const created = { id: 10, user_id: 1, ...validAddress };
      userRepository.createAddress.mockResolvedValue(created);

      const result = await profileService.saveAddress(validAddress);

      expect(userRepository.createAddress).toHaveBeenCalledWith(validAddress);
      expect(result).toEqual({
        mobile: validAddress.mobile,
        house_no: validAddress.house_no,
        area: validAddress.area,
        city: validAddress.city,
        state: validAddress.state,
        country: validAddress.country,
        pincode: validAddress.pincode,
      });
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('user_id');
    });
  });

  describe('fetchAddressesByUserId', () => {
    it('returns sanitized addresses for user', async () => {
      userRepository.getAddressesByUserId.mockResolvedValue([
        { id: 1, user_id: 7, city: 'A', pincode: '1' },
        { id: 2, user_id: 7, city: 'B', pincode: '2' },
      ]);

      const result = await profileService.fetchAddressesByUserId(7);

      expect(userRepository.getAddressesByUserId).toHaveBeenCalledWith(7);
      expect(result).toEqual([
        { city: 'A', pincode: '1' },
        { city: 'B', pincode: '2' },
      ]);
    });
  });
});
