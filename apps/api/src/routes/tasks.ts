import { Router } from "express";
import { z } from "zod";
import { authMiddleware, type AuthRequest } from "../auth.js";
import { Recurrence, RecurrenceValues, TaskStatus, TaskStatusValues, TaskType, TaskTypeValues } from "../domain.js";
import { prisma } from "../prisma.js";
import { endOfDay, startOfDay } from "../utils/date.js";

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
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const today = req.query.today === "true";

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user!.userId,
        status: req.query.status ? (String(req.query.status) as TaskStatus) : undefined,
        dueAt: today
          ? { gte: startOfDay(new Date()), lte: endOfDay(new Date()) }
          : from || to
            ? { gte: from, lte: to }
            : undefined
      },
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
