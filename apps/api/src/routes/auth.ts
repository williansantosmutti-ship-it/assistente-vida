import { Router } from "express";
import { z } from "zod";
import { authMiddleware, comparePassword, signToken, type AuthRequest } from "../auth.js";
import { prisma } from "../prisma.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post("/register", (_req, res) => {
  return res.status(403).json({ message: "Cadastro publico desativado. Entre como master para criar usuarios." });
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !(await comparePassword(input.password, user.passwordHash))) {
      return res.status(401).json({ message: "E-mail ou senha invalidos." });
    }

    const token = signToken({ userId: user.id, email: user.email });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        role: user.role,
        dailySummaryEnabled: user.dailySummaryEnabled,
        dailySummaryTime: user.dailySummaryTime,
        telegramChatId: user.telegramChatId
      }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        timezone: true,
        dailySummaryEnabled: true,
        dailySummaryTime: true,
        telegramChatId: true,
        createdAt: true
      }
    });
    return res.json({ user });
  } catch (error) {
    next(error);
  }
});
