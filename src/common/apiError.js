class ApiError extends Error {
    constructor(message, statusCode = 400) {
      super(message);
      this.statusCode = statusCode;
      this.name = 'ApiError';
    }
  
    static notFound(message = 'Not found') {
      return new ApiError(message, 404);
    }
  
    static badRequest(message = 'Bad request') {
      return new ApiError(message, 400);
    }

    static unauthorized(message = 'Unauthorized') {
      return new ApiError(message, 401);
    }

    static forbidden(message = 'Forbidden') {
      return new ApiError(message, 403);
    }

    static conflict(message = 'Conflict') {
      return new ApiError(message, 409);
    }

    static internal(message = 'Internal server error') {
      return new ApiError(message, 500);
    }
  }
  
  module.exports = ApiError;