import { Bot } from "grammy";
import { env } from "../env.js";
import { prisma } from "../prisma.js";
import { buildTodayAgendaMessage } from "./agenda.js";
import { executeCommand } from "./commandExecutor.js";

let bot: Bot | undefined;

export function getTelegramBot() {
  if (!env.TELEGRAM_BOT_TOKEN) return undefined;
  if (!bot) {
    bot = new Bot(env.TELEGRAM_BOT_TOKEN);
  }
  return bot;
}

export async function startTelegram() {
  const telegram = getTelegramBot();
  if (!telegram || !env.ENABLE_TELEGRAM_POLLING) return;

  telegram.command("start", async (context) => {
    const chatId = String(context.chat.id);
    const email = context.match?.trim();

    if (email) {
      const user = await prisma.user.update({
        where: { email },
        data: { telegramChatId: chatId }
      }).catch(() => undefined);

      if (user) {
        await context.reply("Telegram conectado ao seu assistente pessoal. Use /hoje para ver sua agenda do dia.");
        return;
      }
    }

    await context.reply(
      "Envie /start seu@email.com para conectar. Depois disso, mande comandos como: Me lembre amanha as 8h de fazer exame."
    );
  });

  telegram.command(["hoje", "agenda"], async (context) => {
    const user = await prisma.user.findFirst({
      where: { telegramChatId: String(context.chat.id) }
    });

    if (!user) {
      await context.reply("Conecte sua conta primeiro com /start seu@email.com.");
      return;
    }

    await context.reply(await buildTodayAgendaMessage(user.id, user.timezone));
  });

  telegram.command("ajuda", async (context) => {
    await context.reply(
      [
        "Comandos:",
        "/hoje - mostra tarefas e compromissos de hoje",
        "/agenda - igual ao /hoje",
        "Voce tambem pode escrever frases naturais:",
        "Me lembre amanha as 8h de levar minha mae ao medico",
        "Gastei 30 reais com lanche",
        "Marque estudo todo dia as 19h"
      ].join("\n")
    );
  });

  telegram.on("message:text", async (context) => {
    const text = context.message.text.trim();
    if (!text || text.startsWith("/")) return;

    const user = await prisma.user.findFirst({
      where: { telegramChatId: String(context.chat.id) }
    });

    if (!user) {
      await context.reply("Conecte sua conta primeiro com /start seu@email.com.");
      return;
    }

    const result = await executeCommand(user.id, text, "telegram");
    await context.reply(`Registrado: ${result.parsed.intent} - ${text}`);
  });

  void telegram.start({ drop_pending_updates: true });
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const telegram = getTelegramBot();
  if (!telegram) return false;
  await telegram.api.sendMessage(chatId, text);
  return true;
}
