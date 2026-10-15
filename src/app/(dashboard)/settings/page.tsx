'use client';

import * as React from 'react';
import {
  User,
  Bot,
  Bell,
  Tags,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  Phone,
  Mail,
  Camera,
  Upload,
  Coins,
  Check,
  RefreshCw,
  Edit3,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  Lock,
  KeyRound,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TelegramSimulatorModal } from '@/components/dashboard/TelegramSimulatorModal';
import { EditProfileModal } from '@/components/dashboard/EditProfileModal';
import { PRESET_AVATARS, SUPPORTED_CURRENCIES } from '@/lib/constants/avatars';
import { SAVING_PLACES } from '@/lib/constants/saving-places';
import { SavingPlaceId } from '@/types';
import { showToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return 'Sep 2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Sep 2026';
    return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  } catch {
    return 'Sep 2026';
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<'profil' | 'telegram' | 'reminder' | 'kategori'>('profil');
  const [profile, setProfile] = React.useState(tatadanaDb.getProfile());
  const [reminders, setReminders] = React.useState(tatadanaDb.getReminders());
  const [categories, setCategories] = React.useState(tatadanaDb.getCategories());

  // Telegram test states
  const [botToken, setBotToken] = React.useState(profile.telegram_bot_token || '');
  const [isTesting, setIsTesting] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<'connected' | 'disconnected' | 'idle'>(
    profile.telegram_bot_token ? 'connected' : 'idle'
  );
  const [testMessage, setTestMessage] = React.useState('');
  const [isSimulatorOpen, setIsSimulatorOpen] = React.useState(false);

  // Profile states
  const [fullName, setFullName] = React.useState(profile.full_name);
  const [email, setEmail] = React.useState(profile.email || '');
  const [phoneNumber, setPhoneNumber] = React.useState(profile.phone_number || '');
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url || PRESET_AVATARS[0].url);
  const [currency, setCurrency] = React.useState(profile.default_currency || profile.currency || 'IDR');
  const [savingPreference, setSavingPreference] = React.useState<string>(profile.saving_preference || 'rekening_bank');
  const [isSavingPreference, setIsSavingPreference] = React.useState(false);
  const [activeDetailPlaceId, setActiveDetailPlaceId] = React.useState<string | null>(null);
  const [avatarTab, setAvatarTab] = React.useState<'preset' | 'upload' | 'url'>('preset');
  const [customAvatarUrl, setCustomAvatarUrl] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = React.useState(false);
  const [profileErrors, setProfileErrors] = React.useState<{ [key: string]: string }>({});
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [isSendingReminder, setIsSendingReminder] = React.useState(false);
  const [reminderTestStatus, setReminderTestStatus] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState('');
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);

  // New Category states (Ardana maroon instead of orange)
  const [newCatName, setNewCatName] = React.useState('');
  const [newCatEmoji, setNewCatEmoji] = React.useState('🏷️');
  const [newCatType, setNewCatType] = React.useState<'expense' | 'income'>('expense');
  const [newCatColor, setNewCatColor] = React.useState('#812D46');

  // AI Category Recommendation states
  const [profileDescription, setProfileDescription] = React.useState('Karyawan swasta yang ngekos');
  const [isRecommending, setIsRecommending] = React.useState(false);
  const [aiRecCategories, setAiRecCategories] = React.useState<any[]>([]);

  // Tab switching with URL query sync
  const handleTabChange = (tab: 'profil' | 'telegram' | 'reminder' | 'kategori') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    }
  };

  // Sync tab from URL query params (?tab=profil)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'profil' || tabParam === 'telegram' || tabParam === 'reminder' || tabParam === 'kategori') {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  // Listen for real-time updates and fetch authoritative data from server
  React.useEffect(() => {
    const syncProfile = () => {
      const cur = tatadanaDb.getProfile();
      setProfile(cur);
      setFullName(cur.full_name);
      setEmail(cur.email || '');
      setPhoneNumber(cur.phone_number || '');
      setAvatarUrl(cur.avatar_url || PRESET_AVATARS[0].url);
      setCurrency(cur.default_currency || cur.currency || 'IDR');
      setSavingPreference(cur.saving_preference || 'rekening_bank');
      setBotToken(cur.telegram_bot_token || '');
      setReminders(tatadanaDb.getReminders());
      setCategories(tatadanaDb.getCategories());
    };

    syncProfile();

    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          tatadanaDb.syncProfile(data.profile);
          syncProfile();
        }
      })
      .catch(() => {});

    window.addEventListener('tatadana_data_updated', syncProfile);
    window.addEventListener('storage', syncProfile);
    return () => {
      window.removeEventListener('tatadana_data_updated', syncProfile);
      window.removeEventListener('storage', syncProfile);
    };
  }, []);

  const handleUpdateSavingPreference = async (prefId: string) => {
    setIsSavingPreference(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saving_preference: prefId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memperbarui preferensi tempat simpan uang.');
      }

      const updated = data.profile;
      tatadanaDb.syncProfile(updated);
      setSavingPreference(prefId);
      setProfile(updated);
      showToast({
        title: 'Preferensi Tersimpan',
        message: `Preferensi tempat simpan uang Anda berhasil disetel ke: ${SAVING_PLACES.find((p) => p.id === prefId)?.name || prefId}.`,
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Gagal Menyimpan',
        message: err.message || 'Gagal memperbarui preferensi tempat simpan uang.',
        type: 'error',
      });
    } finally {
      setIsSavingPreference(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestMessage('');
    try {
      const res = await fetch('/api/telegram/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken }),
      });
      const data = await res.json();
      if (data.ok) {
        setConnectionStatus('connected');
        setTestMessage(data.message || 'Koneksi ke bot Telegram berhasil diverifikasi & webhook terpasang!');
        setProfile(tatadanaDb.getProfile());
      } else {
        setConnectionStatus('disconnected');
        setTestMessage(data.error || 'Token salah atau tidak dapat diakses.');
      }
    } catch (err: any) {
      setConnectionStatus('disconnected');
      setTestMessage(err.message || 'Gagal menghubungi Telegram API.');
    } finally {
      setIsTesting(false);
    }
  };

  const validateProfile = (): boolean => {
    const errs: { [key: string]: string } = {};
    const cleanName = fullName.trim();
    if (!cleanName) {
      errs.fullName = 'Nama lengkap wajib diisi.';
    } else if (cleanName.length < 2) {
      errs.fullName = 'Nama lengkap minimal 2 karakter.';
    } else if (cleanName.length > 60) {
      errs.fullName = 'Nama lengkap maksimal 60 karakter.';
    }

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      errs.email = 'Alamat email wajib diisi.';
    } else if (!emailRegex.test(cleanEmail)) {
      errs.email = 'Format email tidak valid (contoh: nama@domain.com).';
    }

    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    const phoneRegex = /^(\+?[0-9]{9,15})$/;
    if (!cleanPhone) {
      errs.phoneNumber = 'Nomor handphone wajib diisi.';
    } else if (!phoneRegex.test(cleanPhone)) {
      errs.phoneNumber = 'Format nomor HP tidak valid (contoh: 081234567890).';
    }

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;

    let finalAvatar = avatarUrl || PRESET_AVATARS[0].url;
    if (avatarTab === 'url' && customAvatarUrl.trim()) {
      const cleanUrl = customAvatarUrl.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        setProfileErrors((prev) => ({ ...prev, avatarUrl: 'URL harus diawali dengan http:// atau https://' }));
        return;
      }
      finalAvatar = cleanUrl;
      setAvatarUrl(cleanUrl);
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone_number: phoneNumber.trim(),
          avatar_url: finalAvatar,
          default_currency: currency,
          currency: currency,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Gagal menyimpan profil ke database.');
      }

      const updated = data.profile;
      tatadanaDb.syncProfile(updated);

      setProfile(updated);
      setFullName(updated.full_name);
      setEmail(updated.email);
      setPhoneNumber(updated.phone_number || '');
      setAvatarUrl(updated.avatar_url);
      setCurrency(updated.default_currency || updated.currency || 'IDR');

      setSavedSuccess(true);
      showToast({
        title: 'Profil Berhasil Disimpan',
        message: 'Perubahan profil dan mata uang berhasil disimpan ke database.',
        type: 'success',
      });
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      showToast({
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan saat menyimpan profil.',
        type: 'error',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Kata sandi saat ini wajib diisi.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Gagal mengubah kata sandi.');
      }

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast({
        title: 'Kata Sandi Diperbarui',
        message: 'Kata sandi Anda berhasil diperbarui menggunakan hashing scrypt.',
        type: 'success',
      });
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Gagal mengubah kata sandi.');
      showToast({
        title: 'Gagal Mengubah Kata Sandi',
        message: err.message || 'Terjadi kesalahan saat memproses perubahan kata sandi.',
        type: 'error',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileErrors((prev) => ({ ...prev, avatar: 'File harus berformat gambar (PNG, JPG, WebP).' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileErrors((prev) => ({ ...prev, avatar: 'Ukuran foto maksimal 5MB.' }));
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(compressed);
        } else {
          setAvatarUrl(dataUrl);
        }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setProfileErrors((prev) => {
          const rest = { ...prev };
          delete rest.avatar;
          return rest;
        });
      };
      img.onerror = () => {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setProfileErrors((prev) => ({ ...prev, avatar: 'Gagal memproses gambar.' }));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    const clean = customAvatarUrl.trim();
    if (!clean) return;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      setProfileErrors((prev) => ({ ...prev, avatarUrl: 'URL harus diawali dengan http:// atau https://' }));
      return;
    }
    setAvatarUrl(clean);
    setProfileErrors((prev) => {
      const rest = { ...prev };
      delete rest.avatarUrl;
      return rest;
    });
  };

  const handleSaveReminder = () => {
    tatadanaDb.updateReminders(reminders);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestReminder = async () => {
    setIsSendingReminder(true);
    setReminderTestStatus('');
    try {
      const res = await fetch('/api/telegram/reminders', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setReminderTestStatus('✅ Reminder berhasil dikirim ke bot Telegram!');
        setReminders(tatadanaDb.getReminders());
      } else {
        setReminderTestStatus(`⚠️ ${data.message || 'Gagal mengirim reminder.'}`);
      }
    } catch {
      setReminderTestStatus('❌ Gagal menghubungi server reminder.');
    } finally {
      setIsSendingReminder(false);
      setTimeout(() => setReminderTestStatus(''), 4000);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    tatadanaDb.addCategory({
      name: newCatName.trim(),
      emoji: newCatEmoji,
      type: newCatType,
      color: newCatColor,
    });
    setCategories(tatadanaDb.getCategories());
    setNewCatName('');
  };

  const handleDeleteCategory = (id: string) => {
    tatadanaDb.deleteCategory(id);
    setCategories(tatadanaDb.getCategories());
  };

  const handleGetAIRecommendations = async () => {
    setIsRecommending(true);
    try {
      const res = await fetch('/api/ai/recommend-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileDescription }),
      });
      const data = await res.json();
      if (data.success && data.recommendations) {
        setAiRecCategories(data.recommendations);
      }
    } catch {
      // fallback
    } finally {
      setIsRecommending(false);
    }
  };

  const handleApplyRecommendations = () => {
    aiRecCategories.forEach((cat) => {
      const exists = categories.some((c) => c.name.toLowerCase() === cat.name.toLowerCase());
      if (!exists) {
        tatadanaDb.addCategory({
          name: cat.name,
          emoji: cat.emoji,
          type: cat.type,
          color: cat.color,
        });
      }
    });
    setCategories(tatadanaDb.getCategories());
    setAiRecCategories([]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pengaturan Aplikasi ⚙️
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Konfigurasi integrasi Telegram Bot, jadwal reminder harian, profil, dan kategori transaksi.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs sm:text-sm font-semibold overflow-x-auto pb-1">
        {[
          { id: 'profil', label: 'Profil Saya', icon: User },
          { id: 'telegram', label: 'Telegram Bot', icon: Bot },
          { id: 'reminder', label: 'Reminder Harian', icon: Bell },
          { id: 'kategori', label: 'Kategori Custom', icon: Tags },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pengaturan berhasil disimpan!</span>
        </div>
      )}

      {/* TAB 1: TELEGRAM BOT (INTI SETUP) */}
      {activeTab === 'telegram' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Integrasi Bot Telegram</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hubungkan akun Ardana dengan Telegram Bot untuk pencatatan transaksi chat instan.
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {connectionStatus === 'connected' && (
                  <Badge variant="success" className="gap-1 py-1 px-3">
                    🟢 Terhubung
                  </Badge>
                )}
                {connectionStatus === 'disconnected' && (
                  <Badge variant="danger" className="gap-1 py-1 px-3">
                    🔴 Tidak Terhubung
                  </Badge>
                )}
                {connectionStatus === 'idle' && (
                  <Badge variant="slate" className="gap-1 py-1 px-3">
                    ⚪ Belum Dikonfigurasi
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Telegram Account Linking Box */}
              <div className="rounded-xl bg-rose-50/70 p-4 border border-rose-200 text-xs text-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-900 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-brand-600" /> Hubungkan Akun Telegram Anda
                  </span>
                  {profile.telegram_user_id ? (
                    <Badge variant="success" className="text-[10px]">
                      Terhubung (ID: {profile.telegram_user_id})
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-[10px]">
                      Belum Terhubung
                    </Badge>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Untuk dapat mencatat transaksi keuangan secara instan lewat chat Telegram, hubungkan akun Telegram Anda dengan mengirimkan perintah berikut ke bot:
                </p>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-rose-200">
                  <code className="font-mono text-xs sm:text-sm font-bold text-brand-700 select-all">/connect {profile.id}</code>
                  <span className="text-[10px] text-slate-400">Klik untuk copy</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  User ID Anda: <strong className="font-mono text-slate-700">{profile.id}</strong> {profile.telegram_username ? `(@${profile.telegram_username})` : ''}
                </p>
              </div>

              {/* Step-by-step Guide */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
                  📖 Panduan Cepat Setup @BotFather:
                </span>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Buka Telegram dan cari <strong>@BotFather</strong></li>
                  <li>Ketik command <code>/newbot</code> dan ikuti instruksi nama bot</li>
                  <li>Salin API Token HTTP yang diberikan BotFather (contoh: <code>7812345678:AAF-...</code>)</li>
                  <li>Tempelkan token ke kolom di bawah ini dan tekan tombol <strong>"Test Koneksi"</strong></li>
                </ol>
              </div>

              {/* Token Input Field */}
              <div className="space-y-3">
                <Input
                  label="Bot Token Telegram"
                  placeholder="Paste token dari BotFather di sini..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="font-mono text-xs"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleTestConnection}
                    isLoading={isTesting}
                    disabled={!botToken.trim()}
                    className="min-w-[140px]"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ⏳ Testing...
                      </>
                    ) : (
                      'Test Koneksi'
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsSimulatorOpen(true)}
                    className="border-brand-200 text-brand-600 hover:bg-rose-50"
                  >
                    <Send className="w-4 h-4 mr-1.5" /> Buka Simulator Bot di Layar
                  </Button>
                </div>

                {testMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium border ${
                      connectionStatus === 'connected'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {testMessage}
                  </div>
                )}
              </div>

              {/* Webhook Technical Info */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                <span>
                  Webhook Target: <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">/api/telegram/webhook</code>
                </span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Idempotent update_id verified
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: REMINDER HARIAN (Maks 2x/hari) */}
      {activeTab === 'reminder' && (
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Reminder Harian</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Bot Telegram akan mengingatkan Anda untuk mencatat transaksi rutin (maksimal 2x per hari).
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 text-sm block">Status Reminder Bot</span>
                <span className="text-xs text-slate-500">Kirim notifikasi otomatis via chat Telegram</span>
              </div>
              <input
                type="checkbox"
                checked={reminders.is_enabled}
                onChange={(e) => setReminders({ ...reminders, is_enabled: e.target.checked })}
                className="h-5 w-5 text-brand-500 rounded focus:ring-brand-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Frekuensi Reminder
                </label>
                <select
                  value={reminders.frequency}
                  onChange={(e) => setReminders({ ...reminders, frequency: parseInt(e.target.value) as 1 | 2 })}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                >
                  <option value={1}>1x Sehari</option>
                  <option value={2}>2x Sehari (Siang & Malam)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Jam Reminder 1 (WIB)
                </label>
                <Input
                  type="time"
                  value={reminders.time_1}
                  onChange={(e) => setReminders({ ...reminders, time_1: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>

              {reminders.frequency === 2 && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Jam Reminder 2 (WIB)
                  </label>
                  <Input
                    type="time"
                    value={reminders.time_2}
                    onChange={(e) => setReminders({ ...reminders, time_2: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Preview Pesan Reminder (Part 4.8) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Preview Pesan Reminder di Telegram:
              </span>
              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 text-xs text-slate-800 font-sans whitespace-pre-wrap">
{`⏰ Reminder Keuangan!
Jangan lupa catat pengeluaran hari ini ya 📝
Pencatatan rutin = keuangan lebih terkontrol 💪
Ketik transaksimu sekarang!`}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button onClick={handleSaveReminder}>Simpan Pengaturan Reminder</Button>
              <Button
                variant="outline"
                onClick={handleTestReminder}
                isLoading={isSendingReminder}
                className="border-brand-300 text-brand-600 hover:bg-rose-50"
              >
                <Bell className="w-4 h-4 mr-1.5" /> Kirim Test Reminder ke Telegram Sekarang
              </Button>
            </div>

            {reminderTestStatus && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                {reminderTestStatus}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: KATEGORI CUSTOM */}
      {activeTab === 'kategori' && (
        <div className="space-y-6">
          {/* AI Category Recommendation Card (Part 3) */}
          <Card className="border-rose-200 bg-gradient-to-r from-rose-50/70 to-amber-50/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-brand-500 text-white">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <CardTitle>AI Rekomendasi Kategori Otomatis</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dapatkan rekomendasi kategori cerdas berbasis AI sesuai gaya hidup, pekerjaan, atau profil pengeluaranmu.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Contoh: Karyawan swasta anak kos, Mahasiswa, Freelancer, Keluarga muda..."
                  value={profileDescription}
                  onChange={(e) => setProfileDescription(e.target.value)}
                  className="bg-white flex-1 text-xs"
                />
                <Button
                  onClick={handleGetAIRecommendations}
                  isLoading={isRecommending}
                  className="shrink-0 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Rekomendasikan AI
                </Button>
              </div>

              {/* Recommended Categories Preview */}
              {aiRecCategories.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-rose-200/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    Hasil Rekomendasi Kategori:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {aiRecCategories.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-rose-200 text-slate-800 text-xs font-semibold shadow-sm"
                      >
                        <span>{c.emoji}</span>
                        <span>{c.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">({c.type})</span>
                      </span>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleApplyRecommendations}
                    className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Terapkan Semua Rekomendasi ke Akun Saya
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Category Form */}
          <Card>
            <CardHeader>
              <CardTitle>Tambah Kategori Custom</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Buat kategori baru lengkap dengan emoji dan warna pilihan.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input
                  placeholder="Nama Kategori (misal: Skincare)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="sm:col-span-2"
                  required
                />
                <Input
                  placeholder="Emoji (misal: 💄)"
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  className="text-center"
                />
                <Button type="submit">
                  <Plus className="w-4 h-4 mr-1" /> Tambah
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Category List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Kategori Anda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-white text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.emoji}</span>
                      <div>
                        <span className="font-semibold text-slate-900 block">{c.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{c.type}</span>
                      </div>
                    </div>
                    {!c.is_system && (
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: PROFIL SAYA */}
      {activeTab === 'profil' && (
        <div className="space-y-6">
          {/* Profile Overview Banner */}
          <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-rose-50/30 to-brand-50/50 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="relative group">
                <img
                  src={profile.avatar_url || PRESET_AVATARS[0].url}
                  alt={profile.full_name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
                  }}
                  className="w-20 h-20 rounded-full object-cover border-2 border-brand-500 shadow-md shadow-brand-900/10"
                />
                <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white text-[10px]" title="Aktif">
                  ✓
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {profile.full_name}
                  </h2>
                  <Badge variant={profile.subscription_tier === 'pro' ? 'brand' : 'slate'}>
                    {(profile.subscription_tier || 'starter').toUpperCase()} MEMBER
                  </Badge>
                  {profile.is_superadmin && (
                    <Badge variant="brand" className="bg-amber-100 text-amber-800 border-amber-200">
                      SUPERADMIN
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.email || 'budi.pratama@ardana.id'}</span>
                  <span className="text-slate-300">•</span>
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.phone_number || '-'}</span>
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] text-slate-500">
                  <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-medium">
                    Mata Uang: <strong className="text-brand-600">{profile.default_currency || profile.currency || 'IDR'}</strong>
                  </span>
                  <span suppressHydrationWarning className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-medium">
                    Bergabung: {formatJoinDate(profile.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditProfileModalOpen(true)}
              className="text-xs border-brand-200 text-brand-600 hover:bg-brand-50 shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Buka Modal Cepat
            </Button>
          </div>

          {/* Profile Edit Card */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Identitas & Pengaturan Akun</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Ubah foto profil, nama lengkap, kontak email/nomor HP, dan mata uang dasar akun Anda.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
                {/* --- AVATAR PICKER SECTION --- */}
                <div className="p-4 rounded-2xl border border-brand-100 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-brand-600" /> Ganti Foto Profil / Avatar
                    </label>
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(PRESET_AVATARS[0].url)}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset ke Default
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={avatarUrl || PRESET_AVATARS[0].url}
                      alt={fullName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
                      }}
                      className="w-16 h-16 rounded-full object-cover border-2 border-brand-500 shadow-sm shrink-0"
                    />

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => setAvatarTab('preset')}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                            avatarTab === 'preset'
                              ? 'bg-brand-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600'
                          )}
                        >
                          Pilihan Avatar ({PRESET_AVATARS.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarTab('upload')}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                            avatarTab === 'upload'
                              ? 'bg-brand-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600'
                          )}
                        >
                          Unggah File
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarTab('url')}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                            avatarTab === 'url'
                              ? 'bg-brand-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600'
                          )}
                        >
                          Input URL
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preset Avatar Grid */}
                  {avatarTab === 'preset' && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        Klik untuk memilih avatar preset resmi Ardana:
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1">
                        {PRESET_AVATARS.map((item) => {
                          const isSelected = avatarUrl === item.url;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setAvatarUrl(item.url)}
                              className={cn(
                                'relative group rounded-full p-0.5 transition-all focus:outline-none',
                                isSelected
                                  ? 'ring-2 ring-brand-500 ring-offset-2 scale-105'
                                  : 'hover:opacity-80 opacity-70'
                              )}
                              title={item.name}
                            >
                              <img
                                src={item.url}
                                alt={item.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
                                }}
                                className="w-11 h-11 rounded-full object-cover border border-slate-200"
                              />
                              {isSelected && (
                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-brand-600 text-white rounded-full flex items-center justify-center text-[8px] shadow-sm">
                                  <Check className="w-2 h-2" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Upload file */}
                  {avatarTab === 'upload' && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-brand-200 hover:border-brand-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-brand-50/40 hover:bg-brand-50/80"
                      >
                        <Upload className="w-5 h-5 text-brand-600 mx-auto mb-1" />
                        <p className="text-xs font-semibold text-slate-800">
                          Pilih foto dari galeri komputer / HP
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Format PNG, JPG, WebP (Maks. 5MB)
                        </p>
                      </div>
                      {isUploading && (
                        <p className="text-xs text-brand-600 font-medium animate-pulse text-center">
                          Mengoptimasi gambar...
                        </p>
                      )}
                      {profileErrors.avatar && (
                        <p className="text-xs text-red-600 font-medium">{profileErrors.avatar}</p>
                      )}
                    </div>
                  )}

                  {/* Custom URL */}
                  {avatarTab === 'url' && (
                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <Input
                        placeholder="https://images.unsplash.com/photo-..."
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCustomUrl();
                          }
                        }}
                        error={profileErrors.avatarUrl}
                        className="text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={handleApplyCustomUrl}
                        className="shrink-0 text-xs px-3"
                      >
                        Gunakan
                      </Button>
                    </div>
                  )}
                </div>

                {/* --- FORM FIELDS --- */}
                {/* Nama Lengkap */}
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (profileErrors.fullName) {
                          setProfileErrors((prev) => {
                            const rest = { ...prev };
                            delete rest.fullName;
                            return rest;
                          });
                        }
                      }}
                      placeholder="Nama Lengkap Anda"
                      error={profileErrors.fullName}
                      className="pl-9"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Alamat Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (profileErrors.email) {
                          setProfileErrors((prev) => {
                            const rest = { ...prev };
                            delete rest.email;
                            return rest;
                          });
                        }
                      }}
                      placeholder="contoh: budi.pratama@ardana.id"
                      error={profileErrors.email}
                      className="pl-9"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Nomor Handphone */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Nomor Handphone (Kunci Link Telegram) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                      {profile.phone_verified ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi via OTP
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Belum terverifikasi
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (profileErrors.phoneNumber) {
                          setProfileErrors((prev) => {
                            const rest = { ...prev };
                            delete rest.phoneNumber;
                            return rest;
                          });
                        }
                      }}
                      placeholder="081234567890"
                      error={profileErrors.phoneNumber}
                      className="pl-9"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Default Currency */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-brand-600" /> Mata Uang Default
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition-all focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 cursor-pointer"
                  >
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.country} {curr.code} — {curr.name} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Nilai transaksi harian, budget bulanan, dan laporan keuangan akan diformat mengacu pada mata uang ini.
                  </p>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center gap-3">
                  <Button type="submit" isLoading={isSavingProfile} className="px-6">
                    Simpan Profil
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const cur = tatadanaDb.getProfile();
                      setFullName(cur.full_name);
                      setEmail(cur.email || 'budi.pratama@ardana.id');
                      setPhoneNumber(cur.phone_number || '');
                      setAvatarUrl(cur.avatar_url || PRESET_AVATARS[0].url);
                      setCurrency(cur.default_currency || cur.currency || 'IDR');
                      setProfileErrors({});
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Card: Ganti Kata Sandi */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600 border border-brand-200">
                  <KeyRound className="w-4 h-4" />
                </span>
                <div>
                  <CardTitle>Keamanan Akun & Kata Sandi</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Perbarui kata sandi akun Anda menggunakan enkripsi scrypt yang aman.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                {passwordSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Kata sandi berhasil diperbarui dan tersimpan aman di database!</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="space-y-1 text-left">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Kata Sandi Saat Ini (Lama) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      placeholder="Masukkan kata sandi saat ini"
                      className="pl-9"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Kata Sandi Baru <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                        }}
                        placeholder="Minimal 6 karakter"
                        className="pl-9"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                        }}
                        placeholder="Ulangi kata sandi baru"
                        className="pl-9"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" isLoading={isChangingPassword} className="px-6">
                    <Lock className="w-3.5 h-3.5 mr-1.5" /> Perbarui Kata Sandi
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Saving Places Preference Card (Requirement 4) */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">🏦</span> Preferensi Tempat Menyimpan Uang
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Pilih metode atau instrumen utama yang menjadi preferensi Anda saat menyimpan uang. Pilihan ini akan diprioritaskan saat chatbot memberikan saran keuangan.
                  </p>
                </div>
                <Badge variant="brand" className="self-start sm:self-auto shrink-0 bg-brand-50 text-brand-700 border-brand-200">
                  Preferensi Aktif: {SAVING_PLACES.find((p) => p.id === savingPreference)?.name || 'Rekening Bank'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Educational alert */}
              <div className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50/60 to-brand-50/40 p-4 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-brand-900">
                  <Info className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Edukasi Finansial Ardana: Simpanan Bank vs Investasi</span>
                </div>
                <p className="text-slate-600 leading-relaxed pl-6">
                  Rekening tabungan dan deposito bank dijamin oleh <strong>Lembaga Penjamin Simpanan (LPS)</strong> hingga Rp2 Miliar per nasabah (sesuai ketentuan suku bunga penjaminan). Sedangkan e-wallet merupakan alat transaksi, dan RDPU/emas adalah instrumen investasi berisiko pasar yang tidak dijamin LPS. Pilihan di bawah ini hanya menyimpan preferensi profil dan tidak memindahkan dana riil Anda.
                </p>
              </div>

              {/* Grid of saving places */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAVING_PLACES.map((place) => {
                  const isSelected = savingPreference === place.id;
                  const isDetailOpen = activeDetailPlaceId === place.id;

                  return (
                    <div
                      key={place.id}
                      className={cn(
                        'rounded-2xl border transition-all p-4 flex flex-col justify-between text-left space-y-3 bg-white',
                        isSelected
                          ? 'border-brand-500 ring-2 ring-brand-500/15 shadow-sm bg-gradient-to-br from-white via-rose-50/20 to-brand-50/30'
                          : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50/50'
                      )}
                    >
                      <div className="space-y-2">
                        {/* Header card */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                              {place.emoji}
                            </span>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 leading-snug">
                                {place.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  {place.badge}
                                </span>
                                {place.lpsGuarantee.startsWith('Dijamin LPS') ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Terjamin LPS
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                    {place.isInvestment ? '📈 Pasar Modal' : '⚡ Non-LPS'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="px-2 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-bold flex items-center gap-1 shrink-0">
                              <Check className="w-3 h-3 text-brand-600" /> Aktif
                            </span>
                          )}
                        </div>

                        {/* Short desc */}
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {place.shortDesc}
                        </p>

                        {/* Liquidity badge */}
                        <div className="text-[11px] text-slate-500 bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-100">
                          <strong className="text-slate-700 font-semibold">Likuiditas:</strong> {place.likuiditas}
                        </div>
                      </div>

                      {/* Expandable detailed info */}
                      {isDetailOpen && (
                        <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs text-slate-600 animate-in fade-in duration-200">
                          <div>
                            <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider mb-1">
                              🎯 Fungsi Utama:
                            </span>
                            <p className="text-slate-600 pl-1">{place.fungsi}</p>
                          </div>

                          <div>
                            <span className="font-bold text-emerald-800 text-[11px] block uppercase tracking-wider mb-1">
                              ✨ Kelebihan:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 pl-1 text-slate-600">
                              {place.kelebihan.map((k, idx) => (
                                <li key={idx}>{k}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="font-bold text-rose-800 text-[11px] block uppercase tracking-wider mb-1">
                              ⚠️ Risiko & Hal Diperhatikan:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 pl-1 text-slate-600">
                              {place.risiko.map((r, idx) => (
                                <li key={idx}>{r}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                            <strong>Status Penjaminan:</strong> {place.lpsGuarantee}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveDetailPlaceId(isDetailOpen ? null : place.id)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
                        >
                          {isDetailOpen ? (
                            <>
                              Tutup Rincian <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              Lihat Kelebihan & Risiko <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>

                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? 'primary' : 'outline'}
                          onClick={() => handleUpdateSavingPreference(place.id)}
                          disabled={isSavingPreference}
                          className={cn(
                            'text-xs py-1.5 px-3',
                            isSelected
                              ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                              : 'border-brand-200 text-brand-600 hover:bg-brand-50'
                          )}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1" /> Terpilih
                            </>
                          ) : (
                            'Pilih Metode Ini'
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interactive Telegram Test Simulator Modal */}
      <TelegramSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      {/* Quick Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSuccess={(updated) => {
          setProfile(updated);
          setFullName(updated.full_name);
          setEmail(updated.email || 'budi.pratama@ardana.id');
          setPhoneNumber(updated.phone_number || '');
          setAvatarUrl(updated.avatar_url || PRESET_AVATARS[0].url);
          setCurrency(updated.default_currency || updated.currency || 'IDR');
        }}
      />
    </div>
  );
}

