import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "flowbuilder-default-secret-key";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: "USER" | "ADMIN";
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: "USER" | "ADMIN" };
    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.userRole = payload.role;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== "ADMIN") {
    res.status(403).json({ error: "Administrator privileges required" });
    return;
  }
  next();
}

export function generateToken(payload: { userId: string; email: string; role: "USER" | "ADMIN" }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}
