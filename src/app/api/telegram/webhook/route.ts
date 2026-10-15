import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate } from '@/types';
import { TelegramBotHandler } from '@/lib/telegram/bot-handler';

export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();

    if (!update || typeof update.update_id === 'undefined') {
      return NextResponse.json({ error: 'Invalid telegram update payload' }, { status: 400 });
    }

    const result = await TelegramBotHandler.handleUpdate(update);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error: any) {
    console.error('Telegram webhook handling error:', error);
    // Return 200 OK to Telegram so it doesn't repeatedly retry on parse bugs
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Ardana Telegram Webhook Endpoint',
    status: 'online',
    time: new Date().toISOString(),
  });
}
