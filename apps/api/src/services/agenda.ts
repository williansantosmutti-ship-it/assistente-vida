import { prisma } from "../prisma.js";
import { todayRangeInZone } from "../utils/date.js";

function formatHour(date?: Date | null, timeZone = "America/Sao_Paulo") {
  if (!date) return "sem horario";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export async function getTodayTasks(userId: string, timeZone = "America/Sao_Paulo", now = new Date()) {
  const { from, to } = todayRangeInZone(now, timeZone);
  return prisma.task.findMany({
    where: {
      userId,
      status: "PENDING",
      dueAt: { gte: from, lte: to }
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
    take: 30
  });
}

export async function buildTodayAgendaMessage(userId: string, timeZone = "America/Sao_Paulo", now = new Date()) {
  const tasks = await getTodayTasks(userId, timeZone, now);
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    weekday: "long",
    day: "2-digit",
    month: "2-digit"
  }).format(now);

  if (tasks.length === 0) {
    return `Agenda de hoje (${date}):\nVoce nao tem tarefas com horario para hoje.`;
  }

  const lines = tasks.map((task) => `- ${formatHour(task.dueAt, timeZone)}: ${task.title}`);
  return `Agenda de hoje (${date}):\n${lines.join("\n")}`;
}
