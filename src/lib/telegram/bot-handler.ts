import { TelegramUpdate, Transaction, Profile, Wallet } from '@/types';
import { tatadanaDb } from '@/lib/store/mock-db';
import { MultiProviderAIService } from '@/lib/ai/multi-provider';
import { TelegramFormatter } from './formatter';
import { sendTelegramMessage } from './client';
import { formatRupiah, formatWIBDate } from '@/lib/utils';
import { SAVING_PLACES, getSavingPlaceById } from '@/lib/constants/saving-places';

export const NO_WALLET_EXACT_MESSAGE =
  'Sepertinya kamu belum punya dompet yang terdaftar. Yuk, tambahkan dompet terlebih dahulu melalui dashboard agar transaksi kamu bisa dicatat dengan benar. 💰';

export interface PendingTransaction {
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  description: string;
  category_id?: string;
  category_name?: string;
  source?: 'web' | 'telegram_text' | 'telegram_receipt' | 'telegram_voice';
  items?: any[];
  receipt_image_url?: string;
  voice_transcript?: string;
  destination_wallet_id?: string;
  timestamp: number;
}

export interface BotProcessResult {
  updateId: number;
  handled: boolean;
  replyText: string;
  sourceType: 'text' | 'photo' | 'voice' | 'command';
  advisorMessage?: string;
  createdTransaction?: Transaction;
  promptType?: 'wallet_selection_expense' | 'wallet_selection_income' | 'no_wallet' | 'normal';
  pendingTransaction?: PendingTransaction;
  walletOptions?: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    is_default: boolean;
    color: string;
  }>;
}

// In-memory store for pending transactions awaiting user wallet selection
export const pendingTransactionsByUser = new Map<string, PendingTransaction>();

export function getPendingTransaction(userId: string): PendingTransaction | undefined {
  return pendingTransactionsByUser.get(userId);
}

export function clearPendingTransaction(userId: string): void {
  pendingTransactionsByUser.delete(userId);
}

export function setPendingTransaction(userId: string, tx: PendingTransaction): void {
  pendingTransactionsByUser.set(userId, tx);
}

