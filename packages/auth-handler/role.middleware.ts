// packages/auth-handler/role.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AuthError } from "../error-handler";

export const isSeller = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user?.role !== "SELLER") {
    return next(new AuthError("Forbidden — sellers only."));
  }
  next();
};
