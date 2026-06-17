import {
  Activity,
  AlertCircle,
  Bell,
  BookOpen,
  CalendarClock,
  Check,
  CheckSquare,
  Dumbbell,
  FileUp,
  HeartPulse,
  Home,
  LogOut,
  Mic,
  Plus,
  Send,
  Square,
  Trash2,
  UserPlus,
  Wallet
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, setToken } from "./api";
import type {
  AppNotification,
  Dashboard,
  Expense,
  ExpenseCategory,
  FitnessEntry,
  FitnessType,
  HealthOwner,
  HealthRecord,
  HealthType,
  ManagedUser,
  StudyEntry,
  Task,
  User
} from "./types";

type Tab = "home" | "tasks" | "expenses" | "health" | "fitness" | "studies" | "users";

const tabs: { id: Tab; label: string; icon: typeof Home; masterOnly?: boolean }[] = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "tasks", label: "Hoje", icon: CheckSquare },
  { id: "expenses", label: "Gastos", icon: Wallet },
  { id: "health", label: "Saude", icon: HeartPulse },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "studies", label: "Estudos", icon: BookOpen },
  { id: "users", label: "Usuarios", icon: UserPlus, masterOnly: true }
];

const expenseLabels: Record<ExpenseCategory, string> = {
  SAUDE: "Saude",
  MERCADO: "Mercado",
  TRANSPORTE: "Transporte",
  LAZER: "Lazer",
  CONTAS: "Contas",
  OUTROS: "Outros"
};

const ownerLabels: Record<HealthOwner, string> = {
  SELF: "Eu",
  FATHER: "Pai",
  MOTHER: "Mae",
  OTHER: "Outro"
};

const healthTypeLabels: Record<HealthType, string> = {
  CONSULTA: "Consulta",
  EXAME: "Exame",
  REMEDIO: "Remedio",
  RETORNO: "Retorno",
  DOCUMENTO: "Documento"
};

const fitnessTypeLabels: Record<FitnessType, string> = {
  RUNNING: "Corrida",
  GYM: "Academia",
  WEIGHT: "Peso",
  OTHER: "Outro"
};

