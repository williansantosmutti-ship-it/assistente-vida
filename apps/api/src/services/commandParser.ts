import { ExpenseCategory, FitnessType, HealthOwner, HealthType, Recurrence, TaskType } from "../domain.js";
import { addDays, addMonths } from "../utils/date.js";

type ParsedDate = {
  date?: Date;
  recurrence: Recurrence;
  hasTime: boolean;
};

export type ParsedCommand =
  | {
      intent: "expense";
      title: string;
      amount: number;
      category: ExpenseCategory;
      spentAt: Date;
      confidence: number;
    }
  | {
      intent: "health";
      title: string;
      owner: HealthOwner;
      healthType: HealthType;
      scheduledAt?: Date;
      recurrence: Recurrence;
      confidence: number;
    }
  | {
      intent: "fitness";
      title: string;
      fitnessType: FitnessType;
      date?: Date;
      recurrence: Recurrence;
      value?: number;
      unit?: string;
      confidence: number;
    }
  | {
      intent: "study";
      title: string;
      subject: string;
      scheduledAt?: Date;
      recurrence: Recurrence;
      confidence: number;
    }
  | {
      intent: "task";
      title: string;
      taskType: TaskType;
      dueAt?: Date;
      recurrence: Recurrence;
      confidence: number;
    };

