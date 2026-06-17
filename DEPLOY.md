# Deploy para usar em qualquer lugar

Para o celular funcionar fora do Wi-Fi de casa, o sistema precisa ficar publicado em uma hospedagem com HTTPS e banco online.

## Arquitetura de producao

- Frontend React/PWA publicado como site HTTPS.
- API Node/Express publicada como web service 24h.
- PostgreSQL hospedado.
- Telegram Bot conectado para notificacoes confiaveis no celular.
- Agendador interno da API rodando a cada minuto para lembretes por horario.

## Render usando `render.yaml`

O arquivo `render.yaml` na raiz cria:

- `assistente-vida-api`
- `assistente-vida-web`
- `assistente-vida-db`

Passos:

1. Envie o projeto para um repositorio GitHub/GitLab.
2. No Render, crie um Blueprint apontando para o repositorio.
3. Preencha as variaveis que aparecem como `sync: false`.

Variaveis da API:

```env
WEB_ORIGIN=https://URL-DO-FRONTEND
MASTER_USER_PASSWORD=sua-senha-master
TELEGRAM_BOT_TOKEN=token-do-bot
API_PUBLIC_URL=https://URL-DA-API
```

Variaveis do frontend:

```env
VITE_API_URL=https://URL-DA-API
```

Depois que os servicos forem criados, copie as URLs finais do Render:

- Coloque a URL do frontend em `WEB_ORIGIN` na API.
- Coloque a URL da API em `VITE_API_URL` no frontend.
- Redeploy os dois servicos.

## Telegram

1. Crie o bot no `@BotFather`.
2. Coloque o token em `TELEGRAM_BOT_TOKEN`.
3. Deixe `ENABLE_TELEGRAM_POLLING=true`.
4. No Telegram, envie:

```text
/start seu-email@exemplo.com
```

Comandos uteis:

```text
/hoje
/agenda
/ajuda
```

Frases naturais:

```text
Me lembre amanha as 8h de levar minha mae ao medico
Me lembre sexta de pagar a conta
Marque estudo todo dia as 19h
Gastei 30 reais com lanche
```

## Como os lembretes funcionam

- Se voce cria uma tarefa com horario, a API envia lembrete naquele horario.
- Todo dia, no horario configurado no painel `Alertas`, a API envia a agenda do dia.
- O Telegram funciona mesmo com o app fechado.
- Notificacoes web dependem do navegador e sao menos confiaveis em segundo plano; use Telegram para lembretes importantes.

## Instalar no celular

Abra a URL do frontend no celular:

```text
https://URL-DO-FRONTEND
```

Depois instale:

- Android Chrome: menu `...` > `Adicionar a tela inicial`.
- iPhone Safari: compartilhar > `Adicionar a Tela de Inicio`.

## Importante

Para lembretes confiaveis, use uma hospedagem que nao durma. Se a API ficar suspensa, o agendador nao roda no minuto certo.
