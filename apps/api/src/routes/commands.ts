import { Router } from "express";
import { z } from "zod";
import { authMiddleware, type AuthRequest } from "../auth.js";
import { executeCommand } from "../services/commandExecutor.js";
import { parseCommand } from "../services/commandParser.js";

export const commandsRouter = Router();

commandsRouter.use(authMiddleware);

const commandSchema = z.object({
  text: z.string().min(2),
  source: z.string().default("text")
});

commandsRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = commandSchema.parse(req.body);
    const result = await executeCommand(req.user!.userId, input.text, input.source);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

commandsRouter.post("/preview", async (req, res, next) => {
  try {
    const input = commandSchema.parse(req.body);
    return res.json({ parsed: parseCommand(input.text) });
  } catch (error) {
    next(error);
  }
});
