import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import {
    AuthError,
    JsonWebTokenError,
    TokenExpiredError,
    DatabaseError,
    ForbiddenError,
} from "../error-handler/index";

interface AccessTokenPayload {
    id: string;
    role: "CUSTOMER" | "SELLER" | "ADMIN";
    iat?: number;
    exp?: number;
}

// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let token = req.cookies?.access_token;
        
        if (!token) {
            const authHeader = req.headers.authorization;

            if ( authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }

        if (!token) {
            throw new AuthError("Authentication required. Access token missing.");
        }

        let decoded: AccessTokenPayload;
        try {
            const payload = jwt.verify(
                token,
                process.env.ACCESS_TOKEN_SECRET as string
            );

            if (typeof payload === "string") throw new JsonWebTokenError("Invalid token payload");

            decoded = payload as AccessTokenPayload;
        } catch(error) {
            if (error instanceof jwt.TokenExpiredError) throw new TokenExpiredError("Access token expired");
            if (error instanceof jwt.JsonWebTokenError) throw new JsonWebTokenError("Invalid access token");
            throw error;
        }

        if (!decoded.id || !decoded.role) {
            throw new JsonWebTokenError("Malformed token payload");
        }

        let user;

        try {
            user = await prisma.users.findUnique({
                where:{id: decoded.id},
                select:{
                    id:true,
                    role:true
                }
            });
            
        } catch(error){
            throw new DatabaseError("Unable to verify user");
        }

        if(!user) throw new AuthError("User account no longer exists")

        if(user.role !== decoded.role) throw new ForbiddenError("Account permissions have changed. Please login again.");

        req.user = user

        next();
    } catch(error){
        next(error);
    }
};
