'use client';

import * as React from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Send,
  Mic,
  Camera,
  Bot,
  Sparkles,
  RefreshCw,
  BookmarkCheck,
  Building2,
  Smartphone,
  Landmark,
  TrendingUp,
  Coins,
  Wallet as WalletIcon,
  ArrowRight,
} from 'lucide-react';
import { formatRupiah, formatWIBDate } from '@/lib/utils';
import { tatadanaDb } from '@/lib/store/mock-db';
import { SAVING_PLACES, getSavingPlaceById } from '@/lib/constants/saving-places';
import { showToast } from '@/components/ui/Toast';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  type?: 'text' | 'photo' | 'voice';
  showSavingButtons?: boolean;
  promptType?: 'wallet_selection_expense' | 'wallet_selection_income' | 'no_wallet' | 'normal';
  pendingTransaction?: any;
  walletOptions?: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    is_default: boolean;
    color: string;
  }>;
}

export function TelegramSimulatorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: `👋 Halo! Saya Bot Telegram Ardana ✨\n\nKetik transaksi seperti "Aku mau beli bakso Rp15.000", "Aku menerima uang Rp100.000", kirim voice note, atau tanyakan "tempat menyimpan uang" untuk konsultasi simpanan & investasi.`,
      time: '10:00',
    },
  ]);
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

  const handleSend = async (customPayload?: { type: 'text' | 'voice' | 'photo'; text?: string }) => {
    const type = customPayload?.type || 'text';
    const textToSend = customPayload?.text || inputText.trim();

    if (!textToSend && type === 'text') return;

    const userMsgId = `usr_${Date.now()}`;
    const userTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let userDisplayText = textToSend;
    if (type === 'voice') userDisplayText = '🎙️ [Mengirim Pesan Suara...]';
    if (type === 'photo') userDisplayText = '📸 [Mengirim Foto Struk Superindo...]';

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: userDisplayText,
        time: userTime,
        type,
      },
    ];

    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/telegram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          text: type === 'text' ? textToSend : undefined,
          caption: type === 'photo' ? 'Struk Belanja Superindo' : undefined,
          voiceDuration: 5,
          userId: tatadanaDb.getActiveUserId(),
        }),
      });

      const data = await res.json();
      const botReply = data.result?.replyText || 'Pesan diterima.';

      // Sync created transaction to client store to update UI instantly without duplicating ID
      if (data.result?.createdTransaction) {
        try {
          tatadanaDb.syncTransaction(data.result.createdTransaction);
          window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
        } catch (e) {
          console.warn('Could not sync simulated tx to local store:', e);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          promptType: data.result?.promptType,
          pendingTransaction: data.result?.pendingTransaction,
          walletOptions: data.result?.walletOptions,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'bot',
          text: '❌ Terjadi kesalahan saat memproses pesan.',
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletSelect = async (walletId: string, walletName: string, pendingTx: any) => {
    if (!pendingTx) return;

    const userMsgId = `usr_${Date.now()}`;
    const userTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const selectActionText =
      pendingTx.type === 'expense'
        ? `👛 Bayar dengan: ${walletName}`
        : `📥 Masukkan ke: ${walletName}`;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: selectActionText,
        time: userTime,
        type: 'text',
      },
    ]);

    setIsLoading(true);

    try {
      const res = await fetch('/api/telegram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'wallet_select',
          walletId,
          pendingTransaction: pendingTx,
          userId: tatadanaDb.getActiveUserId(),
        }),
      });

      const data = await res.json();
      const botReply = data.result?.replyText || 'Transaksi selesai diproses.';

      if (data.result?.createdTransaction) {
        try {
          tatadanaDb.syncTransaction(data.result.createdTransaction);
          window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
          showToast({
            title: 'Transaksi Dicatat',
            message: `Transaksi berhasil dicatat ke dompet ${walletName}!`,
            type: 'success',
          });
        } catch (e) {
          console.warn('Could not sync simulated tx to local store:', e);
        }
      }

      setMessages((prev) => [
        ...prev.map(msg => ({ ...msg, walletOptions: undefined })), // deactivate previous buttons
        {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          promptType: data.result?.promptType,
          pendingTransaction: data.result?.pendingTransaction,
          walletOptions: data.result?.walletOptions,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'bot',
          text: '❌ Terjadi kesalahan saat memproses pilihan dompet.',
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreference = (placeId: string, placeName: string) => {
    tatadanaDb.setSavingPreference(placeId);
    showToast({
      title: 'Preferensi Tersimpan',
      message: `Preferensi berhasil disimpan: ${placeName}!`,
      type: 'success',
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `bot_pref_${Date.now()}`,
        sender: 'bot',
        text: `✅ *Preferensi Tersimpan!*\n\n${placeName} telah disimpan sebagai preferensi tempat simpan uang di profil akun Anda.\n\nAnda dapat meninjau alokasi ini kapan saja di menu *Settings > Profil*.`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPills = [
    { label: '🍜 Aku mau beli bakso Rp15.000', action: () => handleSend({ type: 'text', text: 'Aku mau beli bakso Rp15.000' }) },
    { label: '💰 Aku menerima uang Rp100.000', action: () => handleSend({ type: 'text', text: 'Aku menerima uang Rp100.000' }) },
    { label: '🚗 ojol ke kantor 25k', action: () => handleSend({ type: 'text', text: 'ojol ke kantor 25k' }) },
    { label: '🎙️ Voice Note: Bensin 50rb', action: () => handleSend({ type: 'voice' }) },
    { label: '🧾 Foto Struk Belanja', action: () => handleSend({ type: 'photo' }) },
    { label: '📊 /saldo', action: () => handleSend({ type: 'text', text: '/saldo' }) },
    { label: '🎯 /budget', action: () => handleSend({ type: 'text', text: '/budget' }) },
    { label: '🏛️ Tempat Simpan Uang', action: () => handleSend({ type: 'text', text: '/simpanuang' }) },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ardana Telegram Bot Simulator"
      description="Uji coba interaksi bot Telegram langsung dari aplikasi. Transaksi akan otomatis terhubung dengan dompet dinamis Anda."
      maxWidth="lg"
    >
      <div className="flex flex-col h-[540px]">
        {/* Quick Demo Action Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold shrink-0">Pilihan Cepat:</span>
          {quickPills.map((pill, i) => (
            <button
              key={i}
              onClick={pill.action}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700 whitespace-nowrap transition-colors text-xs font-medium border border-slate-200/60"
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Chat Stream Window */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2]/30 rounded-xl my-3 border border-slate-200/80">
          {messages.map((m) => {
            const isSavingMenu =
              m.sender === 'bot' &&
              (m.text.includes('PANDUAN TEMPAT MENYIMPAN UANG') || m.text.includes('Silakan pilih metode'));

            const matchedPlace = SAVING_PLACES.find(
              (p) => m.text.includes(p.name.toUpperCase()) || m.text.includes(p.name)
            );

            const isNoWallet =
              m.promptType === 'no_wallet' ||
              m.text.includes('Sepertinya kamu belum punya dompet yang terdaftar');

            const hasWalletOptions =
              m.sender === 'bot' &&
              m.walletOptions &&
              m.walletOptions.length > 0 &&
              m.pendingTransaction &&
              (m.promptType === 'wallet_selection_expense' || m.promptType === 'wallet_selection_income');

            return (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 text-xs sm:text-sm whitespace-pre-wrap font-sans shadow-sm ${
                    m.sender === 'user' ? 'tg-bubble-user font-medium' : 'tg-bubble-bot'
                  }`}
                >
                  {m.text}

                  {/* NO WALLET PROMPT: Interactive button to /wallet */}
                  {isNoWallet && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                      <Link
                        href="/wallet"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <WalletIcon className="w-4 h-4" /> Buka Menu Dompet (/wallet)
                      </Link>
                    </div>
                  )}

                  {/* DYNAMIC WALLET BUTTON SELECTION (Expense or Income) */}
                  {hasWalletOptions && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-700">
                        {m.pendingTransaction.type === 'expense'
                          ? '👇 Pilih dompet yang digunakan untuk transaksi ini:'
                          : '👇 Konfirmasi: Masuk ke dompet mana?'}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {m.walletOptions!.map((wallet) => (
                          <button
                            key={wallet.id}
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleWalletSelect(wallet.id, wallet.name, m.pendingTransaction)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 hover:border-brand-500 hover:bg-rose-50/70 transition-all text-left shadow-xs group"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div
                                className="w-3.5 h-3.5 rounded-full shrink-0"
                                style={{ backgroundColor: wallet.color || '#812D46' }}
                              />
                              <div className="truncate">
                                <span className="font-bold text-xs text-slate-800 block truncate group-hover:text-brand-600">
                                  {wallet.name}
                                </span>
                                <span className="text-[10px] text-slate-400 capitalize">
                                  {wallet.type}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-2">
                              <span className="text-xs font-bold text-slate-700 block">
                                {formatRupiah(wallet.balance)}
                              </span>
                              <span className="text-[9px] text-brand-600 font-semibold underline">
                                {m.pendingTransaction.type === 'expense' ? 'Pilih Dompet' : 'Konfirmasi'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Quick Reply Buttons for Saving Places */}
                  {isSavingMenu && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        👇 Klik opsi untuk melihat penjelasan lengkap:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {SAVING_PLACES.map((place) => (
                          <button
                            key={place.id}
                            type="button"
                            onClick={() => handleSend({ type: 'text', text: place.name })}
                            className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-brand-500 hover:bg-rose-50/60 transition-all text-left text-xs font-semibold text-slate-800 shadow-xs"
                          >
                            <span className="text-base">{place.emoji}</span>
                            <div className="truncate">
                              <span className="block truncate">{place.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">{place.badge}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Option to Save Preference to Profile */}
                  {matchedPlace && m.sender === 'bot' && !isSavingMenu && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500">
                        Suka opsi ini untuk alokasi Anda?
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        className="text-xs h-7 px-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg"
                        onClick={() => handleSavePreference(matchedPlace.id, matchedPlace.name)}
                      >
                        <BookmarkCheck className="w-3.5 h-3.5 mr-1" /> Simpan ke Profil
                      </Button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time} WIB</span>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2 bg-white rounded-lg w-fit border border-slate-200">
              <Bot className="w-4 h-4 text-brand-500 animate-bounce" />
              <span>Ardana AI sedang menganalisa input kamu...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Action Toolbar & Input Field */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              title="Kirim Simulasi Voice Note"
              disabled={isLoading}
              onClick={() => handleSend({ type: 'voice' })}
              className="shrink-0 h-10 w-10 text-slate-600 hover:text-brand-600 hover:border-brand-500"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              title="Kirim Simulasi Foto Struk OCR"
              disabled={isLoading}
              onClick={() => handleSend({ type: 'photo' })}
              className="shrink-0 h-10 w-10 text-slate-600 hover:text-brand-600 hover:border-brand-500"
            >
              <Camera className="w-4 h-4" />
            </Button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex-1 flex gap-2"
            >
              <Input
                placeholder="Ketik chat, misal: Aku mau beli bakso Rp15.000, gajian 5jt..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                className="h-10 text-xs sm:text-sm"
              />
              <Button type="submit" disabled={isLoading || !inputText.trim()} className="h-10 px-4">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Modal>
  );
}
