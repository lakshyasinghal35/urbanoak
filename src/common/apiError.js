class ApiError extends Error {
    constructor(message, statusCode = 400, details) {
      super(message);
      this.statusCode = statusCode;
      this.name = 'ApiError';
      this.details = details;
    }
  
    static notFound(message = 'Not found', details) {
      return new ApiError(message, 404, details);
    }
  
    static badRequest(message = 'Bad request', details) {
      return new ApiError(message, 400, details);
    }

    static unauthorized(message = 'Unauthorized', details) {
      return new ApiError(message, 401, details);
    }

    static forbidden(message = 'Forbidden', details) {
      return new ApiError(message, 403, details);
    }

    static conflict(message = 'Conflict', details) {
      return new ApiError(message, 409, details);
    }

    static internal(message = 'Internal server error', details) {
      return new ApiError(message, 500, details);
    }

    static serviceUnavailable(message = 'Service unavailable', details) {
      return new ApiError(message, 503, details);
    }
  }
  
  module.exports = ApiError;