export class TelegramBotHandler {
  /**
   * Process incoming Telegram webhook update or simulator message
   */
  static async handleUpdate(
    update: TelegramUpdate,
    targetUserId?: string,
    explicitWalletId?: string
  ): Promise<BotProcessResult> {
    const updateId = update.update_id;

    // 1. IDEMPOTENCY CHECK
    if (tatadanaDb.isUpdateProcessed(updateId)) {
      console.log(`[Telegram Bot] Update ${updateId} already processed (idempotent skip).`);
      return {
        updateId,
        handled: false,
        replyText: 'Update already processed.',
        sourceType: 'command',
      };
    }
    tatadanaDb.markUpdateProcessed(updateId);

    const sender = update.message?.from || update.callback_query?.from;
    const senderTelegramId = sender?.id;
    const rawText = (update.message?.text || update.message?.caption || '').trim();
    const defaultChatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id || senderTelegramId || 123456789;

    // Resolve user profile: First try targetUserId, then senderTelegramId
    let userAuthRecord = targetUserId ? tatadanaDb.getUserById(targetUserId) : undefined;
    if (!userAuthRecord && senderTelegramId) {
      userAuthRecord = tatadanaDb.getUserByTelegramId(senderTelegramId);
    }

    // Check account linking command (/connect <userId_or_email> or /start link_<userId_or_email>)
    const connectMatch = rawText.match(/^\/(?:connect|link)(?:\s+|=)(\S+)/i) || rawText.match(/^\/start\s+(?:link_)?(\S+)/i);

    if (connectMatch) {
      const candidateParam = connectMatch[1].trim();
      const candidateUser = tatadanaDb.getUserById(candidateParam) || tatadanaDb.getUserByEmail(candidateParam);
      if (!candidateUser) {
        const reply = `❌ Akun "${candidateParam}" tidak ditemukan di database Ardana. Pastikan Anda memasukkan User ID atau alamat email terdaftar yang benar dari menu Pengaturan di web dashboard Ardana.`;
        await sendTelegramMessage(process.env.TELEGRAM_BOT_TOKEN || '', defaultChatId, reply);
        return {
          updateId,
          handled: true,
          replyText: reply,
          sourceType: 'command',
        };
      }

      // Requirement 5: Enforce strict 1-to-1 mapping by unlinking previous user if any
      if (senderTelegramId) {
        tatadanaDb.getUserRecords().forEach((u) => {
          if (u.id !== candidateUser.id && Number(u.profile?.telegram_user_id) === Number(senderTelegramId)) {
            u.profile.telegram_user_id = null;
            u.profile.telegram_username = null;
          }
        });
      }

      // Link Telegram account to target candidate user
      tatadanaDb.updateProfile({
        telegram_user_id: senderTelegramId || candidateUser.profile.telegram_user_id,
        telegram_username: sender?.username || candidateUser.profile.telegram_username || '',
      }, candidateUser.id);

      userAuthRecord = tatadanaDb.getUserById(candidateUser.id);
      const botToken = userAuthRecord?.profile.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || '';

      let reply = `✅ *Akun Ardana Anda Berhasil Terhubung!*\n\n` +
        `👤 Nama: *${userAuthRecord?.profile.full_name}*\n` +
        `📧 Email: *${userAuthRecord?.profile.email}*\n` +
        `🆔 Telegram ID: \`${senderTelegramId || '-'}\`\n\n`;

      if (userAuthRecord?.profile.account_status !== 'approved') {
        if (userAuthRecord?.profile.account_status === 'pending_payment') {
          reply += `⚠️ *Status: Menunggu Pembayaran Paket*\nSilakan selesaikan pemilihan paket dan pembayaran di web dashboard Ardana terlebih dahulu sebelum akun dapat digunakan.`;
        } else {
          reply += `⏳ *Status: Menunggu Persetujuan Admin*\nAkun Anda saat ini sedang ditinjau oleh administrator. Anda akan dapat mencatat transaksi keuangan secara instan via chat setelah akun disetujui.`;
        }
      } else {
        reply += `Sekarang Anda dapat langsung mencatat transaksi keuangan dengan mengetik misalnya:\n• \`beli makan siang 35rb\`\n• \`gajian 5jt\`\natau kirim foto struk belanjaan Anda! 🚀`;
      }

      await sendTelegramMessage(botToken, defaultChatId, reply);
      return {
        updateId,
        handled: true,
        replyText: reply,
        sourceType: 'command',
      };
    }

    // If targetUserId was provided but not found by ID (e.g. simulator fallback)
    if (!userAuthRecord && targetUserId) {
      userAuthRecord = tatadanaDb.getUserRecords().find(u => u.id === targetUserId);
    }

    // If still not found and no senderTelegramId, check active user for simulator/test fallback
    if (!userAuthRecord && !senderTelegramId) {
      const fallbackUserId = tatadanaDb.getActiveUserId();
      userAuthRecord = tatadanaDb.getUserById(fallbackUserId);
    }

    if (!userAuthRecord) {
      // Unlinked account: provide linking instructions
      const unlinkedReply = `👋 Halo! Akun Telegram Anda belum terhubung dengan akun TataDana / Ardana.\n\n` +
        `Untuk menghubungkan akun Anda, silakan ikuti langkah berikut:\n` +
        `1. Masuk ke dashboard web Ardana: http://localhost:3000\n` +
        `2. Buka menu *Pengaturan (Settings)* untuk melihat User ID Anda\n` +
        `3. Kirim pesan ke bot ini dengan format:\n` +
        `   \`/connect <USER_ID>\`\n\n` +
        `🆔 *Telegram ID Anda:* \`${senderTelegramId || 'Tidak terdeteksi'}\`\n\n` +
        `Setelah akun terhubung dan disetujui oleh admin, Anda dapat langsung mencatat transaksi keuangan di sini! 💡`;

      await sendTelegramMessage(process.env.TELEGRAM_BOT_TOKEN || '', defaultChatId, unlinkedReply);
      return {
        updateId,
        handled: true,
        replyText: unlinkedReply,
        sourceType: 'command',
      };
    }

    const profile = userAuthRecord.profile;
    const botToken = profile.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || '';
    const chatId = update.message?.chat.id || update.callback_query?.message?.chat.id || profile.telegram_user_id || defaultChatId;

    // Check account approval status
    if (profile.account_status && profile.account_status !== 'approved') {
      let unapprovedReply = '⏳ Mohon tunggu, akun kamu sedang menunggu persetujuan admin. Anda belum dapat mencatat transaksi keuangan hingga akun disetujui.';
      if (profile.account_status === 'pending_payment') {
        unapprovedReply = '⚠️ Akun kamu belum menyelesaikan pembayaran paket akun. Silakan login ke dashboard Ardana untuk memilih paket dan menyelesaikan pembayaran terlebih dahulu.';
      } else if (profile.account_status === 'pending_admin_approval' || profile.account_status === 'pending') {
        unapprovedReply = '⏳ Pembayaran kamu sedang/telah diverifikasi dan akun sedang menunggu persetujuan akhir administrator. Anda belum dapat mencatat transaksi keuangan hingga akun disetujui.';
      } else if (profile.account_status === 'pending_email_verification') {
        unapprovedReply = '⚠️ Akun kamu belum memverifikasi email. Silakan selesaikan verifikasi di portal Ardana terlebih dahulu.';
      } else if (profile.account_status === 'rejected') {
        unapprovedReply = `❌ Pendaftaran akun kamu belum disetujui oleh admin.${profile.admin_rejection_reason ? ` Alasan: ${profile.admin_rejection_reason}` : ''} Akses bot dinonaktifkan.`;
      }

      await sendTelegramMessage(botToken, chatId, unapprovedReply);
      return {
        updateId,
        handled: true,
        replyText: unapprovedReply,
        sourceType: 'command',
      };
    }

    // 2. CHECK CALLBACK QUERY (e.g. from inline Telegram buttons)
    if (update.callback_query) {
      const data = update.callback_query.data;
      const callbackChatId = update.callback_query.message?.chat?.id || chatId;

      if (data.startsWith('wallet_select:')) {
        const walletId = data.replace('wallet_select:', '').trim();
        const pending = pendingTransactionsByUser.get(profile.id);
        if (pending) {
          pendingTransactionsByUser.delete(profile.id);
          return await this.handleWalletSelection(walletId, pending, profile, callbackChatId, botToken, updateId);
        }
      }
    }

    const message = update.message;
    if (!message) {
      return {
        updateId,
        handled: false,
        replyText: 'No message in update.',
        sourceType: 'command',
      };
    }

    // 3. CHECK BOT COMMANDS
    const text = (message.text || message.caption || '').trim();
    if (text.startsWith('/')) {
      pendingTransactionsByUser.delete(profile.id);
      return await this.handleCommand(text.toLowerCase(), profile, chatId, botToken, updateId);
    }

    // 4. CHECK IF USER IS RESPONDING TO A PENDING TRANSACTION BY TEXT (Wallet name or index)
    const existingPending = pendingTransactionsByUser.get(profile.id);
    if (existingPending) {
      // Expire pending transactions after 15 minutes
      if (Date.now() - existingPending.timestamp > 15 * 60 * 1000) {
        pendingTransactionsByUser.delete(profile.id);
      } else {
        const activeWallets = tatadanaDb.getActiveWallets(profile.id);
        const lower = text.toLowerCase();

        // Check matching by index (1, 2, 3...)
        const numMatch = parseInt(lower, 10);
        let matchedWallet: Wallet | undefined;
        if (!isNaN(numMatch) && numMatch >= 1 && numMatch <= activeWallets.length) {
          matchedWallet = activeWallets[numMatch - 1];
        } else {
          matchedWallet = activeWallets.find(
            w =>
              lower === w.name.toLowerCase() ||
              lower === w.type.toLowerCase() ||
              (lower.length >= 3 && w.name.toLowerCase().includes(lower))
          );
        }

        if (matchedWallet) {
          pendingTransactionsByUser.delete(profile.id);
          return await this.handleWalletSelection(
            matchedWallet.id,
            existingPending,
            profile,
            chatId,
            botToken,
            updateId
          );
        }
      }
    }

    // 5. CHECK PHOTO RECEIPT INPUT
    if (message.photo && message.photo.length > 0) {
      return await this.handlePhotoReceipt(profile, message.photo, chatId, botToken, updateId, explicitWalletId);
    }

    // 6. CHECK VOICE NOTE / AUDIO INPUT
    if (message.voice || message.audio) {
      const voiceObj = message.voice || message.audio;
      return await this.handleVoiceNote(profile, voiceObj, chatId, botToken, updateId, explicitWalletId);
    }

    // 7. CHECK NATURAL LANGUAGE TEXT INPUT
    if (text) {
      return await this.handleNaturalText(profile, text, chatId, botToken, updateId, undefined, explicitWalletId);
    }

    return {
      updateId,
      handled: false,
      replyText: 'Tipe pesan tidak didukung.',
      sourceType: 'command',
    };
  }

