/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { User, Role, Permission } from '../../types';
import { ShieldCheck, Users, Lock, Key, CheckCircle2, UserPlus, X } from 'lucide-react';

export const UsersRolesView: React.FC = () => {
  const { language, users, roles, permissions } = useStore();
  const isAr = language === 'ar';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'المستخدمون والصلاحيات والأدوار' : 'Utilisateurs & Permissions'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? 'إدارة صلاحيات الوصول لنقاط البيع، تعديل الأسعار، وجداول Google Sheets'
              : 'Gestion des rôles et droits d’accès'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* USERS LIST */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'مستخدمو النظام والمحل' : 'Utilisateurs'}</span>
          </h3>

          <div className="space-y-3">
            {users.map(u => (
              <div key={u.User_ID} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-white">{u.Full_Name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{u.Email}</p>
                </div>
                <div className="text-end">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 font-mono">
                    {u.Role_ID}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-1">● Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROLES & PERMISSIONS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'الأدوار الإدارية والصلاحيات' : 'Rôles & Droits'}</span>
          </h3>

          <div className="space-y-3">
            {roles.map(r => (
              <div key={r.Role_ID} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">{r.Role_Name}</h4>
                  <span className="font-mono text-[10px] text-slate-500">{r.Role_ID}</span>
                </div>
                <p className="text-slate-400 text-[11px]">{r.Description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">
            {isAr ? 'مصفوفة الصلاحيات المعتمدة في النظام' : 'Matrice des Permissions'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 text-start">{isAr ? 'الصلاحية' : 'Permission'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'الوحدة' : 'Module'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'العملية' : 'Action'}</th>
                <th className="py-2.5 px-4 text-center">Admin</th>
                <th className="py-2.5 px-4 text-center">Manager</th>
                <th className="py-2.5 px-4 text-center">Cashier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {permissions.map(p => (
                <tr key={p.Permission_ID} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-semibold text-slate-200">{p.Permission_Name}</td>
                  <td className="py-2.5 px-4 text-slate-400 font-mono">{p.Module}</td>
                  <td className="py-2.5 px-4 text-slate-400">{p.Action}</td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center">
                    {p.Module !== 'Settings' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-slate-600">-</span>}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {p.Module === 'POS' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-slate-600">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
