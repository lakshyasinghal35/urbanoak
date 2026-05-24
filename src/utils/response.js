function sendSuccess(res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data });
  }
  
  function sendError(res, message, statusCode = 400) {
    res.status(statusCode).json({ success: false, message });
  }
  
  module.exports = { sendSuccess, sendError };