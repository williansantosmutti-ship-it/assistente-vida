import { Router } from "express";
import { z } from "zod";
import { authMiddleware, type AuthRequest } from "../auth.js";
import { StudyStatus, StudyStatusValues } from "../domain.js";
import { prisma } from "../prisma.js";

export const studiesRouter = Router();
studiesRouter.use(authMiddleware);

const studySchema = z.object({
  subject: z.string().min(2),
  title: z.string().min(2),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.coerce.number().int().positive().optional(),
  weeklyGoal: z.string().optional(),
  status: z.enum(StudyStatusValues).default(StudyStatus.PLANNED),
  notes: z.string().optional()
});

studiesRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const entries = await prisma.studyEntry.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      take: 100
    });
    return res.json({ entries });
  } catch (error) {
    next(error);
  }
});

studiesRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = studySchema.parse(req.body);
    const entry = await prisma.studyEntry.create({
      data: {
        userId: req.user!.userId,
        ...input,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
        completedAt: input.status === StudyStatus.DONE ? new Date() : undefined
      }
    });
    return res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
});

studiesRouter.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const input = studySchema.partial().parse(req.body);
    const entry = await prisma.studyEntry.update({
      where: { id: req.params.id, userId: req.user!.userId },
      data: {
        ...input,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
        completedAt: input.status === StudyStatus.DONE ? new Date() : undefined
      }
    });
    return res.json({ entry });
  } catch (error) {
    next(error);
  }
});
