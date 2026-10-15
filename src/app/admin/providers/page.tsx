'use client';

import * as React from 'react';
import {
  Cpu,
  Save,
  CheckCircle2,
  Sparkles,
  Key,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { AIProviderConfig, AISettings } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function AdminProvidersPage() {
  const [providers, setProviders] = React.useState<AIProviderConfig[]>(tatadanaDb.getAIProviders());
  const [settings, setSettings] = React.useState<AISettings>(tatadanaDb.getAISettings());
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const handleToggleActive = (id: string, current: boolean) => {
    tatadanaDb.updateAIProvider(id, { is_active: !current });
    setProviders(tatadanaDb.getAIProviders());
  };

  const handleSaveSettings = () => {
    tatadanaDb.updateAISettings(settings);
    tatadanaDb.addAuditLog('update_ai_settings', undefined, settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Kelola AI Multi-Provider 🤖
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Konfigurasikan model Gemini, GPT, dan DeepSeek. Atur mode Single Provider atau Paralel Failover.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Pengaturan AI Provider berhasil diperbarui!</span>
        </div>
      )}

      {/* Mode Selection Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
        <h3 className="font-bold text-white text-base">Arsitektur Eksekusi AI</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setSettings({ ...settings, mode: 'single' })}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              settings.mode === 'single'
                ? 'border-brand-500 bg-rose-950/20'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-white">Mode Single Provider</span>
              {settings.mode === 'single' && <Badge variant="brand">Aktif</Badge>}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Semua permintaan parsing teks, foto struk, dan STT diarahkan hanya ke 1 provider utama terpilih.
            </p>
          </div>

          <div
            onClick={() => setSettings({ ...settings, mode: 'parallel_failover' })}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              settings.mode === 'parallel_failover'
                ? 'border-brand-500 bg-rose-950/20'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-white">Mode Paralel Failover (Rekomendasi)</span>
              {settings.mode === 'parallel_failover' && <Badge variant="brand">Aktif</Badge>}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jika provider utama mengalami rate limit atau timeout, sistem otomatis failover ke provider sekunder tanpa henti.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Provider Utama (Primary)
            </label>
            <select
              value={settings.primary_provider}
              onChange={(e) => setSettings({ ...settings, primary_provider: e.target.value as any })}
              className="w-full h-10 rounded-xl bg-slate-900 border border-slate-800 px-3 text-slate-200 text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="gemini">Google Gemini (Flash 1.5/2.0) — Vision & Audio STT</option>
              <option value="openai">OpenAI (GPT-4o Mini)</option>
              <option value="deepseek">DeepSeek (V3 Chat)</option>
            </select>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Provider Cadangan (Fallback Failover)
            </label>
            <select
              value={settings.fallback_provider}
              onChange={(e) => setSettings({ ...settings, fallback_provider: e.target.value as any })}
              className="w-full h-10 rounded-xl bg-slate-900 border border-slate-800 px-3 text-slate-200 text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="openai">OpenAI (GPT-4o Mini)</option>
              <option value="deepseek">DeepSeek (V3 Chat)</option>
              <option value="gemini">Google Gemini (Flash 1.5)</option>
            </select>
          </div>
        </div>

        <Button onClick={handleSaveSettings} className="bg-brand-600 hover:bg-rose-500">
          <Save className="w-4 h-4 mr-1.5" /> Simpan Arsitektur AI
        </Button>
      </div>

      {/* Provider Details Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
        <h3 className="font-bold text-white text-base">Daftar Provider & API Keys Terenkripsi</h3>

        <div className="space-y-4">
          {providers.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{p.display_name}</span>
                  <Badge variant={p.is_active ? 'success' : 'slate'} className="text-[10px]">
                    {p.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                  {p.supports_vision && <Badge variant="outline" className="text-[10px] text-purple-400">Vision OCR</Badge>}
                  {p.supports_audio && <Badge variant="outline" className="text-[10px] text-emerald-400">Audio STT</Badge>}
                </div>
                <div className="text-slate-400 font-mono text-[11px] flex items-center gap-2">
                  <span>Model: {p.model_name}</span>
                  <span>•</span>
                  <span>Key: {p.api_key_encrypted}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(p.id, p.is_active)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                    p.is_active
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800 hover:bg-rose-900'
                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                  }`}
                >
                  {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


