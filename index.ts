import { Telegraf } from "telegraf";
import "dotenv/config"

const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN) throw new Error("Что за инвалид забыл токен бота в .env запихать");

const bot = new Telegraf(BOT_TOKEN);

bot.on("text", (ctx) => {
  ctx.reply(`Ты написал: ${ctx.message.text}`);
});

bot.launch();
