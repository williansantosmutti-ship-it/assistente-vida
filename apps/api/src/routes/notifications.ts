import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../auth.js";
import { prisma } from "../prisma.js";

export const notificationsRouter = Router();
notificationsRouter.use(authMiddleware);

notificationsRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const since = req.query.since ? new Date(String(req.query.since)) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user!.userId,
        channel: "WEB",
        sentAt: { gte: since }
      },
      orderBy: { sentAt: "desc" },
      take: 30
    });
    return res.json({ notifications });
  } catch (error) {
    next(error);
  }
});