  /**
   * Handle direct wallet selection from simulator or button callback
   */
  static async handleWalletSelection(
    walletId: string,
    pendingTx: PendingTransaction,
    profile: Profile,
    chatId: number,
    botToken: string,
    updateId: number
  ): Promise<BotProcessResult> {
    const activeWallets = tatadanaDb.getActiveWallets(profile.id);
    const chosenWallet = activeWallets.find(w => w.id === walletId);

    if (!chosenWallet) {
      const reply = `❌ Dompet yang dipilih tidak valid atau sudah tidak aktif. Silakan pilih dari dompet aktif Anda.`;
      await sendTelegramMessage(botToken, chatId, reply);
      return {
        updateId,
        handled: true,
        replyText: reply,
        sourceType: 'text',
        promptType: 'normal',
      };
    }

    // 1. PENGELUARAN: VALIDASI SALDO
    if (pendingTx.type === 'expense') {
      if (chosenWallet.balance < pendingTx.amount) {
        // REJECT TRANSACTION BUT PRESERVE PENDING TRANSACTION SO USER CAN SELECT ANOTHER WALLET!
        const reply =
          `❌ *Transaksi Pengeluaran Ditolak: Saldo Tidak Cukup!*\n\n` +
          `📝 Transaksi: *${pendingTx.description}*\n` +
          `💵 Dibutuhkan: *${formatRupiah(pendingTx.amount)}*\n` +
          `👛 Dompet: *${chosenWallet.name}*\n` +
          `💰 Saldo saat ini: *${formatRupiah(chosenWallet.balance)}* (Kurang ${formatRupiah(pendingTx.amount - chosenWallet.balance)}).\n\n` +
          `💡 *Pemberitahuan:* Transaksi tidak dicatat. Saldo dompet Anda tidak berubah. Silakan pilih dompet lain yang saldonya mencukupi atau isi ulang saldo dompet terlebih dahulu.`;

        // Keep pending transaction active so user can immediately click or select another wallet
        pendingTransactionsByUser.set(profile.id, pendingTx);

        const inlineKeyboard = {
          inline_keyboard: activeWallets.map(w => [
            { text: `👛 ${w.name} (${formatRupiah(w.balance)})`, callback_data: `wallet_select:${w.id}` }
          ])
        };

        await sendTelegramMessage(botToken, chatId, reply, inlineKeyboard);
        return {
          updateId,
          handled: true,
          replyText: reply,
          sourceType: 'text',
          promptType: 'wallet_selection_expense',
          pendingTransaction: pendingTx,
          walletOptions: activeWallets.map(w => ({
            id: w.id,
            name: w.name,
            type: w.type,
            balance: w.balance,
            is_default: w.is_default,
            color: w.color,
          })),
        };
      }

      // Saldo Cukup: Potong HANYA saldo dompet terpilih
      const newTx = tatadanaDb.addTransaction(
        {
          type: 'expense',
          amount: pendingTx.amount,
          wallet_id: chosenWallet.id,
          category_id: pendingTx.category_id,
          description: pendingTx.description,
          source: pendingTx.source || 'telegram_text',
          items: pendingTx.items,
          receipt_image_url: pendingTx.receipt_image_url,
          voice_transcript: pendingTx.voice_transcript,
        },
        profile.id
      );

      const updatedWallet = tatadanaDb.getWallets(profile.id).find(w => w.id === chosenWallet.id) || chosenWallet;

      let replyText =
        `✅ *PENGELUARAN BERHASIL DICATAT!*\n\n` +
        `📝 Transaksi : *${newTx.description}*\n` +
        `💵 Nominal : *${formatRupiah(newTx.amount)}*\n` +
        `👛 Dompet : *${updatedWallet.name}*\n` +
        `💰 Sisa Saldo : *${formatRupiah(updatedWallet.balance)}*\n\n` +
        `_Saldo dompet ${updatedWallet.name} telah dipotong. Saldo dompet lain tidak berubah._ ✨`;

      let advisorMsg: string | undefined;
      if (profile.subscription_tier === 'pro') {
        const budgets = tatadanaDb.getBudgets(profile.id);
        const budget = budgets.find(b => b.category_id === pendingTx.category_id);
        const advisorCheck = this.evaluateFinancialAdvisor(profile, pendingTx.category_name || 'Kategori', pendingTx.amount, budget);
        if (advisorCheck) {
          advisorMsg = advisorCheck;
          replyText += `\n\n${advisorCheck}`;
        }
      }

      await sendTelegramMessage(botToken, chatId, replyText);
      return {
        updateId,
        handled: true,
        replyText,
        sourceType: 'text',
        createdTransaction: newTx,
        advisorMessage: advisorMsg,
        promptType: 'normal',
      };
    }

    // 2. PEMASUKAN: KONFIRMASI & TAMBAH SALDO HANYA KE DOMPET TERPILIH
    if (pendingTx.type === 'income') {
      const newTx = tatadanaDb.addTransaction(
        {
          type: 'income',
          amount: pendingTx.amount,
          wallet_id: chosenWallet.id,
          category_id: pendingTx.category_id,
          description: pendingTx.description,
          source: pendingTx.source || 'telegram_text',
          voice_transcript: pendingTx.voice_transcript,
        },
        profile.id
      );

      const updatedWallet = tatadanaDb.getWallets(profile.id).find(w => w.id === chosenWallet.id) || chosenWallet;

      const replyText =
        `✅ *PEMASUKAN BERHASIL DIKONFIRMASI & DICATAT!*\n\n` +
        `📝 Transaksi : *${newTx.description}*\n` +
        `💵 Nominal : *${formatRupiah(newTx.amount)}*\n` +
        `📥 Masuk ke Dompet : *${updatedWallet.name}*\n` +
        `💰 Saldo Baru : *${formatRupiah(updatedWallet.balance)}*\n\n` +
        `_Saldo dompet ${updatedWallet.name} telah ditambahkan. Saldo dompet lain tidak berubah._ ✨`;

      await sendTelegramMessage(botToken, chatId, replyText);
      return {
        updateId,
        handled: true,
        replyText,
        sourceType: 'text',
        createdTransaction: newTx,
        promptType: 'normal',
      };
    }

    // Fallback for transfer
    const newTx = tatadanaDb.addTransaction(
      {
        type: 'transfer',
        amount: pendingTx.amount,
        wallet_id: chosenWallet.id,
        destination_wallet_id: pendingTx.destination_wallet_id,
        description: pendingTx.description,
        source: pendingTx.source || 'telegram_text',
      },
      profile.id
    );

    const reply = `✅ Transfer dana sebesar ${formatRupiah(pendingTx.amount)} berhasil dicatat dari dompet ${chosenWallet.name}.`;
    await sendTelegramMessage(botToken, chatId, reply);

    return {
      updateId,
      handled: true,
      replyText: reply,
      sourceType: 'text',
      createdTransaction: newTx,
      promptType: 'normal',
    };
  }

