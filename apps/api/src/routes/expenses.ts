import { Router } from "express";
import { z } from "zod";
import { authMiddleware, type AuthRequest } from "../auth.js";
import { ExpenseCategory, ExpenseCategoryValues } from "../domain.js";
import { prisma } from "../prisma.js";
import { parseMonthParam } from "../utils/date.js";

export const expensesRouter = Router();
expensesRouter.use(authMiddleware);

const expenseSchema = z.object({
  amount: z.coerce.number().positive(),
  description: z.string().min(2),
  category: z.enum(ExpenseCategoryValues).default(ExpenseCategory.OUTROS),
  spentAt: z.string().datetime().optional()
});

expensesRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const { from, to } = parseMonthParam(req.query.month ? String(req.query.month) : undefined);
    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.user!.userId,
        spentAt: { gte: from, lte: to }
      },
      orderBy: { spentAt: "desc" }
    });

    const summary = await prisma.expense.groupBy({
      by: ["category"],
      where: { userId: req.user!.userId, spentAt: { gte: from, lte: to } },
      _sum: { amount: true }
    });

    return res.json({ expenses, summary });
  } catch (error) {
    next(error);
  }
});

expensesRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = expenseSchema.parse(req.body);
    const expense = await prisma.expense.create({
      data: {
        userId: req.user!.userId,
        amount: input.amount,
        description: input.description,
        category: input.category,
        spentAt: input.spentAt ? new Date(input.spentAt) : new Date()
      }
    });
    return res.status(201).json({ expense });
  } catch (error) {
    next(error);
  }
});