const weekDays = [
  ["domingo", 0],
  ["segunda", 1],
  ["terca", 2],
  ["terça", 2],
  ["quarta", 3],
  ["quinta", 4],
  ["sexta", 5],
  ["sabado", 6],
  ["sábado", 6]
] as const;

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nextWeekday(now: Date, targetDay: number) {
  const date = new Date(now);
  const diff = (targetDay + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return date;
}

function applyTime(date: Date, text: string) {
  const normalized = normalize(text);
  const explicitTime =
    normalized.match(/\b(?:as|a|ao|pelas|para as)\s*(\d{1,2})(?:(?:h|:)(\d{2}))?\b/) ??
    normalized.match(/\b(\d{1,2})h(\d{2})?\b/);

  if (!explicitTime) {
    date.setHours(9, 0, 0, 0);
    return { date, hasTime: false };
  }

  const hour = Number(explicitTime[1]);
  const minute = Number(explicitTime[2] ?? 0);
  if (hour > 23 || minute > 59) {
    date.setHours(9, 0, 0, 0);
    return { date, hasTime: false };
  }

  date.setHours(hour, minute, 0, 0);
  return { date, hasTime: true };
}

export function parseDate(text: string, now = new Date()): ParsedDate {
  const normalized = normalize(text);
  let date: Date | undefined;
  let recurrence: Recurrence = Recurrence.NONE;

  if (/\b(todo dia|todos os dias|diariamente)\b/.test(normalized)) {
    recurrence = Recurrence.DAILY;
    date = new Date(now);
  } else if (/\b(toda semana|semanalmente|semanal)\b/.test(normalized)) {
    recurrence = Recurrence.WEEKLY;
    date = new Date(now);
  } else if (/\b(todo mes|mensalmente|mensal)\b/.test(normalized)) {
    recurrence = Recurrence.MONTHLY;
    date = new Date(now);
  }

  if (/\bdepois de amanha\b/.test(normalized)) {
    date = addDays(now, 2);
  } else if (/\bamanha\b/.test(normalized)) {
    date = addDays(now, 1);
  } else if (/\bhoje\b/.test(normalized)) {
    date = new Date(now);
  }

  const numericDate = normalized.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (numericDate) {
    const day = Number(numericDate[1]);
    const month = Number(numericDate[2]) - 1;
    const rawYear = numericDate[3] ? Number(numericDate[3]) : now.getFullYear();
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    date = new Date(year, month, day);
  }

  for (const [name, day] of weekDays) {
    if (normalized.includes(name)) {
      date = nextWeekday(now, day);
      break;
    }
  }

  const timeProbe = applyTime(date ? new Date(date) : new Date(now), text);
  if (!date && !timeProbe.hasTime) {
    return { recurrence, hasTime: false };
  }

  if (!date) {
    date = timeProbe.date;
    if (date.getTime() < now.getTime()) {
      date = addDays(date, 1);
    }
  } else {
    date = timeProbe.date;
  }

  return { date, recurrence, hasTime: timeProbe.hasTime };
}

function parseAmount(text: string) {
  const normalized = normalize(text).replace(",", ".");
  const money =
    normalized.match(/\br\$\s*(\d+(?:\.\d{1,2})?)\b/) ??
    normalized.match(/\b(\d+(?:\.\d{1,2})?)\s*(?:reais|real)\b/);
  return money ? Number(money[1]) : undefined;
}

function expenseCategory(text: string): ExpenseCategory {
  const normalized = normalize(text);
  if (/\b(remedio|farmacia|consulta|exame|medico|saude)\b/.test(normalized)) return ExpenseCategory.SAUDE;
  if (/\b(mercado|supermercado|feira|acougue|padaria)\b/.test(normalized)) return ExpenseCategory.MERCADO;
  if (/\b(onibus|uber|99|taxi|gasolina|estacionamento|transporte)\b/.test(normalized)) return ExpenseCategory.TRANSPORTE;
  if (/\b(lanche|restaurante|cinema|lazer|bar|delivery)\b/.test(normalized)) return ExpenseCategory.LAZER;
  if (/\b(conta|boleto|luz|agua|internet|aluguel|telefone)\b/.test(normalized)) return ExpenseCategory.CONTAS;
  return ExpenseCategory.OUTROS;
}

function healthOwner(text: string): HealthOwner {
  const normalized = normalize(text);
  if (/\b(pai|papai)\b/.test(normalized)) return HealthOwner.FATHER;
  if (/\b(mae|mamae)\b/.test(normalized)) return HealthOwner.MOTHER;
  return HealthOwner.SELF;
}

function healthType(text: string): HealthType {
  const normalized = normalize(text);
  if (/\b(exame|exames)\b/.test(normalized)) return HealthType.EXAME;
  if (/\b(remedio|medicamento|receita)\b/.test(normalized)) return HealthType.REMEDIO;
  if (/\b(retorno|revisao)\b/.test(normalized)) return HealthType.RETORNO;
  if (/\b(documento|laudo|guia)\b/.test(normalized)) return HealthType.DOCUMENTO;
  return HealthType.CONSULTA;
}

function fitnessType(text: string): FitnessType {
  const normalized = normalize(text);
  if (/\b(correr|corrida|corri)\b/.test(normalized)) return FitnessType.RUNNING;
  if (/\b(academia|musculacao|treino)\b/.test(normalized)) return FitnessType.GYM;
  if (/\b(peso|kg|quilos)\b/.test(normalized)) return FitnessType.WEIGHT;
  return FitnessType.OTHER;
}

function cleanTitle(text: string) {
  let title = text
    .replace(/^me lembre de\s+/i, "")
    .replace(/^me lembre\s+/i, "")
    .replace(/^tenho que\s+/i, "")
    .replace(/^preciso\s+/i, "")
    .replace(/^marque\s+/i, "")
    .replace(/(^|\s)(depois de amanhã|depois de amanha|amanhã|amanha|hoje|segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo)(?=\s|$)/gi, " ")
    .replace(/(^|\s)(todo dia|todos os dias|diariamente|toda semana|semanalmente|semanal|todo mes|mensalmente|mensal)(?=\s|$)/gi, " ")
    .replace(/(^|\s)(?:as|às|a|ao|pelas|para as)\s*\d{1,2}(?:(?:h|:)\d{0,2})?(?=\s|[.!?,]|$)/gi, " ")
    .replace(/\b\d{1,2}h\d{0,2}\b/gi, "")
    .replace(/(^|\s)(?:as|às)(?=\s|[.!?,]|$)/gi, " ")
    .replace(/^(de|que)\s+/i, "")
    .replace(/\s+(de|que)$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/, "");

  title = title
    .replace(/^(de|que)\s+/i, "")
    .replace(/^(vou|tenho)\s+/i, "")
    .trim();
  return title || text.trim();
}

function studySubject(text: string) {
  const normalized = normalize(text);
  const match = normalized.match(/\bestudar\s+([a-z0-9 ]+?)(?:\s+(?:as|a|todo|todos|hoje|amanha|sexta|quarta|segunda|terca|quinta|sabado|domingo)\b|$)/);
  if (match?.[1]) return match[1].trim();
  if (normalized.includes("concurso")) return "concurso";
  return "estudos";
}

export function nextOccurrence(date: Date, recurrence: Recurrence) {
  if (recurrence === Recurrence.DAILY) return addDays(date, 1);
  if (recurrence === Recurrence.WEEKLY) return addDays(date, 7);
  if (recurrence === Recurrence.MONTHLY) return addMonths(date, 1);
  return date;
}

export function parseCommand(text: string, now = new Date()): ParsedCommand {
  const normalized = normalize(text);
  const date = parseDate(text, now);
  const amount = parseAmount(text);

  if (amount && /\b(gastei|comprei|paguei|despesa|custou|reais|real|r\$)\b/.test(normalized)) {
    return {
      intent: "expense",
      title: cleanTitle(text) || "Despesa",
      amount,
      category: expenseCategory(text),
      spentAt: date.date ?? now,
      confidence: 0.92
    };
  }

  if (/\b(consulta|medico|medica|exame|remedio|medicamento|retorno|laudo|receita)\b/.test(normalized)) {
    return {
      intent: "health",
      title: cleanTitle(text) || "Compromisso de saude",
      owner: healthOwner(text),
      healthType: healthType(text),
      scheduledAt: date.date,
      recurrence: date.recurrence,
      confidence: 0.88
    };
  }

  if (/\b(correr|corrida|academia|treino|musculacao|peso|kg|quilos)\b/.test(normalized)) {
    const value = normalized.match(/\b(\d+(?:\.\d+)?)\s*(kg|km|quilos?)\b/);
    return {
      intent: "fitness",
      title: cleanTitle(text) || "Atividade fitness",
      fitnessType: fitnessType(text),
      date: date.date,
      recurrence: date.recurrence,
      value: value ? Number(value[1]) : undefined,
      unit: value?.[2],
      confidence: 0.86
    };
  }

  if (/\b(estudar|estudo|aula|curso|concurso|revisar|revisao)\b/.test(normalized)) {
    const subject = studySubject(text);
    return {
      intent: "study",
      title: cleanTitle(text) || `Estudar ${subject}`,
      subject,
      scheduledAt: date.date,
      recurrence: date.recurrence,
      confidence: 0.86
    };
  }

  return {
    intent: "task",
    title: cleanTitle(text) || text.trim(),
    taskType: TaskType.GENERAL,
    dueAt: date.date,
    recurrence: date.recurrence,
    confidence: date.date ? 0.75 : 0.62
  };
}
