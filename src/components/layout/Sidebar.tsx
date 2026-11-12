/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ViewMode } from '../../types';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Truck,
  Package,
  Boxes,
  Users,
  UserCheck,
  Undo2,
  Wallet,
  Landmark,
  BadgeDollarSign,
  TrendingUp,
  FileBarChart2,
  ShieldCheck,
  Settings,
  Database,
  History,
  FileText
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    language,
    activeView,
    setActiveView,
    products,
    spreadsheetId,
    activeCashSession
  } = useStore();

  const isAr = language === 'ar';

  // Count low stock items for badge
  const lowStockCount = products.filter(p => p.Current_Stock <= p.Minimum_Stock).length;

  const navigationItems: {
    id: ViewMode;
    labelAr: string;
    labelFr: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
    highlight?: boolean;
    section?: string;
  }[] = [
    {
      id: 'dashboard',
      labelAr: 'لوحة التحكم',
      labelFr: 'Tableau de Bord',
      icon: LayoutDashboard,
      section: isAr ? 'الرئيسية' : 'Principal'
    },
    {
      id: 'pos',
      labelAr: 'نقطة البيع السريع (POS)',
      labelFr: 'Point de Vente (POS)',
      icon: ShoppingCart,
      highlight: true,
      badge: activeCashSession ? (isAr ? 'مفتوح' : 'Ouvert') : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    },
    {
      id: 'sales',
      labelAr: 'فواتير البيع',
      labelFr: 'Factures de Vente',
      icon: Receipt
    },
    {
      id: 'purchases',
      labelAr: 'فواتير الشراء',
      labelFr: "Factures d'Achat",
      icon: Truck
    },
    {
      id: 'products',
      labelAr: 'المنتجات والمراجع',
      labelFr: 'Produits & Références',
      icon: Package,
      section: isAr ? 'المخزون والكتالوج' : 'Catalogue & Stock'
    },
    {
      id: 'inventory',
      labelAr: 'إدارة المخزون والجرد',
      labelFr: 'Gestion du Stock',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    },
    {
      id: 'suppliers',
      labelAr: 'الموردون ومقارنة الأسعار',
      labelFr: 'Fournisseurs & Prix',
      icon: Users
    },
    {
      id: 'customers',
      labelAr: 'العملاء والديون',
      labelFr: 'Clients & Crédits',
      icon: UserCheck
    },
    {
      id: 'returns',
      labelAr: 'المرتجعات',
      labelFr: 'Retours Marchandises',
      icon: Undo2
    },
    {
      id: 'cash',
      labelAr: 'الصندوق والورديات',
      labelFr: 'Caisse & Sessions',
      icon: Wallet,
      section: isAr ? 'المالية والمحاسبة' : 'Finance & Trésorerie'
    },
    {
      id: 'banks',
      labelAr: 'الحسابات البنكية',
      labelFr: 'Comptes Bancaires',
      icon: Landmark
    },
    {
      id: 'expenses',
      labelAr: 'مصاريف المحل',
      labelFr: 'Dépenses & Frais',
      icon: BadgeDollarSign
    },
    {
      id: 'profits',
      labelAr: 'المحرك المالي والأرباح',
      labelFr: 'Moteur Financier & Bénéfices',
      icon: TrendingUp
    },
    {
      id: 'reports',
      labelAr: 'مركز التقارير والإحصائيات',
      labelFr: 'Rapports & Statistiques',
      icon: FileBarChart2
    },
    {
      id: 'users',
      labelAr: 'المستخدمون والصلاحيات',
      labelFr: 'Utilisateurs & Rôles',
      icon: ShieldCheck,
      section: isAr ? 'النظام وقاعدة البيانات' : 'Système & Données'
    },
    {
      id: 'settings',
      labelAr: 'إعدادات وهوية المحل',
      labelFr: 'Paramètres du Magasin',
      icon: Settings
    },
    {
      id: 'database',
      labelAr: 'Google Sheets Database',
      labelFr: 'Google Sheets Database',
      icon: Database,
      highlight: !spreadsheetId,
      badge: spreadsheetId ? '20+ Tables' : (isAr ? 'غير مرتبط' : 'Non lié'),
      badgeColor: spreadsheetId ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
    },
    {
      id: 'backup',
      labelAr: 'النسخ الاحتياطي والاستعادة',
      labelFr: 'Sauvegarde & Restauration',
      icon: History
    },
    {
      id: 'audit',
      labelAr: 'سجل العمليات والتدقيق',
      labelFr: "Journal d'Audit",
      icon: FileText
    }
  ];

  const handleSelect = (id: ViewMode) => {
    setActiveView(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 z-40 w-64 bg-slate-900 border-e border-slate-800 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 rtl:translate-x-full rtl:lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navigationItems.map((item, index) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;

            return (
              <React.Fragment key={item.id}>
                {item.section && (
                  <div className={`text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-3 pb-1.5 ${index > 0 ? 'pt-4' : 'pt-1'}`}>
                    {item.section}
                  </div>
                )}
                <button
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : item.highlight
                      ? 'bg-slate-800/80 text-amber-400 border border-amber-500/30 hover:bg-slate-800 hover:text-amber-300'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-slate-950' : item.highlight ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'
                      }`}
                    />
                    <span className="truncate">{isAr ? item.labelAr : item.labelFr}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold shrink-0 ${
                        isActive ? 'bg-slate-950/20 text-slate-950' : item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Database Footer info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="truncate">Google Sheets v4 API</span>
          </div>
          <span className="font-mono text-slate-500">v1.0</span>
        </div>
      </aside>
    </>
  );
};
