'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { expenseService } from '@/services/expense.service';
import {
  Plus,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
  Send,
  Trash2,
  Eye,
  AlertCircle,
} from 'lucide-react';

export default function ExpensesOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, claimsRes] = await Promise.all([
        expenseService.getDashboardStats().catch(() => null),
        expenseService.getExpenses(filterStatus ? { status: filterStatus } : {}),
      ]);
      setStats(statsRes);
      setClaims(claimsRes.expenses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(id: number) {
    if (!confirm('Submit this expense claim for approval?')) return;
    try {
      await expenseService.submitExpense(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this draft claim?')) return;
    try {
      await expenseService.deleteExpense(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-gray-700 text-gray-300 font-medium">Draft</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">Pending Approval</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">Approved</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30">Rejected</span>;
      case 'PAID':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">Paid</span>;
      default:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-gray-800 text-gray-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Expense Claims</h2>
          <p className="text-sm text-gray-400">Manage field visit allowances, fuel, hotel, and travel claims</p>
        </div>
        <Link
          href="/expenses/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Expense Claim
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#161b22] border border-gray-800">
          <div className="flex items-center gap-2.5 text-gray-400 text-xs font-medium mb-1">
            <FileText className="w-4 h-4 text-indigo-400" /> Total Claims
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalClaims ?? 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#161b22] border border-gray-800">
          <div className="flex items-center gap-2.5 text-gray-400 text-xs font-medium mb-1">
            <Clock className="w-4 h-4 text-amber-400" /> Pending Approval
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats?.pendingClaims ?? 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#161b22] border border-gray-800">
          <div className="flex items-center gap-2.5 text-gray-400 text-xs font-medium mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Approved Claims
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats?.approvedClaims ?? 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#161b22] border border-gray-800">
          <div className="flex items-center gap-2.5 text-gray-400 text-xs font-medium mb-1">
            <DollarSign className="w-4 h-4 text-indigo-400" /> Approved Total
          </div>
          <p className="text-2xl font-bold text-white">₹{(stats?.approvedAmount ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-3 overflow-x-auto">
        {[
          { label: 'All Claims', val: '' },
          { label: 'Drafts', val: 'DRAFT' },
          { label: 'Pending', val: 'PENDING' },
          { label: 'Approved', val: 'APPROVED' },
          { label: 'Rejected', val: 'REJECTED' },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => setFilterStatus(tab.val)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === tab.val
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Claims List Table */}
      <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading expense claims...</div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No expense claims found.</p>
            <Link href="/expenses/new" className="text-xs text-indigo-400 hover:underline mt-1 inline-block">
              Create your first claim &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#0f141c] text-xs uppercase text-gray-400 tracking-wider border-b border-gray-800">
                <tr>
                  <th className="px-5 py-3.5">Claim #</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Ticket / Visit Purpose</th>
                  <th className="px-5 py-3.5">Customer & Site</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-semibold text-indigo-300 text-xs">
                      {claim.claimNumber}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {new Date(claim.claimDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {claim.ticket ? (
                        <div className="text-xs font-semibold text-white">
                          #{claim.ticket.ticketNumber || claim.ticket.id}: {claim.ticket.title}
                        </div>
                      ) : claim.ticketNo ? (
                        <div className="text-xs font-medium text-white">Ticket: {claim.ticketNo}</div>
                      ) : null}
                      <div className="text-xs text-gray-400 truncate max-w-xs">{claim.purpose || 'Field Service Visit'}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-300">
                      <div>{claim.customer || '—'}</div>
                      <div className="text-[11px] text-gray-400">{claim.location || '—'}</div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-white">
                      ₹{(claim.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      {claim.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => handleSubmit(claim.id)}
                            title="Submit for Approval"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                          >
                            <Send className="w-3 h-3" /> Submit
                          </button>
                          <button
                            onClick={() => handleDelete(claim.id)}
                            title="Delete Draft"
                            className="p-1 rounded-lg text-gray-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
