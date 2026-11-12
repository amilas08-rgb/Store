/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { FileText, Search, ShieldCheck, Clock, User, Filter } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { language, auditLogs } = useStore();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter(log => {
    if (moduleFilter !== 'ALL' && log.Module !== moduleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.Action.toLowerCase().includes(q) ||
        log.Description.toLowerCase().includes(q) ||
        log.Record_ID.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const modules = Array.from(new Set(auditLogs.map(l => l.Module)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'سجل العمليات والتدقيق (AUDIT_LOGS)' : 'Journal d’Audit'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? 'سجل غير قابل للتعديل يوثق جميع العمليات والتغييرات ومسؤول التنفيذ'
              : 'Traçabilité complète des actions effectuées'}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث بالعملية، الوصف، معرف السجل...' : 'Recherche...'}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-9 pe-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none w-full md:w-auto"
        >
          <option value="ALL">{isAr ? 'جميع الأقسام' : 'Tous les modules'}</option>
          {modules.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 text-start">{isAr ? 'الوقت والتاريخ' : 'Date & Heure'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'المستخدم' : 'Utilisateur'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'القسم / Module' : 'Module'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'نوع العملية' : 'Action'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'معرف السجل' : 'Réf'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'البيان والتفاصيل' : 'Description'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map(log => (
                <tr key={log.Log_ID} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.Timestamp).toLocaleString('ar-MA')}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-300">{log.User_ID}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {log.Module}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{log.Action}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-400">{log.Record_ID}</td>
                  <td className="py-2.5 px-4 text-slate-200">{log.Description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
