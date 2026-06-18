# Guia de portabilidade

Este pacote contem o codigo-fonte da Secretária Pessoal para abrir em outro editor ou outro programa de programacao.

## O que esta incluido

- Frontend React/Vite em `apps/web`.
- Backend Node/Express em `apps/api`.
- Prisma com PostgreSQL em producao e SQLite para teste local.
- Configuracao de deploy Render em `render.yaml`.
- Docker Compose para PostgreSQL local.
- PWA, Telegram Bot, lembretes, tarefas, gastos, saude, fitness e estudos.

## O que nao esta incluido

- `node_modules`.
- Builds `dist`.
- Banco local `.db`.
- Arquivos `.env` reais.
- Senhas, tokens do Telegram ou segredos JWT.
- Uploads e logs.

## Como abrir em outro editor

1. Extraia o ZIP.
2. Abra a pasta `assistente-vida-codigo-fonte` no VS Code, Cursor, Windsurf ou outro editor.
3. Instale o Node.js LTS.
4. No terminal da pasta, rode:

```bash
npm install
```

## Rodar local com SQLite

1. Copie o exemplo de ambiente:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Edite `.env` e preencha:

```env
MASTER_USER_EMAIL=seu-email
MASTER_USER_PASSWORD=sua-senha
JWT_SECRET=um-segredo-grande
DATABASE_URL=file:./dev.db
WEB_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
VITE_API_URL=http://localhost:4000
```

3. Prepare o banco local:

```bash
npm run local:setup
```

4. Rode o sistema:

```bash
npm run dev
```

URLs locais:

- Web: `http://localhost:5173`
- API: `http://localhost:4000`

## Deploy no Render

Use o arquivo `render.yaml`.

Variaveis obrigatorias da API:

```env
WEB_ORIGIN=https://URL-DO-SEU-FRONTEND
MASTER_USER_EMAIL=seu-email
MASTER_USER_PASSWORD=sua-senha
TELEGRAM_BOT_TOKEN=token-do-bot
API_PUBLIC_URL=https://URL-DA-SUA-API
```

Variavel obrigatoria do frontend:

```env
VITE_API_URL=https://URL-DA-SUA-API
```

O `DATABASE_URL` no Render vem automaticamente do banco criado pelo Blueprint.

## Telegram

Depois do deploy, envie para o bot:

```text
/start seu-email
```

Depois use frases naturais como:

```text
Me lembre amanha as 8h de marcar consulta
Gastei 45 reais no mercado
Marque estudo todo dia as 19h
```

## Seguranca

Nunca envie `.env`, senha, token do Telegram ou `JWT_SECRET` para repositorio publico. Se algum token foi exposto em print ou conversa, gere outro token no `@BotFather`.
