import { Router } from "express";
import { z } from "zod";
import { authMiddleware, type AuthRequest } from "../auth.js";
import { FitnessTypeValues } from "../domain.js";
import { prisma } from "../prisma.js";

export const fitnessRouter = Router();
fitnessRouter.use(authMiddleware);

const fitnessSchema = z.object({
  type: z.enum(FitnessTypeValues),
  title: z.string().min(2),
  value: z.coerce.number().optional(),
  unit: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
  goal: z.string().optional(),
  notes: z.string().optional()
});

fitnessRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const entries = await prisma.fitnessEntry.findMany({
      where: { userId: req.user!.userId },
      orderBy: { occurredAt: "desc" },
      take: 100
    });
    return res.json({ entries });
  } catch (error) {
    next(error);
  }
});

fitnessRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = fitnessSchema.parse(req.body);
    const entry = await prisma.fitnessEntry.create({
      data: {
        userId: req.user!.userId,
        ...input,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date()
      }
    });
    return res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
});

fitnessRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.fitnessEntry.delete({ where: { id: req.params.id, userId: req.user!.userId } });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});
