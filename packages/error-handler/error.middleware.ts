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


    if (
        err.message.includes("database") ||
        err.message.includes("connection")
    ) {
        return new DatabaseError(
            "Database operation failed"
        );
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