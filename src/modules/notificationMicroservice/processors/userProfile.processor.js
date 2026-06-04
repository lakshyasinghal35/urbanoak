const { USER_PROFILE_EVENTS } = require('../../../common/events/eventTypes');
const { handleUserSignedUp } = require('../handlers/userSignedUp.handler');
const { handlePasswordResetRequested } = require('../handlers/passwordResetRequested.handler');

const ACTION_HANDLERS = {
  [USER_PROFILE_EVENTS.SIGNED_UP]: handleUserSignedUp,
  [USER_PROFILE_EVENTS.PASSWORD_RESET_REQUESTED]: handlePasswordResetRequested,
};

async function processUserProfileEvent(payload) {
  const handler = ACTION_HANDLERS[payload?.action];
  if (!handler) {
    console.warn('[notification-profile] unhandled action', { action: payload?.action });
    return;
  }

  await handler(payload);
}

module.exports = {
  processUserProfileEvent,
};
