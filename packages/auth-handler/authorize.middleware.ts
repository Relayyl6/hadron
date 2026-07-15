import { Request, Response, NextFunction } from "express";
import { ForbiddenError, AuthError } from "../error-handler/index";

export const authorize = (...roles: Array<"CUSTOMER"|"SELLER"|"ADMIN">) => {
    return (
        req:Request,   
        res:Response,
        next:NextFunction
    )=>{
        if(!req.user) return next(new AuthError("Authentication required"));
        if(!roles.includes(req.user.role)) return next(new ForbiddenError("You do not have permission to access this resource"));
        next();
    };

};