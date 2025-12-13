/**
 * Telegram Bot Polling Script
 * Локальное тестирование бота @LavrentevViktor_bot
 * 
 * Запуск: npx ts-node scripts/telegram-polling.ts
 */

const TELEGRAM_TOKEN = '8218510451:AAHn5CkHeDMwqi1B9MjsOQTzJ08r3GTM0QM';
const VICTOR_ID = '6143852752';
const API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; last_name?: string; username?: string };
    chat: { id: number; type: string };
    date: number;
    text?: string;
    contact?: { phone_number: string; first_name: string; last_name?: string };
    location?: { latitude: number; longitude: number };
  };
}

async function sendMessage(chatId: number, text: string, parseMode?: string): Promise<void> {
  const body: any = { chat_id: chatId, text };
  if (parseMode) body.parse_mode = parseMode;
  
  await fetch(`${API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function handleMessage(message: TelegramUpdate['message']): Promise<void> {
  if (!message) return;
  
  const chatId = message.chat.id;
  const text = message.text || '';
  const from = message.from;
  
  console.log(`📨 Сообщение от ${from.first_name}: ${text}`);

  // Команды
  if (text.startsWith('/start')) {
    await sendMessage(chatId, `🌟 *Добро пожаловать, ${from.first_name}!*

Я ваш персональный ассистент @LavrentevViktor_bot.

*Что я умею:*
📝 Записывать заметки и идеи
👥 Сохранять контакты
📅 Фиксировать встречи
✅ Создавать задачи
🔄 Синхронизировать с iCloud

*Команды:*
/meeting - записать встречу
/task - создать задачу
/idea - записать идею
/contacts - список контактов
/sync - синхронизация iCloud
/stats - статистика

Просто пишите мне любые заметки - я всё сохраню! 📱`, 'Markdown');
    return;
  }

  if (text.startsWith('/help')) {
    await sendMessage(chatId, `📚 *Справка по командам*

*Основные команды:*
/meeting [описание] - записать встречу
/task [описание] - создать задачу  
/idea [описание] - записать идею

*Контакты:*
/contacts - показать последние контакты
/sync - синхронизировать с iCloud

*Статистика:*
/stats - общая статистика

*Примеры:*
\`/meeting Кофе с Иваном в 15:00\`
\`/task Позвонить поставщику\`
\`/idea Новый формат презентации\``, 'Markdown');
    return;
  }

  if (text.startsWith('/meeting') || text.startsWith('/встреча')) {
    const description = text.replace(/^\/(meeting|встреча)\s*/i, '');
    if (!description) {
      await sendMessage(chatId, '📅 Опишите встречу:\n/meeting [с кем, когда, где]');
    } else {
      console.log(`💾 Сохраняю встречу: ${description}`);
      await sendMessage(chatId, `📅 Встреча записана!\n\n"${description}"`);
    }
    return;
  }

  if (text.startsWith('/task') || text.startsWith('/задача')) {
    const description = text.replace(/^\/(task|задача)\s*/i, '');
    if (!description) {
      await sendMessage(chatId, '✅ Опишите задачу:\n/task [что нужно сделать]');
    } else {
      console.log(`💾 Сохраняю задачу: ${description}`);
      await sendMessage(chatId, `✅ Задача создана!\n\n"${description}"`);
    }
    return;
  }

  if (text.startsWith('/idea') || text.startsWith('/идея')) {
    const description = text.replace(/^\/(idea|идея)\s*/i, '');
    if (!description) {
      await sendMessage(chatId, '💡 Опишите идею:\n/idea [ваша идея]');
    } else {
      console.log(`💾 Сохраняю идею: ${description}`);
      await sendMessage(chatId, `💡 Идея записана!\n\n"${description}"`);
    }
    return;
  }

  if (text.startsWith('/stats') || text.startsWith('/статистика')) {
    await sendMessage(chatId, `📊 *Статистика системы*

👥 Контактов: 0
📝 Наблюдений: 0
🔄 Последняя синхронизация: -

*Виктор Лаврентьев*
📧 info@97v.ru
🔑 PRIMARY_ADMIN`, 'Markdown');
    return;
  }

  if (text.startsWith('/sync') || text.startsWith('/синхр')) {
    await sendMessage(chatId, '🔄 Начинаю синхронизацию с iCloud...');
    await new Promise(r => setTimeout(r, 1500));
    await sendMessage(chatId, '✅ Синхронизация завершена!\n\n📱 Apple iCloud: подключён\n👥 Контактов: 0');
    return;
  }

  if (text.startsWith('/contacts') || text.startsWith('/контакты')) {
    await sendMessage(chatId, '📱 У вас пока нет сохранённых контактов.\n\nОтправьте мне контакт из телефонной книги - я его сохраню!');
    return;
  }

  // Обработка контакта
  if (message.contact) {
    const contact = message.contact;
    console.log(`📱 Получен контакт: ${contact.first_name} ${contact.last_name || ''}, ${contact.phone_number}`);
    await sendMessage(chatId, `✅ Контакт сохранён!\n\n👤 ${contact.first_name} ${contact.last_name || ''}\n📞 ${contact.phone_number}`);
    return;
  }

  // Обработка локации
  if (message.location) {
    const loc = message.location;
    console.log(`📍 Получена локация: ${loc.latitude}, ${loc.longitude}`);
    await sendMessage(chatId, `📍 Локация записана!\n\nКоординаты: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`);
    return;
  }

  // Обычное сообщение - сохраняем как заметку
  if (text && !text.startsWith('/')) {
    console.log(`📝 Сохраняю заметку: ${text}`);
    await sendMessage(chatId, `✅ Записано!`);
    return;
  }

  // Неизвестная команда
  if (text.startsWith('/')) {
    await sendMessage(chatId, '❓ Неизвестная команда. Используйте /help');
  }
}

async function getUpdates(offset?: number): Promise<TelegramUpdate[]> {
  const url = new URL(`${API_URL}/getUpdates`);
  if (offset) url.searchParams.set('offset', String(offset));
  url.searchParams.set('timeout', '30');
  
  const response = await fetch(url.toString());
  const data = await response.json() as { ok: boolean; result: TelegramUpdate[] };
  
  return data.ok ? data.result : [];
}

async function main(): Promise<void> {
  console.log('');
  console.log('🤖 ================================');
  console.log('   @LavrentevViktor_bot запущен!');
  console.log('   Владелец: Виктор Лаврентьев');
  console.log('================================');
  console.log('');
  console.log('📱 Откройте Telegram и напишите боту:');
  console.log('   https://t.me/LavrentevViktor_bot');
  console.log('');
  console.log('⏳ Ожидаю сообщения... (Ctrl+C для выхода)');
  console.log('');

  let offset: number | undefined;

  while (true) {
    try {
      const updates = await getUpdates(offset);
      
      for (const update of updates) {
        offset = update.update_id + 1;
        
        if (update.message) {
          await handleMessage(update.message);
        }
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

main().catch(console.error);