  /**
   * Handle Bot Commands (/saldo, /hari ini, /minggu ini, /bulan ini, /budget, /sheet, /bantuan)
   */
  private static async handleCommand(
    cmd: string,
    profile: Profile,
    chatId: number,
    botToken: string,
    updateId: number
  ): Promise<BotProcessResult> {
    let reply = '';
    const activeWallets = tatadanaDb.getActiveWallets(profile.id);

    if (cmd.startsWith('/start')) {
      reply = `👋 Halo! Selamat datang di *Ardana Bot* ✨\n_Catat keuangan semudah chat — langsung dari Telegram kamu!_\n\n✨ Akun Ardana kamu sudah terhubung aktif.\n\n💡 *Cara Mudah Mencatat:*\n• Ketik: \`beli nasi padang 25rb\`\n• Ketik: \`gajian 5jt\`\n• Ketik: \`kopi susu 18k\`\n• Atau kirim Voice Note / Foto struk belanjaanmu!\n\n📌 *Daftar Rekap Periode:*\n/harian atau /hari ini — Rekap transaksi hari ini\n/mingguan atau /minggu ini — Rekap 7 hari terakhir\n/bulanan atau /bulan ini — Ringkasan bulan berjalan\n/tahunan atau /tahun ini — Rekap lengkap tahun ini\n/saldo — Cek saldo semua dompet\n/budget — Status limit budget kategori\n/bantuan — Panduan lengkap`;
    } else if (cmd.startsWith('/saldo')) {
      if (activeWallets.length === 0) {
        await sendTelegramMessage(botToken, chatId, `${NO_WALLET_EXACT_MESSAGE}\n\n👉 [Buka Menu Dompet](/wallet)`);
        return {
          updateId,
          handled: true,
          replyText: NO_WALLET_EXACT_MESSAGE,
          sourceType: 'command',
          promptType: 'no_wallet',
        };
      }
      reply = TelegramFormatter.formatSaldoList(activeWallets);
    } else if (cmd.startsWith('/hari') || cmd.startsWith('/harian')) {
      const txs = tatadanaDb.getTransactions(profile.id);
      reply = TelegramFormatter.formatTodaySummary(txs);
    } else if (cmd.startsWith('/minggu') || cmd.startsWith('/mingguan')) {
      const txs = tatadanaDb.getTransactions(profile.id);
      reply = TelegramFormatter.formatWeeklySummary(txs);
    } else if (cmd.startsWith('/bulan') || cmd.startsWith('/bulanan')) {
      const txs = tatadanaDb.getTransactions(profile.id);
      reply = TelegramFormatter.formatMonthlySummary(txs);
    } else if (cmd.startsWith('/tahun') || cmd.startsWith('/tahunan')) {
      const txs = tatadanaDb.getTransactions(profile.id);
      reply = TelegramFormatter.formatYearlySummary(txs);
    } else if (cmd.startsWith('/budget')) {
      const budgets = tatadanaDb.getBudgets(profile.id);
      reply = TelegramFormatter.formatBudgetStatus(budgets);
    } else if (cmd.startsWith('/sheet') || cmd.startsWith('/laporan')) {
      reply = `📊 Link Spreadsheet & Laporan Keuangan Ardana:\n\n👉 Google Sheet: https://docs.google.com/spreadsheets/d/ardana-user-sheet-demo\n👉 Web Laporan: https://ardana.id/laporan\n\nKamu juga bisa mengekspor laporan on-demand ke format PDF dan Excel (.xlsx) dengan rincian item struk lengkap di dashboard!`;
    } else if (cmd.startsWith('/simpan') || cmd.startsWith('/nabung') || cmd.startsWith('/tempatuang')) {
      reply = TelegramFormatter.formatSavingPlacesMenu();
    } else {
      reply = TelegramFormatter.formatHelp();
    }

    await sendTelegramMessage(botToken, chatId, reply);
    return {
      updateId,
      handled: true,
      replyText: reply,
      sourceType: 'command',
      promptType: 'normal',
    };
  }

