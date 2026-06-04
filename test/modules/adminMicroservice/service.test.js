const bcrypt = require('bcryptjs');
const adminRepository = require('../../../src/modules/adminMicroservice/repository');
const adminService = require('../../../src/modules/adminMicroservice/service');

jest.mock('bcryptjs');
jest.mock('../../../src/modules/adminMicroservice/repository');

describe('adminMicroservice/service changePassword', () => {
  const activeAdmin = { id: 1, email: 'admin@example.com', password: 'old-hash', is_active: true };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when fields are missing', async () => {
    await expect(adminService.changePassword(1, { oldPassword: 'x' }))
      .rejects.toThrow('oldPassword and newPassword are required');
  });

  it('rejects a too-short new password', async () => {
    await expect(adminService.changePassword(1, { oldPassword: 'current1', newPassword: 'short' }))
      .rejects.toThrow('at least 8');
  });

  it('rejects when the new password equals the old', async () => {
    await expect(adminService.changePassword(1, { oldPassword: 'samepass1', newPassword: 'samepass1' }))
      .rejects.toThrow('must be different');
  });

  it('rejects when the admin is missing or inactive', async () => {
    adminRepository.getAdminById.mockResolvedValue(null);
    await expect(adminService.changePassword(1, { oldPassword: 'current1', newPassword: 'newsecret1' }))
      .rejects.toThrow('not found or inactive');
  });

  it('rejects when the current password is incorrect', async () => {
    adminRepository.getAdminById.mockResolvedValue(activeAdmin);
    bcrypt.compare.mockResolvedValue(false);

    await expect(adminService.changePassword(1, { oldPassword: 'wrongpass', newPassword: 'newsecret1' }))
      .rejects.toThrow('Current password is incorrect');
    expect(adminRepository.updatePassword).not.toHaveBeenCalled();
  });

  it('updates the password when the current one is correct', async () => {
    adminRepository.getAdminById.mockResolvedValue(activeAdmin);
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue('new-hash');

    const result = await adminService.changePassword(1, { oldPassword: 'current1', newPassword: 'newsecret1' });

    expect(bcrypt.compare).toHaveBeenCalledWith('current1', 'old-hash');
    expect(adminRepository.updatePassword).toHaveBeenCalledWith(1, 'new-hash');
    expect(result.message).toMatch(/changed successfully/i);
  });
});
