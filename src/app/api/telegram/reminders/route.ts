import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';
import { TelegramFormatter } from '@/lib/telegram/formatter';
import { sendTelegramMessage } from '@/lib/telegram/client';
import { getWIBISOString } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const profile = tatadanaDb.getProfile();
    const reminders = tatadanaDb.getReminders();

    if (!reminders.is_enabled) {
      return NextResponse.json({
        success: false,
        sent: false,
        message: 'Reminder harian sedang dinonaktifkan oleh pengguna.',
      });
    }

    const botToken = profile.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || '';
    const chatId = profile.telegram_user_id || 123456789;
    const reminderText = TelegramFormatter.formatDailyReminder();

    const ok = await sendTelegramMessage(botToken, chatId, reminderText);

    const nowWIB = getWIBISOString();
    tatadanaDb.updateReminders({
      last_sent_at: nowWIB,
    });

    return NextResponse.json({
      success: true,
      sent: ok,
      message: 'Pesan reminder harian berhasil dikirim ke Telegram pengguna!',
      last_sent_at: nowWIB,
      reminder_text: reminderText,
    });
  } catch (error: any) {
    console.error('Error dispatching daily reminder:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const reminders = tatadanaDb.getReminders();
  return NextResponse.json({
    status: 'online',
    reminders,
  });
}