function money(value?: string | number | null) {
  return Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateTime(value?: string | null) {
  if (!value) return "Sem horario";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function localInput(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function localInputToIso(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function typeBadge(type: string) {
  const labels: Record<string, string> = {
    GENERAL: "Pessoal",
    HEALTH: "Saude",
    FITNESS: "Fitness",
    STUDY: "Estudo",
    FINANCE: "Financeiro"
  };
  return labels[type] ?? type;
}

export function App() {
  const [tokenState, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [version, setVersion] = useState(0);
  const [error, setError] = useState("");

  const refreshDashboard = useCallback(async () => {
    if (!getToken()) return;
    const payload = await api<Dashboard>("/dashboard");
    setDashboard(payload);
  }, []);

  const refreshAll = useCallback(async () => {
    setVersion((current) => current + 1);
    await refreshDashboard();
  }, [refreshDashboard]);

  useEffect(() => {
    if (!tokenState) return;
    Promise.all([
      api<{ user: User }>("/auth/me").then((payload) => setUser(payload.user)),
      refreshDashboard()
    ]).catch((err) => {
      setError(err.message);
      clearToken();
      setTokenState(null);
    });
  }, [tokenState, refreshDashboard]);

  useEffect(() => {
    if (!tokenState) return;

    const poll = async () => {
      const seen = new Set(JSON.parse(localStorage.getItem("assistente.notifications") ?? "[]") as string[]);
      const payload = await api<{ notifications: AppNotification[] }>("/notifications").catch(() => ({ notifications: [] }));

      for (const notification of payload.notifications) {
        if (seen.has(notification.id)) continue;
        seen.add(notification.id);
        if ("Notification" in window && Notification.permission === "granted") {
          if ("serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(notification.title, { body: notification.body });
          } else {
            new Notification(notification.title, { body: notification.body });
          }
        }
      }

      localStorage.setItem("assistente.notifications", JSON.stringify([...seen].slice(-100)));
    };

    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }

    void poll();
    const interval = window.setInterval(poll, 60_000);
    return () => window.clearInterval(interval);
  }, [tokenState]);

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setDashboard(null);
  };

  const visibleTabs = tabs.filter((tab) => !tab.masterOnly || user?.role === "MASTER");

  if (!tokenState) {
    return <AuthScreen onLogin={(token) => {
      setToken(token);
      setTokenState(token);
    }} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date())}</p>
          <h1>Assistente de Vida</h1>
        </div>
        <button className="icon-button" onClick={logout} aria-label="Sair" title="Sair">
          <LogOut size={20} />
        </button>
      </header>

      {error ? <div className="toast">{error}</div> : null}

      <CommandComposer
        onCreated={refreshAll}
        onError={setError}
      />

      <main className="content">
        {activeTab === "home" && <HomeView dashboard={dashboard} user={user} onUserChanged={setUser} onRefresh={refreshAll} />}
        {activeTab === "tasks" && <TasksView version={version} onChanged={refreshAll} />}
        {activeTab === "expenses" && <ExpensesView version={version} onChanged={refreshAll} />}
        {activeTab === "health" && <HealthView version={version} onChanged={refreshAll} />}
        {activeTab === "fitness" && <FitnessView version={version} onChanged={refreshAll} />}
        {activeTab === "studies" && <StudiesView version={version} onChanged={refreshAll} />}
        {activeTab === "users" && user?.role === "MASTER" && <UsersView version={version} />}
      </main>

      <nav className="bottom-nav" aria-label="Navegacao principal">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              <Icon size={19} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <span className="user-chip">{user?.name ?? "Usuario"}</span>
    </div>
  );
}

function AuthScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = await api<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      onLogin(payload.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel entrar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-mark">
          <Bell size={24} />
        </div>
        <h1>Assistente de Vida</h1>
        <label>
          E-mail
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
        </label>
        <label>
          Senha
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Aguarde..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function CommandComposer({ onCreated, onError }: { onCreated: () => Promise<void>; onError: (message: string) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api("/commands", {
        method: "POST",
        body: JSON.stringify({ text, source: listening ? "voice" : "text" })
      });
      setText("");
      await onCreated();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Nao consegui registrar.");
    } finally {
      setBusy(false);
      setListening(false);
    }
  };

  const startVoice = () => {
    const Recognition = (window as typeof window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!Recognition) {
      onError("Reconhecimento de voz indisponivel neste navegador.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setText(transcript);
    };
    recognition.start();
  };

  return (
    <form className="command-bar" onSubmit={submit}>
      <button className={listening ? "icon-button recording" : "icon-button"} type="button" onClick={startVoice} aria-label="Gravar voz" title="Gravar voz">
        <Mic size={20} />
      </button>
      <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Me lembre amanha as 8h..." />
      <button className="send-button" type="submit" disabled={busy || !text.trim()} aria-label="Enviar" title="Enviar">
        <Send size={19} />
      </button>
    </form>
  );
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  start: () => void;
};

function HomeView({
  dashboard,
  user,
  onUserChanged,
  onRefresh
}: {
  dashboard: Dashboard | null;
  user: User | null;
  onUserChanged: (user: User) => void;
  onRefresh: () => Promise<void>;
}) {
  const totalToday = dashboard?.todayTasks.length ?? 0;
  const totalMonth = dashboard?.expenses.total ?? 0;
  const totalMissed = dashboard?.missedTasks.length ?? 0;

  return (
    <section className="screen">
      <div className="summary-grid">
        <article className="stat accent-teal">
          <span>Tarefas hoje</span>
          <strong>{totalToday}</strong>
        </article>
        <article className="stat accent-coral">
          <span>Gastos do mes</span>
          <strong>{money(totalMonth)}</strong>
        </article>
        <article className="stat accent-green">
          <span>Saude</span>
          <strong>{dashboard?.healthUpcoming.length ?? 0}</strong>
        </article>
        <article className="stat accent-amber">
          <span>Estudos</span>
          <strong>{dashboard?.studiesPending.length ?? 0}</strong>
        </article>
        <article className="stat accent-danger">
          <span>Nao realizadas</span>
          <strong>{totalMissed}</strong>
        </article>
      </div>

      <Panel title="Hoje" icon={CheckSquare}>
        <ItemList empty="Nada pendente para hoje.">
          {dashboard?.todayTasks.map((task) => (
            <TaskRow key={task.id} task={task} onChanged={onRefresh} />
          ))}
        </ItemList>
      </Panel>

      <Panel title="Nao realizadas" icon={AlertCircle}>
        <ItemList empty="Nenhuma tarefa vencida na ultima semana.">
          {dashboard?.missedTasks.map((task) => (
            <TaskRow key={task.id} task={task} onChanged={onRefresh} />
          ))}
        </ItemList>
      </Panel>

      {user ? <ReminderSettings user={user} onUserChanged={onUserChanged} /> : null}

      <Panel title="Proximos" icon={CalendarClock}>
        <ItemList empty="Sem compromissos proximos.">
          {dashboard?.upcomingTasks.map((task) => (
            <TaskRow key={task.id} task={task} onChanged={onRefresh} />
          ))}
        </ItemList>
      </Panel>

      <Panel title="Despesas" icon={Wallet}>
        <div className="category-bars">
          {dashboard?.expenses.byCategory.map((item) => {
            const amount = Number(item._sum.amount ?? 0);
            const total = Number(dashboard.expenses.total || 1);
            return (
              <div className="bar-row" key={item.category}>
                <span>{expenseLabels[item.category]}</span>
                <div className="bar-track"><i style={{ width: `${Math.min(100, (amount / total) * 100)}%` }} /></div>
                <b>{money(amount)}</b>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Fitness recente" icon={Activity}>
        <ItemList empty="Nenhum registro fitness.">
          {dashboard?.fitnessRecent.map((entry) => (
            <div className="list-item" key={entry.id}>
              <div>
                <strong>{entry.title}</strong>
                <span>{fitnessTypeLabels[entry.type]} · {dateTime(entry.occurredAt)}</span>
              </div>
            </div>
          ))}
        </ItemList>
      </Panel>
    </section>
  );
}

function ReminderSettings({ user, onUserChanged }: { user: User; onUserChanged: (user: User) => void }) {
  const [enabled, setEnabled] = useState(user.dailySummaryEnabled);
  const [time, setTime] = useState(user.dailySummaryTime);
  const [saved, setSaved] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const payload = await api<{ settings: Pick<User, "timezone" | "dailySummaryEnabled" | "dailySummaryTime" | "telegramChatId"> }>("/settings", {
      method: "PATCH",
      body: JSON.stringify({ dailySummaryEnabled: enabled, dailySummaryTime: time })
    });

    onUserChanged({ ...user, ...payload.settings });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <Panel title="Alertas" icon={Bell}>
      <form className="settings-row" onSubmit={save}>
        <label className="toggle-row">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          <span>Resumo diario das tarefas</span>
        </label>
        <input value={time} onChange={(event) => setTime(event.target.value)} type="time" aria-label="Horario do resumo diario" />
        <button className="primary-button compact" type="submit">Salvar</button>
      </form>
      <p className="settings-note">
        {user.telegramChatId ? "Telegram conectado para lembretes no celular." : "Conecte o Telegram com /start seu@email.com para receber fora do app."}
      </p>
      {saved ? <p className="inline-message">Configuracao salva.</p> : null}
    </Panel>
  );
}

function TasksView({ version, onChanged }: { version: number; onChanged: () => Promise<void> }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [missedTasks, setMissedTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState(localInput());

  const load = useCallback(async () => {
    const [activePayload, missedPayload] = await Promise.all([
      api<{ tasks: Task[] }>("/tasks?status=PENDING&active=true"),
      api<{ tasks: Task[] }>("/tasks?missed=true")
    ]);
    setTasks(activePayload.tasks);
    setMissedTasks(missedPayload.tasks);
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    await api("/tasks", {
      method: "POST",
      body: JSON.stringify({ title, dueAt: localInputToIso(dueAt), remindAt: localInputToIso(dueAt) })
    });
    setTitle("");
    await load();
    await onChanged();
  };

  return (
    <section className="screen">
      <InlineForm onSubmit={create}>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nova tarefa" />
        <input value={dueAt} onChange={(event) => setDueAt(event.target.value)} type="datetime-local" />
        <button className="mini-button" type="submit" title="Adicionar"><Plus size={18} /></button>
      </InlineForm>
      <Panel title="Pendencias" icon={CheckSquare}>
        <ItemList empty="Lista vazia.">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onChanged={async () => {
              await load();
              await onChanged();
            }} />
          ))}
        </ItemList>
      </Panel>
      <Panel title="Nao realizadas" icon={AlertCircle}>
        <ItemList empty="Nada vencido na ultima semana.">
          {missedTasks.map((task) => (
            <TaskRow key={task.id} task={task} onChanged={async () => {
              await load();
              await onChanged();
            }} />
          ))}
        </ItemList>
      </Panel>
    </section>
  );
}

function TaskRow({ task, onChanged }: { task: Task; onChanged: () => Promise<void> }) {
  const complete = async () => {
    await api(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "DONE" })
    });
    await onChanged();
  };

  const remove = async () => {
    await api(`/tasks/${task.id}`, { method: "DELETE" });
    await onChanged();
  };

  return (
    <div className="list-item task-row">
      <button className="check-button" onClick={complete} title="Concluir" aria-label="Concluir">
        {task.status === "DONE" ? <Check size={18} /> : <Square size={18} />}
      </button>
      <div>
        <strong>{task.title}</strong>
        <span>{dateTime(task.dueAt)} · {typeBadge(task.type)}</span>
      </div>
      <button className="icon-button ghost" onClick={remove} title="Excluir" aria-label="Excluir">
        <Trash2 size={17} />
      </button>
    </div>
  );
}

function ExpensesView({ version, onChanged }: { version: number; onChanged: () => Promise<void> }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("OUTROS");

  const load = useCallback(async () => {
    const payload = await api<{ expenses: Expense[] }>("/expenses");
    setExpenses(payload.expenses);
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  const total = useMemo(() => expenses.reduce((sum, item) => sum + Number(item.amount), 0), [expenses]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!amount || !description.trim()) return;
    await api("/expenses", {
      method: "POST",
      body: JSON.stringify({ amount: Number(amount.replace(",", ".")), description, category })
    });
    setAmount("");
    setDescription("");
    await load();
    await onChanged();
  };

  const remove = async (id: string) => {
    await api(`/expenses/${id}`, { method: "DELETE" });
    await load();
    await onChanged();
  };

  return (
    <section className="screen">
      <div className="month-total">
        <span>Total do mes</span>
        <strong>{money(total)}</strong>
      </div>
      <InlineForm onSubmit={create}>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Valor" />
        <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descricao" />
        <select value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory)}>
          {Object.entries(expenseLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <button className="mini-button" type="submit" title="Adicionar"><Plus size={18} /></button>
      </InlineForm>
      <Panel title="Lancamentos" icon={Wallet}>
        <ItemList empty="Nenhuma despesa no mes.">
          {expenses.map((expense) => (
            <div className="list-item" key={expense.id}>
              <div>
                <strong>{expense.description}</strong>
                <span>{expenseLabels[expense.category]} · {dateTime(expense.spentAt)}</span>
              </div>
              <div className="list-actions">
                <b>{money(expense.amount)}</b>
                <button className="icon-button ghost" onClick={() => remove(expense.id)} title="Excluir" aria-label="Excluir">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </ItemList>
      </Panel>
    </section>
  );
}

function HealthView({ version, onChanged }: { version: number; onChanged: () => Promise<void> }) {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState<HealthOwner>("SELF");
  const [type, setType] = useState<HealthType>("CONSULTA");
  const [scheduledAt, setScheduledAt] = useState(localInput());
  const [documentName, setDocumentName] = useState("");

  const load = useCallback(async () => {
    const payload = await api<{ records: HealthRecord[] }>("/health-records");
    setRecords(payload.records);
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    await api("/health-records", {
      method: "POST",
      body: JSON.stringify({ title, owner, type, scheduledAt: localInputToIso(scheduledAt) })
    });
    setTitle("");
    await load();
    await onChanged();
  };

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    const payload = await api<{ document: { originalName: string } }>("/documents", { method: "POST", body });
    setDocumentName(payload.document.originalName);
  };

  const remove = async (id: string) => {
    await api(`/health-records/${id}`, { method: "DELETE" });
    await load();
    await onChanged();
  };

  return (
    <section className="screen">
      <InlineForm onSubmit={create}>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Consulta, exame ou remedio" />
        <select value={owner} onChange={(event) => setOwner(event.target.value as HealthOwner)}>
          {Object.entries(ownerLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <select value={type} onChange={(event) => setType(event.target.value as HealthType)}>
          {Object.entries(healthTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <input value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" />
        <button className="mini-button" type="submit" title="Adicionar"><Plus size={18} /></button>
      </InlineForm>

      <label className="upload-row">
        <FileUp size={18} />
        <span>{documentName || "Enviar documento"}</span>
        <input type="file" onChange={upload} />
      </label>

      <Panel title="Historico de saude" icon={HeartPulse}>
        <ItemList empty="Nenhum registro de saude.">
          {records.map((record) => (
            <div className="list-item" key={record.id}>
              <div>
                <strong>{record.title}</strong>
                <span>{ownerLabels[record.owner]} · {healthTypeLabels[record.type]} · {dateTime(record.scheduledAt)}</span>
              </div>
              <button className="icon-button ghost" onClick={() => remove(record.id)} title="Excluir" aria-label="Excluir">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </ItemList>
      </Panel>
    </section>
  );
}

function FitnessView({ version, onChanged }: { version: number; onChanged: () => Promise<void> }) {
  const [entries, setEntries] = useState<FitnessEntry[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<FitnessType>("RUNNING");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("km");

  const load = useCallback(async () => {
    const payload = await api<{ entries: FitnessEntry[] }>("/fitness");
    setEntries(payload.entries);
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    await api("/fitness", {
      method: "POST",
      body: JSON.stringify({ title, type, value: value ? Number(value.replace(",", ".")) : undefined, unit })
    });
    setTitle("");
    setValue("");
    await load();
    await onChanged();
  };

  const remove = async (id: string) => {
    await api(`/fitness/${id}`, { method: "DELETE" });
    await load();
    await onChanged();
  };

  return (
    <section className="screen">
      <InlineForm onSubmit={create}>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Treino ou meta" />
        <select value={type} onChange={(event) => setType(event.target.value as FitnessType)}>
          {Object.entries(fitnessTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" placeholder="Valor" />
        <input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Un." />
        <button className="mini-button" type="submit" title="Adicionar"><Plus size={18} /></button>
      </InlineForm>
      <Panel title="Historico fitness" icon={Dumbbell}>
        <ItemList empty="Sem atividades registradas.">
          {entries.map((entry) => (
            <div className="list-item" key={entry.id}>
              <div>
                <strong>{entry.title}</strong>
                <span>{fitnessTypeLabels[entry.type]} · {dateTime(entry.occurredAt)}</span>
              </div>
              <div className="list-actions">
                {entry.value ? <b>{entry.value} {entry.unit}</b> : null}
                <button className="icon-button ghost" onClick={() => remove(entry.id)} title="Excluir" aria-label="Excluir">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </ItemList>
      </Panel>
    </section>
  );
}

function StudiesView({ version, onChanged }: { version: number; onChanged: () => Promise<void> }) {
  const [entries, setEntries] = useState<StudyEntry[]>([]);
  const [subject, setSubject] = useState("concurso");
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(localInput());

  const load = useCallback(async () => {
    const payload = await api<{ entries: StudyEntry[] }>("/studies");
    setEntries(payload.entries);
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    await api("/studies", {
      method: "POST",
      body: JSON.stringify({ subject, title, scheduledAt: localInputToIso(scheduledAt) })
    });
    setTitle("");
    await load();
    await onChanged();
  };

  const complete = async (id: string) => {
    await api(`/studies/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "DONE" })
    });
    await load();
    await onChanged();
  };

  const remove = async (id: string) => {
    await api(`/studies/${id}`, { method: "DELETE" });
    await load();
    await onChanged();
  };

  return (
    <section className="screen">
      <InlineForm onSubmit={create}>
        <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Materia" />
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sessao de estudo" />
        <input value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" />
        <button className="mini-button" type="submit" title="Adicionar"><Plus size={18} /></button>
      </InlineForm>
      <Panel title="Agenda de estudos" icon={BookOpen}>
        <ItemList empty="Nada planejado.">
          {entries.map((entry) => (
            <div className="list-item" key={entry.id}>
              <div>
                <strong>{entry.title}</strong>
                <span>{entry.subject} · {dateTime(entry.scheduledAt)} · {entry.status === "DONE" ? "Concluido" : "Pendente"}</span>
              </div>
              <div className="list-actions">
                {entry.status !== "DONE" ? (
                  <button className="check-button" onClick={() => complete(entry.id)} title="Concluir" aria-label="Concluir">
                    <Check size={18} />
                  </button>
                ) : null}
                <button className="icon-button ghost" onClick={() => remove(entry.id)} title="Excluir" aria-label="Excluir">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </ItemList>
      </Panel>
    </section>
  );
}

function UsersView({ version }: { version: number }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const payload = await api<{ users: ManagedUser[] }>("/users");
    setUsers(payload.users);
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (!name.trim() || !email.trim() || password.length < 6) {
      setMessage("Preencha nome, e-mail e senha com pelo menos 6 caracteres.");
      return;
    }

    await api("/users", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });

    setName("");
    setEmail("");
    setPassword("");
    setMessage("Usuario criado.");
    await load();
  };

  return (
    <section className="screen">
      <InlineForm onSubmit={create}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do usuario" autoComplete="name" />
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" type="email" autoComplete="email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha inicial" type="password" autoComplete="new-password" />
        <button className="mini-button" type="submit" title="Criar usuario"><UserPlus size={18} /></button>
      </InlineForm>
      {message ? <p className="inline-message">{message}</p> : null}
      <Panel title="Usuarios do sistema" icon={UserPlus}>
        <ItemList empty="Nenhum usuario cadastrado.">
          {users.map((item) => (
            <div className="list-item" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>{item.email} · {item.role === "MASTER" ? "Master" : "Usuario"}</span>
              </div>
            </div>
          ))}
        </ItemList>
      </Panel>
    </section>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Home; children: React.ReactNode }) {
  return (
    <section className="panel">
      <header className="panel-header">
        <Icon size={19} />
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function ItemList({ children, empty }: { children?: React.ReactNode; empty: string }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  if (!items || (Array.isArray(items) && items.length === 0)) {
    return <p className="empty-state">{empty}</p>;
  }
  return <div className="item-list">{items}</div>;
}

function InlineForm({ children, onSubmit }: { children: React.ReactNode; onSubmit: (event: FormEvent) => void }) {
  return (
    <form className="inline-form" onSubmit={onSubmit}>
      {children}
    </form>
  );
}
