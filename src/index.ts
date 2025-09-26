import { Telegraf, Markup } from "telegraf";
import "dotenv/config"

type ENV_CONFIG = {
  BOT_TOKEN: string,
  DANGEON_MASTER_ID: string,
  PROP_CHANNEL: string, // канал для оценки постов админами
}

function mustInitEnvConfig(): ENV_CONFIG {
  const BOT_TOKEN = process.env.BOT_TOKEN
  if (!BOT_TOKEN) throw new Error("Что за инвалид забыл токен бота в .env запихать");

  const DANGEON_MASTER_ID = process.env.DANGEON_MASTER_ID;
  if (!DANGEON_MASTER_ID) throw new Error("Что за инвалид забыл DANGEON_MASTER_ID .env запихать");

  const PROP_CHANNEL = process.env.PROP_CHANNEL;
  if (!PROP_CHANNEL) throw new Error("Что за инвалид забыл PROP_CHANNEL .env запихать");

  const config: ENV_CONFIG = {
    BOT_TOKEN: BOT_TOKEN,
    DANGEON_MASTER_ID: DANGEON_MASTER_ID,
    PROP_CHANNEL: PROP_CHANNEL,
  };
  return config;
}

const config = mustInitEnvConfig();
const bot = new Telegraf(config.BOT_TOKEN);

/**
 * action_string example: `${type}_${lCount}_${dCount}`
 * вместо ${type} можно передать -
 */
function updateButtons(msgId: number | string, action_string: string) {
  // ShitCode start
  const parsed = action_string.split("_");
  const btn = parsed[0]
  const lCountStr = parsed[1]; // like counts
  const dCountStr = parsed[2]; // dislike counts
  
  if (parsed.length != 3 || !btn || !lCountStr || !dCountStr) {
    throw new Error(`Некорректные данные кнопки: ${action_string}`);
  }

  // MegaShitCode start
  let lCount = 0;
  let dCount = 0;

  if (btn != "-") {
    if (btn == "like") {
      lCount = Number(lCountStr)+1;
      dCount = Number(dCountStr);
    } else if (btn == "dis") {
      dCount = Number(dCountStr)+1;
      lCount = Number(lCountStr);
    }
  }
  // MegaShitCode end
  // ShitCode end

  const updatedMarkup = Markup.inlineKeyboard([
    [
      Markup.button.callback(`👍 ${lCount}`, `btn:${msgId}_like_${lCount}_${dCount}`),
      Markup.button.callback(`👎 ${dCount}`, `btn:${msgId}_dis_${lCount}_${dCount}`)
    ]
  ]).reply_markup;

  return updatedMarkup;
}

bot.on('message', async (ctx) => {
  if (!ctx.message) return;

  const senderUsername = ctx.from.username
  const msgText = ctx.text;
  const textWithData = msgText + `\n\nОтправлено: @${senderUsername}`

  try {
    const copied = await ctx.telegram.copyMessage(
      config.PROP_CHANNEL,
      ctx.chat.id,
      ctx.message.message_id,
    );
    
    const msgId = copied.message_id;

    await ctx.telegram.editMessageText(
      config.PROP_CHANNEL,
      msgId,
      undefined,
      textWithData
    );

    const keyboard = updateButtons(msgId, `-_0_0`);
    await ctx.telegram.editMessageReplyMarkup(config.PROP_CHANNEL, msgId, undefined, keyboard);

  } catch (err) {
    console.log(err);
  }
});

// ловит строку типа: btn:${msgId}_${type}_${lCount}_${dCount}
const regex = /^btn:(\d+)_(.+)$/;
bot.action(regex, async (ctx) => {
  const msgId = ctx.match[1];
  const action_string = ctx.match[2]
  if (!msgId || !action_string) throw new Error(`Некорректные данные кнопки: ${ctx.match[0]}`);

  const keyboard = updateButtons(msgId, action_string);

  await ctx.telegram.editMessageReplyMarkup(
    config.PROP_CHANNEL,
    Number(msgId),
    undefined,
    keyboard
  );
});

bot.launch();