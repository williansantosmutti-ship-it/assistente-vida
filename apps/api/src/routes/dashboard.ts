import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../auth.js";
import { prisma } from "../prisma.js";
import { addDays, endOfDay, endOfMonth, startOfDay, startOfMonth } from "../utils/date.js";

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);

dashboardRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const nextWeek = addDays(now, 7);
    const weekAgo = startOfDay(addDays(now, -7));
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [todayTasks, missedTasks, upcomingTasks, expensesByCategory, monthExpenses, healthUpcoming, fitnessRecent, studiesPending] =
      await Promise.all([
        prisma.task.findMany({
          where: {
            userId: req.user!.userId,
            status: "PENDING",
            dueAt: { gte: todayStart, lte: todayEnd }
          },
          orderBy: { dueAt: "asc" }
        }),
        prisma.task.findMany({
          where: {
            userId: req.user!.userId,
            status: "PENDING",
            dueAt: { gte: weekAgo, lt: todayStart }
          },
          orderBy: { dueAt: "desc" },
          take: 8
        }),
        prisma.task.findMany({
          where: {
            userId: req.user!.userId,
            status: "PENDING",
            dueAt: { gt: todayEnd, lte: nextWeek }
          },
          orderBy: { dueAt: "asc" },
          take: 8
        }),
        prisma.expense.groupBy({
          by: ["category"],
          where: { userId: req.user!.userId, spentAt: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true }
        }),
        prisma.expense.aggregate({
          where: { userId: req.user!.userId, spentAt: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true }
        }),
        prisma.healthRecord.findMany({
          where: {
            userId: req.user!.userId,
            scheduledAt: { gte: now }
          },
          orderBy: { scheduledAt: "asc" },
          take: 5
        }),
        prisma.fitnessEntry.findMany({
          where: { userId: req.user!.userId },
          orderBy: { occurredAt: "desc" },
          take: 5
        }),
        prisma.studyEntry.findMany({
          where: { userId: req.user!.userId, status: "PLANNED" },
          orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
          take: 5
        })
      ]);

    return res.json({
      todayTasks,
      missedTasks,
      upcomingTasks,
      expenses: {
        total: monthExpenses._sum.amount ?? 0,
        byCategory: expensesByCategory
      },
      healthUpcoming,
      fitnessRecent,
      studiesPending
    });
  } catch (error) {
    next(error);
  }
});