  /**
   * Handle Photo Receipt (OCR Vision)
   */
  private static async handlePhotoReceipt(
    profile: Profile,
    photoArray: any[],
    chatId: number,
    botToken: string,
    updateId: number,
    explicitWalletId?: string
  ): Promise<BotProcessResult> {
    // 1. Quota / Plan Enforcement: Starter cannot use receipt OCR
    if (profile.subscription_tier === 'starter') {
      const reply = TelegramFormatter.formatProUpgradeRequired();
      await sendTelegramMessage(botToken, chatId, reply);
      return {
        updateId,
        handled: true,
        replyText: reply,
        sourceType: 'photo',
      };
    }

    // 2. CHECK DYNAMIC WALLETS: If user has 0 wallets, show exact required message
    const activeWallets = tatadanaDb.getActiveWallets(profile.id);
    if (activeWallets.length === 0) {
      await sendTelegramMessage(botToken, chatId, `${NO_WALLET_EXACT_MESSAGE}\n\n👉 [Buka Menu Dompet](/wallet)`);
      return {
        updateId,
        handled: true,
        replyText: NO_WALLET_EXACT_MESSAGE,
        sourceType: 'photo',
        promptType: 'no_wallet',
      };
    }

    // Pro User: Call AI Vision OCR
    const largestPhoto = photoArray[photoArray.length - 1];
    const aiResult = await MultiProviderAIService.parseReceiptImage(largestPhoto.file_id);

    if (!aiResult.success || !aiResult.data) {
      const errorReply = `❌ Gagal memproses foto struk. Pastikan foto struk terlihat jelas, tidak buram, dan memuat total transaksi yang terbaca.`;
      await sendTelegramMessage(botToken, chatId, errorReply);
      return {
        updateId,
        handled: true,
        replyText: errorReply,
        sourceType: 'photo',
      };
    }

    const receipt = aiResult.data;
    const categories = tatadanaDb.getCategories(profile.id);
    const shoppingCat = categories.find(c => c.name.toLowerCase().includes('belanja')) || categories[0];

    const pendingTx: PendingTransaction = {
      type: 'expense',
      amount: receipt.total,
      description: `Struk di ${receipt.merchant}`,
      category_id: shoppingCat.id,
      category_name: shoppingCat.name,
      source: 'telegram_receipt',
      items: receipt.items,
      receipt_image_url: 'https://images.unsplash.com/photo-1554415707-9e4466bfe03b?w=400&auto=format&fit=crop&q=80',
      timestamp: Date.now(),
    };

    // If explicit wallet provided, execute right away
    if (explicitWalletId) {
      return await this.handleWalletSelection(explicitWalletId, pendingTx, profile, chatId, botToken, updateId);
    }

    // Otherwise, prompt for dynamic wallet selection with balances
    pendingTransactionsByUser.set(profile.id, pendingTx);

    const walletOptionsText = activeWallets
      .map((w, idx) => `${idx + 1}. *${w.name}* (Saldo: ${formatRupiah(w.balance)})`)
      .join('\n');

    const reply =
      `🧾 *FOTO STRUK BERHASIL DIPROSES!*\n\n` +
      `🏪 Toko : *${receipt.merchant}*\n` +
      `📋 Item : *${receipt.items.length} produk*\n` +
      `💵 Total : *${formatRupiah(receipt.total)}*\n\n` +
      `💸 *Pilih dompet yang digunakan untuk membayar transaksi ini:*\n` +
      `${walletOptionsText}\n\n` +
      `👇 _Silakan klik tombol dompet di bawah atau ketik nama dompet pilihanmu:_`;

    const inlineKeyboard = {
      inline_keyboard: activeWallets.map(w => [
        { text: `👛 ${w.name} (${formatRupiah(w.balance)})`, callback_data: `wallet_select:${w.id}` }
      ])
    };

    await sendTelegramMessage(botToken, chatId, reply, inlineKeyboard);

    return {
      updateId,
      handled: true,
      replyText: reply,
      sourceType: 'photo',
      promptType: 'wallet_selection_expense',
      pendingTransaction: pendingTx,
      walletOptions: activeWallets.map(w => ({
        id: w.id,
        name: w.name,
        type: w.type,
        balance: w.balance,
        is_default: w.is_default,
        color: w.color,
      })),
    };
  }

