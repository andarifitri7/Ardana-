import { NextRequest, NextResponse } from 'next/server';
import { TelegramBotHandler } from '@/lib/telegram/bot-handler';
import { TelegramUpdate } from '@/types';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = 'text',
      text = '',
      caption = '',
      voiceDuration = 5,
      walletId,
      pendingTransaction,
    } = body;

    const userId = body.userId || req.cookies.get('ardana_user_id')?.value || tatadanaDb.getActiveUserId();
    const profile = tatadanaDb.getProfile(userId);
    const fakeUpdateId = Date.now();

    // Direct wallet selection callback from simulator
    if (type === 'wallet_select' && walletId && pendingTransaction) {
      const chatId = profile.telegram_user_id || 123456789;
      const botToken = profile.telegram_bot_token || '';

      const result = await TelegramBotHandler.handleWalletSelection(
        walletId,
        pendingTransaction,
        profile,
        chatId,
        botToken,
        fakeUpdateId
      );

      return NextResponse.json({
        ok: true,
        result,
      });
    }

    let mockUpdate: TelegramUpdate;

    if (type === 'photo') {
      mockUpdate = {
        update_id: fakeUpdateId,
        message: {
          message_id: 101,
          from: { id: profile.telegram_user_id || 123456789, is_bot: false, first_name: profile.full_name },
          chat: { id: profile.telegram_user_id || 123456789, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          caption: caption || 'Struk Superindo',
          photo: [
            {
              file_id: 'ph_demo_large',
              file_unique_id: 'ph_u_1',
              file_size: 45000,
              width: 800,
              height: 1200,
            },
          ],
        },
      };
    } else if (type === 'voice') {
      mockUpdate = {
        update_id: fakeUpdateId,
        message: {
          message_id: 102,
          from: { id: profile.telegram_user_id || 123456789, is_bot: false, first_name: profile.full_name },
          chat: { id: profile.telegram_user_id || 123456789, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          voice: {
            file_id: 'vc_demo_01',
            file_unique_id: 'vc_u_1',
            duration: voiceDuration,
          },
        },
      };
    } else {
      mockUpdate = {
        update_id: fakeUpdateId,
        message: {
          message_id: 103,
          from: { id: profile.telegram_user_id || 123456789, is_bot: false, first_name: profile.full_name },
          chat: { id: profile.telegram_user_id || 123456789, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          text: text || 'beli bakso 15rb',
        },
      };
    }

    const result = await TelegramBotHandler.handleUpdate(mockUpdate, userId, walletId);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error: any) {
    console.error('Simulator error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
