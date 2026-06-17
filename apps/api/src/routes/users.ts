import { Router } from "express";
import { z } from "zod";
import { authMiddleware, hashPassword, requireMaster, type AuthRequest } from "../auth.js";
import { prisma } from "../prisma.js";

export const usersRouter = Router();

usersRouter.use(authMiddleware, requireMaster);

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

usersRouter.get("/", async (_req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        telegramChatId: true
      },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }]
    });

    return res.json({ users });
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = createUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });

    if (existing) {
      return res.status(409).json({ message: "E-mail ja cadastrado." });
    }

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: "USER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});
