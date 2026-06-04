const bcrypt = require('bcryptjs');
const userRepository = require('../../../src/modules/profileMicroservice/repository');
const messageProducer = require('../../../src/common/events/messageProducer');
const secureToken = require('../../../src/common/secureToken');
const profileService = require('../../../src/modules/profileMicroservice/service');

jest.mock('bcryptjs');
jest.mock('../../../src/modules/profileMicroservice/repository');
jest.mock('../../../src/common/events/messageProducer', () => ({ pushMessage: jest.fn() }));
jest.mock('../../../src/common/secureToken');

describe('profileMicroservice/service password reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    secureToken.generateToken.mockReturnValue('raw-token');
    secureToken.hashToken.mockReturnValue('hashed-token');
    messageProducer.pushMessage.mockResolvedValue(true);
  });

  describe('requestPasswordReset', () => {
    it('throws when email is missing', async () => {
      await expect(profileService.requestPasswordReset()).rejects.toThrow('Email is required');
    });

    it('returns a generic message and does nothing when the user does not exist', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);

      const result = await profileService.requestPasswordReset('missing@example.com');

      expect(result.message).toMatch(/If an account exists/i);
      expect(userRepository.createPasswordResetToken).not.toHaveBeenCalled();
      expect(messageProducer.pushMessage).not.toHaveBeenCalled();
    });

    it('stores a hashed token and publishes reset event when user exists', async () => {
      userRepository.getUserByEmail.mockResolvedValue({
        id: 7,
        email: 'jane@example.com',
        firstname: 'Jane',
      });

      const result = await profileService.requestPasswordReset('jane@example.com');

      expect(userRepository.deleteUnusedPasswordResetTokens).toHaveBeenCalledWith(7);
      expect(userRepository.createPasswordResetToken).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 7, token_hash: 'hashed-token', expires_at: expect.any(Date) })
      );
      expect(messageProducer.pushMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 7,
          payload: expect.objectContaining({
            email: 'jane@example.com',
            action: 'user.password_reset_requested',
          }),
        })
      );
      // Never leaks whether the account existed.
      expect(result.message).toMatch(/If an account exists/i);
    });
  });

  describe('resetPassword', () => {
    it('throws when token or password is missing', async () => {
      await expect(profileService.resetPassword('', 'newsecret1')).rejects.toThrow('Token and new password are required');
      await expect(profileService.resetPassword('tok', '')).rejects.toThrow('Token and new password are required');
    });

    it('rejects a too-short password', async () => {
      await expect(profileService.resetPassword('tok', 'short')).rejects.toThrow('at least 8');
    });

    it('rejects an unknown token', async () => {
      userRepository.getPasswordResetTokenByHash.mockResolvedValue(null);
      await expect(profileService.resetPassword('tok', 'newsecret1')).rejects.toThrow('Invalid or expired');
    });

    it('rejects an already-used token', async () => {
      userRepository.getPasswordResetTokenByHash.mockResolvedValue({
        id: 1, user_id: 7, used_at: new Date(), expires_at: new Date(Date.now() + 100000),
      });
      await expect(profileService.resetPassword('tok', 'newsecret1')).rejects.toThrow('Invalid or expired');
      expect(userRepository.updateUserPassword).not.toHaveBeenCalled();
    });

    it('rejects an expired token', async () => {
      userRepository.getPasswordResetTokenByHash.mockResolvedValue({
        id: 1, user_id: 7, used_at: null, expires_at: new Date(Date.now() - 1000),
      });
      await expect(profileService.resetPassword('tok', 'newsecret1')).rejects.toThrow('Invalid or expired');
    });

    it('updates the password and consumes the token when valid', async () => {
      userRepository.getPasswordResetTokenByHash.mockResolvedValue({
        id: 9, user_id: 7, used_at: null, expires_at: new Date(Date.now() + 100000),
      });
      bcrypt.hash.mockResolvedValue('new-hash');

      const result = await profileService.resetPassword('tok', 'newsecret1');

      expect(secureToken.hashToken).toHaveBeenCalledWith('tok');
      expect(bcrypt.hash).toHaveBeenCalledWith('newsecret1', 10);
      expect(userRepository.updateUserPassword).toHaveBeenCalledWith(7, 'new-hash');
      expect(userRepository.markPasswordResetTokenUsed).toHaveBeenCalledWith(9);
      expect(userRepository.deleteUnusedPasswordResetTokens).toHaveBeenCalledWith(7);
      expect(result.message).toMatch(/reset/i);
    });
  });
});
