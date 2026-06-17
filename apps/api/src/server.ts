import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import { ZodError } from "zod";
import { env } from "./env.js";
import { prisma } from "./prisma.js";
import { authRouter } from "./routes/auth.js";
import { commandsRouter } from "./routes/commands.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { documentsRouter } from "./routes/documents.js";
import { expensesRouter } from "./routes/expenses.js";
import { fitnessRouter } from "./routes/fitness.js";
import { healthRouter } from "./routes/health.js";
import { notificationsRouter } from "./routes/notifications.js";
import { settingsRouter } from "./routes/settings.js";
import { studiesRouter } from "./routes/studies.js";
import { tasksRouter } from "./routes/tasks.js";
import { usersRouter } from "./routes/users.js";
import { startReminderScheduler } from "./services/reminderScheduler.js";
import { startTelegram } from "./services/telegram.js";

const app = express();
const allowedOrigins = env.WEB_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origem nao permitida: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "assistente-vida-api" });
});

app.use("/auth", authRouter);
app.use("/commands", commandsRouter);
app.use("/dashboard", dashboardRouter);
app.use("/tasks", tasksRouter);
app.use("/expenses", expensesRouter);
app.use("/health-records", healthRouter);
app.use("/fitness", fitnessRouter);
app.use("/studies", studiesRouter);
app.use("/documents", documentsRouter);
app.use("/notifications", notificationsRouter);
app.use("/users", usersRouter);
app.use("/settings", settingsRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Dados invalidos.", issues: error.flatten() });
  }

  if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
    return res.status(404).json({ message: "Registro nao encontrado." });
  }

  console.error(error);
  return res.status(500).json({ message: "Erro interno." });
});

const server = app.listen(env.PORT, async () => {
  await prisma.$connect();
  startReminderScheduler();
  await startTelegram();
  console.log(`API pronta em http://localhost:${env.PORT}`);
});

process.on("SIGINT", async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});
