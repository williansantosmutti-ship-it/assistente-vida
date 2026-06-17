import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "./env.js";
import { prisma } from "./prisma.js";

export type AuthUser = {
  userId: string;
  email: string;
};

export type AuthRequest = Request & {
  user?: AuthUser;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthUser) {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: "30d" });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ message: "Token ausente." });
  }

  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    next();
  } catch {
    return res.status(401).json({ message: "Token invalido ou expirado." });
  }
}

export async function requireMaster(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Token ausente." });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true }
    });

    if (user?.role !== "MASTER") {
      return res.status(403).json({ message: "Apenas o usuario master pode executar esta acao." });
    }

    next();
  } catch (error) {
    next(error);
  }
}
