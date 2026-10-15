'use client';

import * as React from 'react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { AILog } from '@/types';
import { formatWIBDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Cpu, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AdminLogsPage() {
  const [logs, setLogs] = React.useState<AILog[]>(tatadanaDb.getAILogs());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          AI Execution Logs 🪵
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Pantau riwayat pemanggilan LLM, latensi per provider, konsumsi token, dan estimasi biaya operasional.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Provider & Model</th>
                <th className="py-3 px-4">Task Type</th>
                <th className="py-3 px-4">Tokens</th>
                <th className="py-3 px-4">Latensi</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {formatWIBDate(log.created_at, true)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block capitalize">{log.provider}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{log.model}</span>
                  </td>
                  <td className="py-3 px-4 font-mono uppercase text-rose-400 font-semibold">
                    {log.task_type.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-200">
                    {log.tokens_used} tok
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-200">
                    {log.latency_ms} ms
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={log.status === 'success' ? 'success' : 'danger'}>
                      {log.status.toUpperCase()}
                    </Badge>
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

