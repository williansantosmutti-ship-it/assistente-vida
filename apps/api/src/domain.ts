export const TaskStatus = {
  PENDING: "PENDING",
  DONE: "DONE",
  CANCELLED: "CANCELLED"
} as const;
export const TaskStatusValues = ["PENDING", "DONE", "CANCELLED"] as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskType = {
  GENERAL: "GENERAL",
  HEALTH: "HEALTH",
  FITNESS: "FITNESS",
  STUDY: "STUDY",
  FINANCE: "FINANCE"
} as const;
export const TaskTypeValues = ["GENERAL", "HEALTH", "FITNESS", "STUDY", "FINANCE"] as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const Recurrence = {
  NONE: "NONE",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY"
} as const;
export const RecurrenceValues = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;
export type Recurrence = (typeof Recurrence)[keyof typeof Recurrence];

export const ExpenseCategory = {
  SAUDE: "SAUDE",
  MERCADO: "MERCADO",
  TRANSPORTE: "TRANSPORTE",
  LAZER: "LAZER",
  CONTAS: "CONTAS",
  OUTROS: "OUTROS"
} as const;
export const ExpenseCategoryValues = ["SAUDE", "MERCADO", "TRANSPORTE", "LAZER", "CONTAS", "OUTROS"] as const;
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const HealthOwner = {
  SELF: "SELF",
  FATHER: "FATHER",
  MOTHER: "MOTHER",
  OTHER: "OTHER"
} as const;
export const HealthOwnerValues = ["SELF", "FATHER", "MOTHER", "OTHER"] as const;
export type HealthOwner = (typeof HealthOwner)[keyof typeof HealthOwner];

export const HealthType = {
  CONSULTA: "CONSULTA",
  EXAME: "EXAME",
  REMEDIO: "REMEDIO",
  RETORNO: "RETORNO",
  DOCUMENTO: "DOCUMENTO"
} as const;
export const HealthTypeValues = ["CONSULTA", "EXAME", "REMEDIO", "RETORNO", "DOCUMENTO"] as const;
export type HealthType = (typeof HealthType)[keyof typeof HealthType];

export const FitnessType = {
  RUNNING: "RUNNING",
  GYM: "GYM",
  WEIGHT: "WEIGHT",
  OTHER: "OTHER"
} as const;
export const FitnessTypeValues = ["RUNNING", "GYM", "WEIGHT", "OTHER"] as const;
export type FitnessType = (typeof FitnessType)[keyof typeof FitnessType];

export const StudyStatus = {
  PLANNED: "PLANNED",
  DONE: "DONE"
} as const;
export const StudyStatusValues = ["PLANNED", "DONE"] as const;
export type StudyStatus = (typeof StudyStatus)[keyof typeof StudyStatus];
