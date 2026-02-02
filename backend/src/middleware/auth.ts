import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthPayload } from "../types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid token",
    });
  }
};

export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as AuthPayload;
      req.user = decoded;
    }
  } catch (error) {
    // Silent fail for optional auth
  }
  next();
};

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Admin role required",
    });
  }
  next();
};

export const professionalMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || (req.user.role !== "PROFESSIONAL" && req.user.role !== "ADMIN")) {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Professional role required",
    });
  }
  next();
};
