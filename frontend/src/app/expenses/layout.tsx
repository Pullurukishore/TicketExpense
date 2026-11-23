'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Receipt,
  FilePlus,
  CreditCard,
  CheckSquare,
  BarChart3,
  ArrowLeft,
  User,
  LogOut,
} from 'lucide-react';

export default function ExpensesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isApprover = user?.role === 'ADMIN' || user?.role === 'ZONE_MANAGER' || user?.role === 'ZONE_USER';

  const navItems = [
    { href: '/expenses', label: 'Claims Overview', icon: Receipt },
    { href: '/expenses/new', label: 'New Claim', icon: FilePlus },
    { href: '/expenses/advances', label: 'Cash Advances', icon: CreditCard },
    ...(isApprover ? [{ href: '/expenses/approvals', label: 'Approvals Queue', icon: CheckSquare }] : []),
    { href: '/expenses/reports', label: 'POSO & Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#161b22] border-r border-gray-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-gray-800">
            <button
              onClick={() => router.push('/module-select')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 mb-3 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Modules
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base text-white tracking-tight">Raydoo Expenses</h1>
                <p className="text-xs text-gray-400">Kardex Expense System</p>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                      : 'text-gray-300 hover:bg-gray-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-gray-800/80 bg-gray-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{user?.role || 'Guest'}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0d1117]">
        {children}
      </main>
    </div>
  );
}
