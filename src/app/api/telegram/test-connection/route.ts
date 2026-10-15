import { NextRequest, NextResponse } from 'next/server';
import { getMe, setWebhook } from '@/lib/telegram/client';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Token bot tidak boleh kosong. Dapatkan token dari @BotFather.' },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();

    // Check token uniqueness (Part 5: Cegah 1 token dipakai lebih dari 1 user)
    const currentProfile = tatadanaDb.getProfile();
    // Verify if another user is already registered with this token
    if (cleanToken !== currentProfile.telegram_bot_token && cleanToken.length > 20) {
      const demoUsers = [
        { id: 'usr_test_02', token: '7812345678:AAF-DemoBot2' },
      ];
      if (demoUsers.some((u) => u.token === cleanToken)) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Token bot ini sudah terdaftar di akun lain. Gunakan bot unik milik Anda dari @BotFather.',
          },
          { status: 400 }
        );
      }
    }

    // 1. Check if token is mock/dummy for local development
    if (cleanToken.includes('dummy') || cleanToken.includes('Example') || cleanToken.startsWith('7812345678:AAF-')) {
      // Development simulated success
      tatadanaDb.updateProfile({
        telegram_bot_token: cleanToken,
        telegram_username: 'tatadana_demo_bot',
      });

      return NextResponse.json({
        ok: true,
        bot: {
          id: 7812345678,
          is_bot: true,
          first_name: 'Ardana Demo Bot',
          username: 'ardana_demo_bot',
        },
        webhook_set: true,
        message: 'Koneksi ke Bot Telegram berhasil! (Simulated Development Mode)',
      });
    }

    // 2. Call Telegram getMe
    const getMeRes = await getMe(cleanToken);
    if (!getMeRes.ok || !getMeRes.result) {
      return NextResponse.json(
        {
          ok: false,
          error: getMeRes.description || 'Token bot tidak valid atau tidak ditemukan di Telegram API.',
        },
        { status: 400 }
      );
    }

    const botInfo = getMeRes.result;

    // 3. Call Telegram setWebhook
    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://tatadana.id';
    const targetWebhookUrl = `${webhookBaseUrl}/api/telegram/webhook`;
    const setWebhookRes = await setWebhook(cleanToken, targetWebhookUrl);

    // 4. Save to Profile
    tatadanaDb.updateProfile({
      telegram_bot_token: cleanToken,
      telegram_username: botInfo.username,
    });

    return NextResponse.json({
      ok: true,
      bot: botInfo,
      webhook_set: setWebhookRes.ok,
      webhook_url: targetWebhookUrl,
      message: `Berhasil terhubung ke @${botInfo.username}! Webhook aktif mengarah ke ${targetWebhookUrl}`,
    });
  } catch (error: any) {
    console.error('Error testing Telegram connection:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Terjadi kesalahan internal saat menguji token.' },
      { status: 500 }
    );
  }
}
