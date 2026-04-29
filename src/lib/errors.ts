export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class TokenError extends AppError {
  constructor(message: string = 'Failed to fetch or refresh token') {
    super(message, 500, 'TOKEN_ERROR');
  }
}

export class WebhookError extends AppError {
  constructor(message: string = 'Webhook verification failed') {
    super(message, 401, 'WEBHOOK_VERIFICATION_FAILED');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}