  /**
   * Handle Voice Note / Audio
   */
  private static async handleVoiceNote(
    profile: Profile,
    voiceObj: any,
    chatId: number,
    botToken: string,
    updateId: number,
    explicitWalletId?: string
  ): Promise<BotProcessResult> {
    const duration = voiceObj.duration || 5;

    // Check duration limit (max 60 seconds)
    if (duration > 60) {
      const reply = `⚠️ Durasi voice note ${duration} detik melebihi batas maksimal 60 detik. Mohon perpendek rekaman suara Anda ya.`;
      await sendTelegramMessage(botToken, chatId, reply);
      return {
        updateId,
        handled: true,
        replyText: reply,
        sourceType: 'voice',
      };
    }

    // Transcribe Audio
    const sttResult = await MultiProviderAIService.transcribeAudio(voiceObj.file_id || 'voice_file', duration);
    if (!sttResult.success || !sttResult.data) {
      const reply = `❌ Gagal mentranskrip pesan suara: ${sttResult.error || 'Suara kurang jelas'}.\nSilakan ulangi rekaman suara dengan lebih jelas atau ketik manual.`;
      await sendTelegramMessage(botToken, chatId, reply);
      return {
        updateId,
        handled: true,
        replyText: reply,
        sourceType: 'voice',
      };
    }

    const transcript = sttResult.data;

    // Run transcribed text through the natural text pipeline
    return await this.handleNaturalText(profile, transcript, chatId, botToken, updateId, transcript, explicitWalletId);
  }

