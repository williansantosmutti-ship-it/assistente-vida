# Secretária Pessoal

Sistema pessoal para celular com painel web responsivo, API Node/Express, PostgreSQL, Prisma, Telegram Bot, lembretes, despesas, saude familiar, estudos, fitness, upload de documentos e entrada por texto ou voz.

## Modulos

- Tarefas e lembretes com data, horario, recorrencia e notificacoes.
- Saude familiar: pai, mae, voce, consultas, exames, remedios, retornos e documentos.
- Financeiro: lancamentos por categoria e resumo mensal.
- Fitness: corrida, academia, peso, metas e historico.
- Estudos: agenda, sessoes planejadas, conclusao e metas.
- Comandos naturais em portugues: `Me lembre amanha de marcar consulta`, `Gastei R$ 45 no mercado`, `Marque estudo todo dia as 19h`.
- Telegram: comandos por mensagem e alertas no horario.
- PWA: pode ser instalado no celular pelo navegador.

## Stack

- Frontend: React + Vite + TypeScript.
- Backend: Node.js + Express + TypeScript.
- Banco: PostgreSQL + Prisma.
- Auth: login/senha com JWT.
- Arquivos: upload local em `uploads`.
- Voz: Web Speech API no navegador; o backend fica preparado para receber o texto interpretado.

## Como rodar

1. Instale dependencias:

```bash
npm install
```

2. Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Para rodar localmente nesta maquina sem Docker/PostgreSQL, prepare o SQLite local:

```bash
npm run local:setup
```

Depois rode:

```bash
npm run dev
```

4. Se quiser usar PostgreSQL com Docker, suba o banco:

```bash
npm run db:up
```

5. Gere o Prisma Client PostgreSQL e aplique a migracao:

```bash
npm run prisma:generate -w apps/api
npm run db:migrate
```

6. Crie dados iniciais:

```bash
npm run seed
```

7. Rode API e web juntos:

```bash
npm run dev
```

URLs padrao:

- Web: http://localhost:5173
- API: http://localhost:4000
- Prisma Studio: `npm run db:studio`

Para usar em qualquer lugar pelo celular, veja [DEPLOY.md](DEPLOY.md).

Usuario master inicial:

- E-mail: definido em `MASTER_USER_EMAIL` no `.env`.
- Senha: definida em `MASTER_USER_PASSWORD` no `.env`.

Por seguranca, a tela inicial nao permite criar conta. O cadastro publico `POST /auth/register` fica bloqueado. Novos usuarios devem ser criados dentro do sistema pela aba `Usuarios`, visivel apenas para o usuario master.

## Uso no celular

Com o computador e celular na mesma rede, descubra o IP local do computador e ajuste:

```env
WEB_ORIGIN=http://SEU-IP:5173
VITE_API_URL=http://SEU-IP:4000
```

Depois rode `npm run dev` e abra `http://SEU-IP:5173` no celular. Pelo menu do navegador, instale o app na tela inicial.

## Telegram

1. Crie um bot no Telegram usando `@BotFather`.
2. Coloque o token no `.env`:

```env
TELEGRAM_BOT_TOKEN=seu_token
ENABLE_TELEGRAM_POLLING=true
```

3. Inicie o projeto com `npm run dev`.
4. No Telegram, envie para o bot:

```text
/start seu-email@exemplo.com
```

Depois envie comandos como:

```text
Me lembre sexta as 8h de levar minha mae ao medico
Gastei 30 reais com lanche
Marque estudo todo dia as 19h
```

## APIs principais

- `POST /auth/register` bloqueado, sem cadastro publico
- `POST /auth/login`
- `GET/POST /users` somente usuario master
- `GET /dashboard`
- `POST /commands`
- `GET/POST/PATCH/DELETE /tasks`
- `GET/POST /expenses`
- `GET/POST/PATCH /health-records`
- `GET/POST /fitness`
- `GET/POST/PATCH /studies`
- `GET/POST /documents`
- `GET /notifications`

Todas as rotas de negocio usam `Authorization: Bearer <token>`.

## Banco de dados

O schema Prisma fica em:

```text
apps/api/prisma/schema.prisma
```

Ele contem usuarios, tarefas, despesas, saude, fitness, estudos, documentos e notificacoes.

## WhatsApp no futuro

A arquitetura ja separa interpretacao de comando em `apps/api/src/services/commandExecutor.ts`. Para WhatsApp, basta criar um canal de entrada que chame `executeCommand(userId, texto, "whatsapp")` e um canal de saida de notificacao equivalente ao Telegram.
