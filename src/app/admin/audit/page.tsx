'use client';

import * as React from 'react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { AuditLog } from '@/types';
import { formatWIBDate } from '@/lib/utils';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function AdminAuditPage() {
  const [logs, setLogs] = React.useState<AuditLog[]>(tatadanaDb.getAuditLogs());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Audit Security Logs 🔒
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Catatan rekam jejak setiap aksi administratif yang mengakses data pengguna atau merubah konfigurasi sistem.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Tindakan (Action)</th>
                <th className="py-3 px-4">Target User ID</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Detail Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {formatWIBDate(log.created_at, true)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {log.admin_email || 'admin@ardana.id'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-rose-400 font-bold uppercase text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {log.target_user_id || '-'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