  /**
   * Handle Natural Language Text (Expense, Income, Saving Places)
   */
  private static async handleNaturalText(
    profile: Profile,
    text: string,
    chatId: number,
    botToken: string,
    updateId: number,
    voiceTranscript?: string,
    explicitWalletId?: string
  ): Promise<BotProcessResult> {
    // 1. Quota Check for Starter
    if (profile.subscription_tier === 'starter' && profile.monthly_tx_count >= 50) {
      const quotaReply = TelegramFormatter.formatQuotaExceeded();
      await sendTelegramMessage(botToken, chatId, quotaReply);
      return {
        updateId,
        handled: true,
        replyText: quotaReply,
        sourceType: 'text',
      };
    }

    const lower = text.toLowerCase();

    // Check saving places inquiry
    if (
      lower.includes('tempat simpan') ||
      lower.includes('nabung di mana') ||
      lower.includes('simpan uang') ||
      lower.includes('tempat menabung') ||
      lower.includes('pilihan simpan') ||
      lower === 'simpan uang' ||
      lower === 'tempat menyimpan uang'
    ) {
      const reply = TelegramFormatter.formatSavingPlacesMenu();
      await sendTelegramMessage(botToken, chatId, reply);
      return { updateId, handled: true, replyText: reply, sourceType: 'text' };
    }

    // Check specific saving place queries
    if (lower.includes('rekening bank') || lower.includes('tabungan bank')) {
      const place = getSavingPlaceById('rekening_bank');
      if (place) {
        const reply = TelegramFormatter.formatSavingPlaceDetail(place);
        await sendTelegramMessage(botToken, chatId, reply);
        return { updateId, handled: true, replyText: reply, sourceType: 'text' };
      }
    } else if (lower.includes('e-wallet') || lower.includes('ewallet') || lower.includes('dompet digital')) {
      const place = getSavingPlaceById('ewallet');
      if (place) {
        const reply = TelegramFormatter.formatSavingPlaceDetail(place);
        await sendTelegramMessage(botToken, chatId, reply);
        return { updateId, handled: true, replyText: reply, sourceType: 'text' };
      }
    } else if (lower.includes('deposito')) {
      const place = getSavingPlaceById('deposito');
      if (place) {
        const reply = TelegramFormatter.formatSavingPlaceDetail(place);
        await sendTelegramMessage(botToken, chatId, reply);
        return { updateId, handled: true, replyText: reply, sourceType: 'text' };
      }
    } else if (lower.includes('rdpu') || lower.includes('pasar uang') || lower.includes('reksa dana')) {
      const place = getSavingPlaceById('rdpu');
      if (place) {
        const reply = TelegramFormatter.formatSavingPlaceDetail(place);
        await sendTelegramMessage(botToken, chatId, reply);
        return { updateId, handled: true, replyText: reply, sourceType: 'text' };
      }
    } else if (lower.includes('tempat lainnya') || lower.includes('emas') || lower.includes('kas fisik') || lower.includes('logam mulia')) {
      const place = getSavingPlaceById('tempat_lainnya');
      if (place) {
        const reply = TelegramFormatter.formatSavingPlaceDetail(place);
        await sendTelegramMessage(botToken, chatId, reply);
        return { updateId, handled: true, replyText: reply, sourceType: 'text' };
      }
    }

    // Save preference command
    if (lower.startsWith('simpan preferensi')) {
      const prefKey = lower.replace('simpan preferensi', '').trim();
      const matched = SAVING_PLACES.find(p => p.id === prefKey || p.name.toLowerCase().includes(prefKey));
      if (matched) {
        tatadanaDb.setSavingPreference(matched.id, profile.id);
        const reply = `✅ Preferensi tempat simpan uang Anda berhasil disimpan ke profil: *${matched.name}*!\nAnda dapat melihat atau mengubah preferensi ini kapan saja di menu Settings.`;
        await sendTelegramMessage(botToken, chatId, reply);
        return { updateId, handled: true, replyText: reply, sourceType: 'text' };
      }
    }

    // 2. CHECK DYNAMIC WALLETS: If user has 0 wallets, return the exact required string!
    const activeWallets = tatadanaDb.getActiveWallets(profile.id);
    if (activeWallets.length === 0) {
      await sendTelegramMessage(botToken, chatId, `${NO_WALLET_EXACT_MESSAGE}\n\n👉 [Buka Menu Dompet](/wallet)`);
      return {
        updateId,
        handled: true,
        replyText: NO_WALLET_EXACT_MESSAGE,
        sourceType: voiceTranscript ? 'voice' : 'text',
        promptType: 'no_wallet',
      };
    }

    // 3. Parse text with AI / NLP
    const parseResult = await MultiProviderAIService.parseTransactionText(text);

    if (!parseResult.success || !parseResult.data || parseResult.data.is_ambiguous) {
      const errorMsg = `❌ Ardana belum bisa memahami input Anda.\n\n${parseResult.error || 'Nominal atau format tidak jelas.'}\n\n💡 Contoh format yang benar:\n• "beli bakso 15rb"\n• "gajian 5jt"\n• "kopi susu 25k"\n• "bayar wifi 350.000"`;
      await sendTelegramMessage(botToken, chatId, errorMsg);
      return {
        updateId,
        handled: true,
        replyText: errorMsg,
        sourceType: voiceTranscript ? 'voice' : 'text',
      };
    }

    const parsed = parseResult.data;
    const categories = tatadanaDb.getCategories(profile.id);

    // Map Category
    let targetCat = categories.find(c => c.name.toLowerCase() === parsed.kategori.toLowerCase());
    if (!targetCat) {
      targetCat = categories.find(c => c.type === (parsed.jenis === 'pemasukan' ? 'income' : 'expense')) || categories[0];
    }

    // Determine Transaction Type
    let txType: 'expense' | 'income' | 'transfer' = 'expense';
    if (parsed.jenis === 'pemasukan') txType = 'income';
    if (parsed.jenis === 'transfer') txType = 'transfer';

    const pendingTx: PendingTransaction = {
      type: txType,
      amount: parsed.nominal,
      description: parsed.catatan || text,
      category_id: targetCat?.id,
      category_name: targetCat?.name,
      source: voiceTranscript ? 'telegram_voice' : 'telegram_text',
      voice_transcript: voiceTranscript,
      timestamp: Date.now(),
    };

    // If wallet was explicitly supplied, process right away
    if (explicitWalletId) {
      return await this.handleWalletSelection(explicitWalletId, pendingTx, profile, chatId, botToken, updateId);
    }

    // Otherwise, prepare pending transaction and dynamic wallet buttons
    pendingTransactionsByUser.set(profile.id, pendingTx);

    const walletOptionsText = activeWallets
      .map((w, idx) => `${idx + 1}. *${w.name}* (Saldo: ${formatRupiah(w.balance)})`)
      .join('\n');

    // FLOW A: PENGELUARAN (Tampilkan pilihan tombol dompet dinamis beserta saldo saat ini)
    if (txType === 'expense') {
      const reply =
        `💸 *PILIH DOMPET PENGELUARAN*\n\n` +
        `📝 Transaksi : *${parsed.catatan || text}*\n` +
        `🏷️ Kategori : ${targetCat?.emoji || '🏷️'} *${targetCat?.name || 'Pengeluaran'}*\n` +
        `💵 Nominal : *${formatRupiah(parsed.nominal)}*\n\n` +
        `Pilih dompet yang digunakan untuk transaksi ini:\n` +
        `${walletOptionsText}\n\n` +
        `👇 _Silakan klik tombol dompet di bawah atau ketik nama dompet pilihanmu:_`;

      const inlineKeyboard = {
        inline_keyboard: activeWallets.map(w => [
          { text: `👛 ${w.name} (${formatRupiah(w.balance)})`, callback_data: `wallet_select:${w.id}` }
        ])
      };

      await sendTelegramMessage(botToken, chatId, reply, inlineKeyboard);

      return {
        updateId,
        handled: true,
        replyText: reply,
        sourceType: voiceTranscript ? 'voice' : 'text',
        promptType: 'wallet_selection_expense',
        pendingTransaction: pendingTx,
        walletOptions: activeWallets.map(w => ({
          id: w.id,
          name: w.name,
          type: w.type,
          balance: w.balance,
          is_default: w.is_default,
          color: w.color,
        })),
      };
    }

    // FLOW B: PEMASUKAN (Tanyakan masuk ke dompet mana, minta konfirmasi)
    if (txType === 'income') {
      const reply =
        `💰 *KONFIRMASI DOMPET PEMASUKAN*\n\n` +
        `📝 Transaksi : *${parsed.catatan || text}*\n` +
        `🏷️ Kategori : ${targetCat?.emoji || '💰'} *${targetCat?.name || 'Pemasukan'}*\n` +
        `💵 Nominal : *${formatRupiah(parsed.nominal)}*\n\n` +
        `Masuk ke dompet mana? Silakan pilih dompet tujuan untuk konfirmasi:\n` +
        `${walletOptionsText}\n\n` +
        `👇 _Silakan klik tombol dompet tujuan di bawah untuk konfirmasi:_`;

      const inlineKeyboard = {
        inline_keyboard: activeWallets.map(w => [
          { text: `📥 ${w.name} (${formatRupiah(w.balance)})`, callback_data: `wallet_select:${w.id}` }
        ])
      };

      await sendTelegramMessage(botToken, chatId, reply, inlineKeyboard);

      return {
        updateId,
        handled: true,
        replyText: reply,
        sourceType: voiceTranscript ? 'voice' : 'text',
        promptType: 'wallet_selection_income',
        pendingTransaction: pendingTx,
        walletOptions: activeWallets.map(w => ({
          id: w.id,
          name: w.name,
          type: w.type,
          balance: w.balance,
          is_default: w.is_default,
          color: w.color,
        })),
      };
    }

    // FLOW C: TRANSFER
    const defaultWallet = tatadanaDb.getDefaultWallet(profile.id) || activeWallets[0];
    const newTx = tatadanaDb.addTransaction(
      {
        wallet_id: defaultWallet.id,
        type: 'transfer',
        amount: parsed.nominal,
        description: parsed.catatan || text,
        source: voiceTranscript ? 'telegram_voice' : 'telegram_text',
      },
      profile.id
    );

    const reply = TelegramFormatter.formatTransferReply({
      transaction: newTx,
      sourceWallet: defaultWallet,
      transcript: voiceTranscript,
    });

    await sendTelegramMessage(botToken, chatId, reply);

    return {
      updateId,
      handled: true,
      replyText: reply,
      sourceType: voiceTranscript ? 'voice' : 'text',
      createdTransaction: newTx,
      promptType: 'normal',
    };
  }

