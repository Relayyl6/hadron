import { AppError, JsonWebTokenError, TokenExpiredError, DatabaseError, ConflictError } from "./index";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


const normalizeError = (err: Error): AppError => {

    // JWT Errors
    if (err instanceof jwt.TokenExpiredError) {
        return new TokenExpiredError(
            "Your authentication session has expired"
        );
    }

    if (err instanceof jwt.JsonWebTokenError) {
        return new JsonWebTokenError(
            "Invalid authentication token"
        );
    }


    // PostgreSQL / Database errors
    if (
        err.message.includes("duplicate key") ||
        err.message.includes("unique constraint")
    ) {
        return new ConflictError(
            "Resource already exists"
        );
    }


    // DNS Lookup / No Internet Error
    if (err.message.includes("ENOTFOUND")) {
        return new DatabaseError(
            "Network request failed. Please check your internet connection and try again."
        );
    }

    // Connection Timeout
    if (err.message.includes("ETIMEDOUT")) {
        return new DatabaseError(
            "Connection timed out. The server took too long to respond."
        );
    }

    // Connection Refused (Server Offline)
    if (err.message.includes("ECONNREFUSED")) {
        return new DatabaseError(
            "Connection refused. The database or cache server may be offline."
        );
    }

    // Database Unreachable
    if (err.message.includes("Can't reach database") || err.name === "PrismaClientInitializationError") {
        return new DatabaseError(
            "Database connection failed. We cannot reach the database server right now."
        );
    }

    // General Connection Errors
    if (err.message.includes("connection")) {
        return new DatabaseError(
            "An unexpected connection error occurred. Please try again later."
        );
    }

    // General Database Errors
    if (err.message.includes("database")) {
        return new DatabaseError(
            "A database operation failed. Please try again later."
        );
    }


    // CSRF errors
    if ((err as any).code === "EBADCSRFTOKEN" || err.message.toLowerCase().includes("csrf")) {
        return new AppError("Invalid CSRF token", 403, true);
    }

    // Unknown errors
    return new AppError(
        process.env.NODE_ENV === "development"
            ? err.message
            : "Something went wrong. Please try again later",
        500,
        false
    );
};



export const errorMiddleware = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {

    // If response has already started, let Express handle it
    if (res.headersSent) {
        return next(err);
    }


    const error =
        err instanceof AppError
            ? err
            : normalizeError(err);



    // Logging
    console.error({
        method: req.method,
        url: req.originalUrl,
        message: error.message,
        statusCode: error.statusCode,
        operational: error.isOperational,
        stack: error.stack,
    });



    return res.status(error.statusCode).json({

        status: "error",

        message: error.message,

        ...(error.details && {
            details: error.details
        }),

        ...(process.env.NODE_ENV === "development" && {
            stack: error.stack
        })

    });
};