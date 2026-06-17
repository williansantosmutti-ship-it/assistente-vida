export type TaskStatus = "PENDING" | "DONE" | "CANCELLED";
export type TaskType = "GENERAL" | "HEALTH" | "FITNESS" | "STUDY" | "FINANCE";
export type ExpenseCategory = "SAUDE" | "MERCADO" | "TRANSPORTE" | "LAZER" | "CONTAS" | "OUTROS";
export type HealthOwner = "SELF" | "FATHER" | "MOTHER" | "OTHER";
export type HealthType = "CONSULTA" | "EXAME" | "REMEDIO" | "RETORNO" | "DOCUMENTO";
export type FitnessType = "RUNNING" | "GYM" | "WEIGHT" | "OTHER";
export type StudyStatus = "PLANNED" | "DONE";
export type UserRole = "MASTER" | "USER";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  timezone: string;
  dailySummaryEnabled: boolean;
  dailySummaryTime: string;
  telegramChatId?: string | null;
};

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  telegramChatId?: string | null;
};

export type Task = {
  id: string;
  title: string;
  notes?: string | null;
  type: TaskType;
  status: TaskStatus;
  dueAt?: string | null;
  remindAt?: string | null;
  recurrence: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
};

export type Expense = {
  id: string;
  amount: string | number;
  description: string;
  category: ExpenseCategory;
  spentAt: string;
};

export type HealthRecord = {
  id: string;
  owner: HealthOwner;
  type: HealthType;
  title: string;
  provider?: string | null;
  scheduledAt?: string | null;
  notes?: string | null;
};

export type FitnessEntry = {
  id: string;
  type: FitnessType;
  title: string;
  value?: number | null;
  unit?: string | null;
  occurredAt: string;
  goal?: string | null;
};

export type StudyEntry = {
  id: string;
  subject: string;
  title: string;
  scheduledAt?: string | null;
  durationMinutes?: number | null;
  weeklyGoal?: string | null;
  status: StudyStatus;
};

export type Dashboard = {
  todayTasks: Task[];
  upcomingTasks: Task[];
  expenses: {
    total: string | number;
    byCategory: { category: ExpenseCategory; _sum: { amount: string | number | null } }[];
  };
  healthUpcoming: HealthRecord[];
  fitnessRecent: FitnessEntry[];
  studiesPending: StudyEntry[];
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  sentAt?: string | null;
};