  /**
   * Evaluate AI Financial Advisor Triggers
   */
  private static evaluateFinancialAdvisor(profile: Profile, catName: string, amount: number, budget?: any): string | null {
    if (budget && budget.amount_monthly > 0 && amount >= budget.amount_monthly * 0.2) {
      const pctOfBudget = Math.round((amount / budget.amount_monthly) * 100);
      return TelegramFormatter.formatFinancialAdvisor(
        profile,
        `Transaksi barusan di ${catName} menghabiskan ${pctOfBudget}% dari total alokasi budget bulanan kamu sekaligus!`,
        `Pertimbangkan untuk mengerem pengeluaran ${catName} hingga awal minggu depan agar sisa budget aman.`
      );
    }

    const allTx = tatadanaDb.getTransactions(profile.id);
    const now = new Date();

    const currentMonthTx = allTx.filter((t) => {
      const d = new Date(t.transaction_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyInc = currentMonthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthlyExp = currentMonthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    if (monthlyInc > 0 && monthlyExp >= monthlyInc * 0.8) {
      const pct = Math.round((monthlyExp / monthlyInc) * 100);
      return TelegramFormatter.formatFinancialAdvisor(
        profile,
        `Total pengeluaranmu bulan ini sudah mencapai ${pct}% dari seluruh pemasukan!`,
        `Batasi belanja non-primer agar arus kas tetap surplus hingga waktu gajian berikutnya.`
      );
    }

    const nowMs = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    const last7DaysSpent = allTx
      .filter((t) => t.type === 'expense' && t.category?.name === catName)
      .filter((t) => {
        const time = new Date(t.transaction_date).getTime();
        return time >= nowMs - sevenDaysMs;
      })
      .reduce((s, t) => s + t.amount, 0);

    const prev7DaysSpent = allTx
      .filter((t) => t.type === 'expense' && t.category?.name === catName)
      .filter((t) => {
        const time = new Date(t.transaction_date).getTime();
        return time >= nowMs - fourteenDaysMs && time < nowMs - sevenDaysMs;
      })
      .reduce((s, t) => s + t.amount, 0);

    if (prev7DaysSpent > 0 && last7DaysSpent >= prev7DaysSpent * 1.5) {
      const increasePct = Math.round(((last7DaysSpent - prev7DaysSpent) / prev7DaysSpent) * 100);
      return TelegramFormatter.formatFinancialAdvisor(
        profile,
        `Pengeluaran kategori ${catName} melonjak ${increasePct}% dalam 7 hari terakhir dibanding minggu sebelumnya!`,
        `Cek kembali transaksi ${catName} mingguanmu dan pertimbangkan alternatif yang lebih hemat.`
      );
    }

    return null;
  }
}
