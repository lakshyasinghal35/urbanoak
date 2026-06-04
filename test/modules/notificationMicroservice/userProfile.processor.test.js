const { USER_PROFILE_EVENTS } = require('../../../src/common/events/eventTypes');
const { processUserProfileEvent } = require('../../../src/modules/notificationMicroservice/processors/userProfile.processor');
const { handleUserSignedUp } = require('../../../src/modules/notificationMicroservice/handlers/userSignedUp.handler');
const { handlePasswordResetRequested } = require('../../../src/modules/notificationMicroservice/handlers/passwordResetRequested.handler');

jest.mock('../../../src/modules/notificationMicroservice/handlers/userSignedUp.handler', () => ({
  handleUserSignedUp: jest.fn(),
}));
jest.mock('../../../src/modules/notificationMicroservice/handlers/passwordResetRequested.handler', () => ({
  handlePasswordResetRequested: jest.fn(),
}));

describe('notificationMicroservice/userProfile.processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('routes signed_up events', async () => {
    const payload = { action: USER_PROFILE_EVENTS.SIGNED_UP, email: 'a@b.com' };
    await processUserProfileEvent(payload);
    expect(handleUserSignedUp).toHaveBeenCalledWith(payload);
  });

  it('routes password reset requested events', async () => {
    const payload = { action: USER_PROFILE_EVENTS.PASSWORD_RESET_REQUESTED, email: 'a@b.com' };
    await processUserProfileEvent(payload);
    expect(handlePasswordResetRequested).toHaveBeenCalledWith(payload);
  });

  it('warns on unknown actions', async () => {
    await processUserProfileEvent({ action: 'unknown.action' });
    expect(handleUserSignedUp).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });
});
