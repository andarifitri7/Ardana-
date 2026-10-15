'use client';

import * as React from 'react';
import {
  User,
  Mail,
  Phone,
  Coins,
  Upload,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { Profile } from '@/types';
import { PRESET_AVATARS, SUPPORTED_CURRENCIES } from '@/lib/constants/avatars';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (profile: Profile) => void;
}

export function EditProfileModal({ isOpen, onClose, onSuccess }: EditProfileModalProps) {
  const [profile, setProfile] = React.useState<Profile>(() => tatadanaDb.getProfile());
  const [fullName, setFullName] = React.useState(() => tatadanaDb.getProfile()?.full_name || '');
  const [email, setEmail] = React.useState(() => tatadanaDb.getProfile()?.email || '');
  const [phoneNumber, setPhoneNumber] = React.useState(() => tatadanaDb.getProfile()?.phone_number || '');
  const [avatarUrl, setAvatarUrl] = React.useState<string>(() => tatadanaDb.getProfile()?.avatar_url || PRESET_AVATARS[0].url);
  const [currency, setCurrency] = React.useState(() => tatadanaDb.getProfile()?.default_currency || tatadanaDb.getProfile()?.currency || 'IDR');

  // Avatar picker UI states
  const [avatarTab, setAvatarTab] = React.useState<'preset' | 'upload' | 'url'>('preset');
  const [customUrlInput, setCustomUrlInput] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);

  // Validation & saving states
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [successBanner, setSuccessBanner] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Keyboard accessibility: ESC key to close modal when not saving
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Sync state whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      const current = tatadanaDb.getProfile();
      setProfile(current);
      setFullName(current.full_name || '');
      setEmail(current.email || '');
      setPhoneNumber(current.phone_number || '');
      setAvatarUrl(current.avatar_url || PRESET_AVATARS[0].url);
      setCurrency(current.default_currency || current.currency || 'IDR');
      setCustomUrlInput('');
      setErrors({});
      setSuccessBanner(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Input validation
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    const cleanName = fullName.trim();
    if (!cleanName) {
      newErrors.fullName = 'Nama lengkap wajib diisi.';
    } else if (cleanName.length < 2) {
      newErrors.fullName = 'Nama minimal 2 karakter.';
    } else if (cleanName.length > 60) {
      newErrors.fullName = 'Nama maksimal 60 karakter.';
    }

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      newErrors.email = 'Alamat email wajib diisi.';
    } else if (!emailRegex.test(cleanEmail)) {
      newErrors.email = 'Format email tidak valid (contoh: nama@domain.com).';
    }

    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    const phoneRegex = /^(\+?[0-9]{9,15})$/;
    if (!cleanPhone) {
      newErrors.phoneNumber = 'Nomor handphone wajib diisi.';
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.phoneNumber = 'Format nomor HP tidak valid (contoh: 081234567890).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle local image file upload with canvas compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, avatar: 'File harus berformat gambar (PNG, JPG, WebP).' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: 'Ukuran foto maksimal 5MB.' }));
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
        setErrors((prev) => {
          const rest = { ...prev };
          delete rest.avatar;
          return rest;
        });
      };
      img.onerror = () => {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setErrors((prev) => ({ ...prev, avatar: 'Gagal memproses gambar.' }));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    const clean = customUrlInput.trim();
    if (!clean) return;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      setErrors((prev) => ({ ...prev, avatarUrl: 'URL harus diawali dengan http:// atau https://' }));
      return;
    }
    setAvatarUrl(clean);
    setErrors((prev) => {
      const rest = { ...prev };
      delete rest.avatarUrl;
      return rest;
    });
  };

  const handleResetAvatar = () => {
    setAvatarUrl(PRESET_AVATARS[0].url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let finalAvatar = avatarUrl || PRESET_AVATARS[0].url;
    if (avatarTab === 'url' && customUrlInput.trim()) {
      const cleanUrl = customUrlInput.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        setErrors((prev) => ({ ...prev, avatarUrl: 'URL harus diawali dengan http:// atau https://' }));
        return;
      }
      finalAvatar = cleanUrl;
      setAvatarUrl(cleanUrl);
    }

    setIsSaving(true);

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

      const updatedProfile = data.profile;
      tatadanaDb.syncProfile(updatedProfile);

      setSuccessBanner(true);
      showToast({
        title: 'Profil Berhasil Diperbarui',
        message: 'Perubahan akun Anda telah disimpan ke database server.',
        type: 'success',
      });

      if (onSuccess) {
        onSuccess(updatedProfile);
      }

      saveTimeoutRef.current = setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSaving(false);
      showToast({
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan saat menyimpan profil.',
        type: 'error',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity',
          isSaving && 'pointer-events-none'
        )}
        onClick={() => {
          if (!isSaving) onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl rounded-3xl bg-[#FFFCFA] p-5 sm:p-7 shadow-2xl transition-all z-10 max-h-[92vh] overflow-y-auto animate-fade-in border border-brand-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-brand-100/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
              <User className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Ganti Profil Akun
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbarui identitas, foto profil, dan preferensi mata uang Ardana Anda.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isSaving) onClose();
            }}
            disabled={isSaving}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successBanner && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profil berhasil disimpan & disinkronisasi ke seluruh aplikasi!</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* --- SECTION 1: AVATAR SELECTION --- */}
          <div className="rounded-2xl border border-brand-100 bg-white p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-brand-600" /> Foto Profil / Avatar
              </label>
              <button
                type="button"
                onClick={handleResetAvatar}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset ke Default
              </button>
            </div>

            {/* Avatar Preview & Quick Switcher */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl || PRESET_AVATARS[0].url}
                  alt={fullName || 'Avatar Profil'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
                  }}
                  className="w-20 h-20 rounded-full object-cover border-2 border-brand-500 shadow-md shadow-brand-900/10"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-brand-600 text-white shadow-md hover:bg-brand-700 transition-colors"
                  title="Unggah Foto Baru"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

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
                    Preset Avatar ({PRESET_AVATARS.length})
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
                <p className="text-[11px] text-slate-400">
                  Pilih foto dari preset atau unggah gambar sendiri dari galeri perangkat Anda.
                </p>
              </div>
            </div>

            {/* TAB CONTENT: PRESETS */}
            {avatarTab === 'preset' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Pilih salah satu karakter atau foto resmi:
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {PRESET_AVATARS.map((item) => {
                    const isSelected = avatarUrl === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(item.url);
                          setErrors((prev) => {
                            const rest = { ...prev };
                            delete rest.avatar;
                            return rest;
                          });
                        }}
                        className={cn(
                          'relative group rounded-full p-0.5 transition-all text-left focus:outline-none',
                          isSelected
                            ? 'ring-2 ring-brand-500 ring-offset-2 scale-105'
                            : 'hover:opacity-80 hover:scale-102 opacity-70'
                        )}
                        title={item.name}
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
                          }}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200"
                        />
                        {isSelected && (
                          <span className="absolute bottom-0 right-0 w-4 h-4 bg-brand-600 text-white rounded-full flex items-center justify-center text-[9px] shadow-sm">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: UPLOAD FILE */}
            {avatarTab === 'upload' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-brand-200 hover:border-brand-500 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-brand-50/40 hover:bg-brand-50/80"
                >
                  <Upload className="w-6 h-6 text-brand-600 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-800">
                    Klik di sini untuk memilih gambar
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mendukung JPG, PNG, atau WebP (Maks. 5MB)
                  </p>
                </div>
                {isUploading && (
                  <p className="text-xs text-brand-600 font-medium animate-pulse text-center">
                    Memproses & mengoptimasi gambar...
                  </p>
                )}
                {errors.avatar && (
                  <p className="text-xs text-red-600 font-medium">{errors.avatar}</p>
                )}
              </div>
            )}

            {/* TAB CONTENT: CUSTOM URL */}
            {avatarTab === 'url' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://images.unsplash.com/photo-..."
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCustomUrl();
                      }
                    }}
                    error={errors.avatarUrl}
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
              </div>
            )}
          </div>

          {/* --- SECTION 2: IDENTITY INPUT FIELDS --- */}
          <div className="space-y-4">
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
                    if (errors.fullName) {
                      setErrors((prev) => {
                        const rest = { ...prev };
                        delete rest.fullName;
                        return rest;
                      });
                    }
                  }}
                  placeholder="Nama Lengkap Anda"
                  error={errors.fullName}
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
                    if (errors.email) {
                      setErrors((prev) => {
                        const rest = { ...prev };
                        delete rest.email;
                        return rest;
                      });
                    }
                  }}
                  placeholder="contoh: budi.pratama@ardana.id"
                  error={errors.email}
                  className="pl-9"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Nomor HP */}
            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Nomor Handphone <span className="text-red-500">*</span>
                </label>
                {profile?.phone_verified ? (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Terverifikasi OTP
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Nomor Utama Telegram
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (errors.phoneNumber) {
                      setErrors((prev) => {
                        const rest = { ...prev };
                        delete rest.phoneNumber;
                        return rest;
                      });
                    }
                  }}
                  placeholder="081234567890"
                  error={errors.phoneNumber}
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
              <div className="relative">
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
              </div>
              <p className="text-[11px] text-slate-400">
                Format seluruh nilai transaksi dan laporan keuangan di aplikasi akan mengacu pada mata uang ini.
              </p>
            </div>
          </div>

          {/* --- MODAL FOOTER BUTTONS --- */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-100/60">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              className="px-6"
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
