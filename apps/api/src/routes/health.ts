import { Router } from "express";
import { z } from "zod";
import { authMiddleware, type AuthRequest } from "../auth.js";
import { HealthOwner, HealthOwnerValues, HealthTypeValues } from "../domain.js";
import { prisma } from "../prisma.js";

export const healthRouter = Router();
healthRouter.use(authMiddleware);

const healthSchema = z.object({
  owner: z.enum(HealthOwnerValues).default(HealthOwner.SELF),
  type: z.enum(HealthTypeValues),
  title: z.string().min(2),
  provider: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  documentId: z.string().optional()
});

healthRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const records = await prisma.healthRecord.findMany({
      where: { userId: req.user!.userId },
      include: { document: true },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }]
    });
    return res.json({ records });
  } catch (error) {
    next(error);
  }
});

healthRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = healthSchema.parse(req.body);
    const record = await prisma.healthRecord.create({
      data: {
        userId: req.user!.userId,
        ...input,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined
      }
    });
    return res.status(201).json({ record });
  } catch (error) {
    next(error);
  }
});

healthRouter.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const input = healthSchema.partial().parse(req.body);
    const record = await prisma.healthRecord.update({
      where: { id: req.params.id, userId: req.user!.userId },
      data: {
        ...input,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined
      }
    });
    return res.json({ record });
  } catch (error) {
    next(error);
  }
});
