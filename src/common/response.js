function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

function sendError(res, message, statusCode = 400, details) {
  const payload = { success: false, message };
  if (details !== undefined) {
    payload.details = details;
  }
  res.status(statusCode).json(payload);
}

module.exports = { sendSuccess, sendError };