// Define a more specific type for details instead of 'any'
type ErrorDetails = Record<string, unknown> | unknown[] | string;

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: ErrorDetails;

    constructor(
        message: string, 
        statusCode = 500, 
        isOperational = true, 
        details?: ErrorDetails
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = this.constructor.name;

        // ENHANCEMENT: Captures the stack trace but excludes the constructor call from it.
        // This makes debugging much cleaner by pointing to where the error was thrown,
        // not where the class was instantiated.
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, this.constructor);
        }
    }
}

// --- Common HTTP Errors ---

// 400 Bad Request (General client-side errors)
export class BadRequestError extends AppError {
    constructor(message = "Bad Request", details?: ErrorDetails) {
        super(message, 400, true, details);
    }
}

// 400 Validation Error (Specific to Joi, Zod, Sequelize validation, etc.)
export class ValidationError extends AppError {
    constructor(message = "Invalid request data", details?: ErrorDetails) {
        super(message, 400, true, details);
    }
}

// 401 Unauthorized (Missing or invalid authentication)
export class AuthError extends AppError {
    constructor(message = "Unauthorized access") {
        super(message, 401);
    }
}

// 403 Forbidden (Authenticated, but lacks specific permissions)
export class ForbiddenError extends AppError {
    constructor(message = "Forbidden: Insufficient permissions") {
        super(message, 403);
    }
}

// 404 Not Found
export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404);
    }
}

// 409 Conflict (Crucial for things like "Email already exists" in PostgreSQL)
export class ConflictError extends AppError {
    constructor(message = "Resource conflict detected", details?: ErrorDetails) {
        super(message, 409, true, details);
    }
}

// 429 Too Many Requests (Rate Limiting)
export class RateLimitError extends AppError {
    constructor(message = "Too many requests. Please try again later.") {
        super(message, 429);
    }
}

// 500 Internal Server Error (General server failures)
export class InternalServerError extends AppError {
    constructor(message = "Internal Server Error", details?: ErrorDetails) {
        super(message, 500, false, details); // isOperational = false
    }
}

// 500 Database Error
export class DatabaseError extends AppError {
    constructor(message = "Database operation failed", details?: ErrorDetails) {
        // Warning: Be careful passing raw DB 'details' to the client in production
        // to prevent leaking schema information.
        super(message, 500, false, details); 
    }
}

// 401 Invalid JWT (Malformed, invalid, or tampered token)
export class JsonWebTokenError extends AppError {
    constructor(message = "Invalid authentication token", details?: ErrorDetails) {
        super(message, 401, true, details);
    }
}

// 401 Expired JWT
export class TokenExpiredError extends AppError {
    constructor(message = "Authentication token has expired", details?: ErrorDetails) {
        super(message, 401, true, details);
    }
}