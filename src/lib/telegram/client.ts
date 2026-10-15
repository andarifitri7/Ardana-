/**
 * Telegram Bot API Client
 */

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface TelegramGetMeResponse {
  ok: boolean;
  result?: TelegramUser;
  description?: string;
  error_code?: number;
}

export interface TelegramSetWebhookResponse {
  ok: boolean;
  result?: boolean;
  description?: string;
  error_code?: number;
}

export async function getMe(botToken: string): Promise<TelegramGetMeResponse> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      ok: false,
      description: error.message || 'Koneksi ke Telegram API gagal (Network Error)',
    };
  }
}

export async function setWebhook(botToken: string, webhookUrl: string): Promise<TelegramSetWebhookResponse> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: false,
      }),
    });
    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      ok: false,
      description: error.message || 'Gagal mendaftarkan webhook ke Telegram API',
    };
  }
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: number | string,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  try {
    // If running in development without valid bot token, log and return true
    if (!botToken || botToken.includes('dummy') || botToken.includes('Example')) {
      console.log(`[Telegram Mock Sent to ${chatId}]:\n${text}`);
      return true;
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
      }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}
