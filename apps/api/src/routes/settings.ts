import { Router } from "express";
import { z } from "zod";
import { authMiddleware, type AuthRequest } from "../auth.js";
import { prisma } from "../prisma.js";

export const settingsRouter = Router();
settingsRouter.use(authMiddleware);

const settingsSchema = z.object({
  timezone: z.string().min(3).max(80).optional(),
  dailySummaryEnabled: z.boolean().optional(),
  dailySummaryTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional()
});

settingsRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const settings = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        timezone: true,
        dailySummaryEnabled: true,
        dailySummaryTime: true,
        telegramChatId: true
      }
    });

    return res.json({ settings });
  } catch (error) {
    next(error);
  }
});

settingsRouter.patch("/", async (req: AuthRequest, res, next) => {
  try {
    const input = settingsSchema.parse(req.body);
    const settings = await prisma.user.update({
      where: { id: req.user!.userId },
      data: input,
      select: {
        timezone: true,
        dailySummaryEnabled: true,
        dailySummaryTime: true,
        telegramChatId: true
      }
    });

    return res.json({ settings });
  } catch (error) {
    next(error);
  }
});
