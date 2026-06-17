import { Router } from "express";
import { z } from "zod";
import { authMiddleware, type AuthRequest } from "../auth.js";
import { Recurrence, RecurrenceValues, TaskStatus, TaskStatusValues, TaskType, TaskTypeValues } from "../domain.js";
import { prisma } from "../prisma.js";
import { addDays, endOfDay, startOfDay } from "../utils/date.js";
import type { Prisma } from "@prisma/client";

export const tasksRouter = Router();
tasksRouter.use(authMiddleware);

const createTaskSchema = z.object({
  title: z.string().min(2),
  notes: z.string().optional(),
  type: z.enum(TaskTypeValues).default(TaskType.GENERAL),
  dueAt: z.string().datetime().optional(),
  remindAt: z.string().datetime().optional(),
  recurrence: z.enum(RecurrenceValues).default(Recurrence.NONE)
});

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(TaskStatusValues).optional()
});

tasksRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const today = req.query.today === "true";
    const missed = req.query.missed === "true";
    const active = req.query.active === "true";
    const status = req.query.status ? (String(req.query.status) as TaskStatus) : undefined;

    if (missed) {
      const weekAgo = startOfDay(addDays(now, -7));
      const tasks = await prisma.task.findMany({
        where: {
          userId: req.user!.userId,
          status: TaskStatus.PENDING,
          dueAt: { gte: weekAgo, lt: todayStart }
        },
        orderBy: [{ dueAt: "desc" }, { createdAt: "desc" }]
      });

      return res.json({ tasks });
    }

    const where: Prisma.TaskWhereInput = {
      userId: req.user!.userId,
      status
    };

    if (active) {
      where.OR = [
        { dueAt: null },
        { dueAt: { gte: todayStart } }
      ];
    } else if (today) {
      where.dueAt = { gte: todayStart, lte: endOfDay(now) };
    } else if (from || to) {
      where.dueAt = { gte: from, lte: to };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }]
    });

    return res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

tasksRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = createTaskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: {
        userId: req.user!.userId,
        title: input.title,
        notes: input.notes,
        type: input.type,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        remindAt: input.remindAt ? new Date(input.remindAt) : input.dueAt ? new Date(input.dueAt) : undefined,
        recurrence: input.recurrence
      }
    });
    return res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

tasksRouter.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const input = updateTaskSchema.parse(req.body);
    const task = await prisma.task.update({
      where: { id: req.params.id, userId: req.user!.userId },
      data: {
        ...input,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        remindAt: input.remindAt ? new Date(input.remindAt) : undefined,
        completedAt: input.status === TaskStatus.DONE ? new Date() : undefined
      }
    });
    return res.json({ task });
  } catch (error) {
    next(error);
  }
});

tasksRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id, userId: req.user!.userId } });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});
