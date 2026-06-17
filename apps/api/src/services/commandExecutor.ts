import { TaskType } from "../domain.js";
import { prisma } from "../prisma.js";
import { parseCommand } from "./commandParser.js";

export async function executeCommand(userId: string, text: string, source = "text") {
  const parsed = parseCommand(text);

  if (parsed.intent === "expense") {
    const expense = await prisma.expense.create({
      data: {
        userId,
        amount: parsed.amount,
        description: parsed.title,
        category: parsed.category,
        spentAt: parsed.spentAt,
        source
      }
    });
    return { parsed, created: { expense } };
  }

  if (parsed.intent === "health") {
    const healthRecord = await prisma.healthRecord.create({
      data: {
        userId,
        owner: parsed.owner,
        type: parsed.healthType,
        title: parsed.title,
        scheduledAt: parsed.scheduledAt
      }
    });

    const task = parsed.scheduledAt
      ? await prisma.task.create({
          data: {
            userId,
            title: parsed.title,
            type: TaskType.HEALTH,
            dueAt: parsed.scheduledAt,
            remindAt: parsed.scheduledAt,
            recurrence: parsed.recurrence,
            source
          }
        })
      : undefined;

    return { parsed, created: { healthRecord, task } };
  }

  if (parsed.intent === "fitness") {
    const isLog = !parsed.date || /(?:treinei|corri|fiz|registrei|peso)/i.test(text);
    const fitnessEntry = isLog
      ? await prisma.fitnessEntry.create({
          data: {
            userId,
            type: parsed.fitnessType,
            title: parsed.title,
            value: parsed.value,
            unit: parsed.unit,
            occurredAt: parsed.date ?? new Date()
          }
        })
      : undefined;

    const task = parsed.date
      ? await prisma.task.create({
          data: {
            userId,
            title: parsed.title,
            type: TaskType.FITNESS,
            dueAt: parsed.date,
            remindAt: parsed.date,
            recurrence: parsed.recurrence,
            source
          }
        })
      : undefined;

    return { parsed, created: { fitnessEntry, task } };
  }

  if (parsed.intent === "study") {
    const studyEntry = await prisma.studyEntry.create({
      data: {
        userId,
        subject: parsed.subject,
        title: parsed.title,
        scheduledAt: parsed.scheduledAt
      }
    });

    const task = parsed.scheduledAt
      ? await prisma.task.create({
          data: {
            userId,
            title: parsed.title,
            type: TaskType.STUDY,
            dueAt: parsed.scheduledAt,
            remindAt: parsed.scheduledAt,
            recurrence: parsed.recurrence,
            source
          }
        })
      : undefined;

    return { parsed, created: { studyEntry, task } };
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title: parsed.title,
      type: parsed.taskType,
      dueAt: parsed.dueAt,
      remindAt: parsed.dueAt,
      recurrence: parsed.recurrence,
      source
    }
  });

  return { parsed, created: { task } };
}
