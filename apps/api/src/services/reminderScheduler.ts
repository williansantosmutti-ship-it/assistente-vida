import { prisma } from "../prisma.js";
import { Recurrence, TaskStatus } from "../domain.js";
import { addDays, dateKeyInZone, startOfDay, timeInZone } from "../utils/date.js";
import { buildTodayAgendaMessage } from "./agenda.js";
import { nextOccurrence } from "./commandParser.js";
import { sendTelegramMessage } from "./telegram.js";

let timer: NodeJS.Timeout | undefined;

export function startReminderScheduler() {
  if (timer) return;
  timer = setInterval(() => {
    void processDueReminders();
    void processDailySummaries();
    void processExpiredMissedTasks();
  }, 60_000);

  void processDueReminders();
  void processDailySummaries();
  void processExpiredMissedTasks();
}

export async function processExpiredMissedTasks() {
  const cutoff = startOfDay(addDays(new Date(), -7));
  await prisma.task.updateMany({
    where: {
      status: TaskStatus.PENDING,
      dueAt: { lt: cutoff }
    },
    data: { status: TaskStatus.CANCELLED }
  });
}

export async function processDueReminders() {
  const now = new Date();
  const tasks = await prisma.task.findMany({
    where: {
      status: "PENDING",
      remindAt: { lte: now },
      notifiedAt: null
    },
    include: { user: true },
    take: 50,
    orderBy: { remindAt: "asc" }
  });

  for (const task of tasks) {
    const title = "Lembrete";
    const body = task.title;

    await prisma.notification.create({
      data: {
        userId: task.userId,
        taskId: task.id,
        title,
        body,
        channel: "WEB",
        status: "SENT",
        scheduledAt: task.remindAt ?? now,
        sentAt: now
      }
    });

    if (task.user.telegramChatId) {
      try {
        await sendTelegramMessage(task.user.telegramChatId, `${title}: ${body}`);
        await prisma.notification.create({
          data: {
            userId: task.userId,
            taskId: task.id,
            title,
            body,
            channel: "TELEGRAM",
            status: "SENT",
            scheduledAt: task.remindAt ?? now,
            sentAt: now
          }
        });
      } catch (error) {
        await prisma.notification.create({
          data: {
            userId: task.userId,
            taskId: task.id,
            title,
            body,
            channel: "TELEGRAM",
            status: "FAILED",
            scheduledAt: task.remindAt ?? now,
            sentAt: now,
            error: error instanceof Error ? error.message : "Erro ao enviar Telegram"
          }
        });
      }
    }

    if (task.recurrence !== Recurrence.NONE && task.remindAt) {
      const recurrence = task.recurrence as Recurrence;
      const nextDate = nextOccurrence(task.remindAt, recurrence);
      await prisma.task.update({
        where: { id: task.id },
        data: {
          dueAt: task.dueAt ? nextOccurrence(task.dueAt, recurrence) : nextDate,
          remindAt: nextDate,
          notifiedAt: null
        }
      });
    } else {
      await prisma.task.update({
        where: { id: task.id },
        data: { notifiedAt: now }
      });
    }
  }
}

export async function processDailySummaries() {
  const now = new Date();
  const users = await prisma.user.findMany({
    where: {
      dailySummaryEnabled: true
    },
    select: {
      id: true,
      timezone: true,
      dailySummaryTime: true,
      lastDailySummaryAt: true,
      telegramChatId: true
    },
    take: 100
  });

  for (const user of users) {
    const timeZone = user.timezone || "America/Sao_Paulo";
    const currentDateKey = dateKeyInZone(now, timeZone);
    const lastDateKey = user.lastDailySummaryAt ? dateKeyInZone(user.lastDailySummaryAt, timeZone) : undefined;

    if (lastDateKey === currentDateKey) continue;
    if (timeInZone(now, timeZone) < user.dailySummaryTime) continue;

    const body = await buildTodayAgendaMessage(user.id, timeZone, now);
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Agenda de hoje",
        body,
        channel: "WEB",
        status: "SENT",
        scheduledAt: now,
        sentAt: now
      }
    });

    if (user.telegramChatId) {
      try {
        await sendTelegramMessage(user.telegramChatId, body);
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: "Agenda de hoje",
            body,
            channel: "TELEGRAM",
            status: "SENT",
            scheduledAt: now,
            sentAt: now
          }
        });
      } catch (error) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: "Agenda de hoje",
            body,
            channel: "TELEGRAM",
            status: "FAILED",
            scheduledAt: now,
            sentAt: now,
            error: error instanceof Error ? error.message : "Erro ao enviar Telegram"
          }
        });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastDailySummaryAt: now }
    });
  }
}
