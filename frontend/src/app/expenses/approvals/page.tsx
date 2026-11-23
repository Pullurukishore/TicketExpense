'use client';

import React, { useState, useEffect } from 'react';
import { expenseService } from '@/services/expense.service';
import { CheckSquare, Check, X, User, Clock, FileText, AlertCircle } from 'lucide-react';

export default function ApprovalsQueuePage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await expenseService.getPendingApprovals();
      setClaims(res.claims || []);
      setAdvances(res.advances || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimAction(id: number, approve: boolean) {
    const comments = prompt(`Enter comments for ${approve ? 'approval' : 'rejection'}:`, approve ? 'Approved' : 'Rejected');
    if (comments === null) return;
    try {
      setProcessingId(id);
      if (approve) {
        await expenseService.approveExpense(id, comments);
      } else {
        await expenseService.rejectExpense(id, comments);
      }
      loadQueue();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleAdvanceAction(id: number, approve: boolean) {
    const comments = prompt(`Enter comments for ${approve ? 'approval' : 'rejection'}:`, approve ? 'Approved' : 'Rejected');
    if (comments === null) return;
    try {
      setProcessingId(id);
      if (approve) {
        await expenseService.approveAdvance(id, comments);
      } else {
        await expenseService.rejectAdvance(id, comments);
      }
      loadQueue();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Approvals Queue</h2>
        <p className="text-sm text-gray-400">Review, verify, and approve field claims and advance requests</p>
      </div>

      {/* Pending Expense Claims */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <Clock className="w-4 h-4" />
          <span>Pending Expense Claims ({claims.length})</span>
        </div>

        <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading queue...</div>
          ) : claims.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No claims pending approval.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {claims.map((claim) => (
                <div key={claim.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-800/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-300">{claim.claimNumber}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">{claim.submitter?.name} ({claim.submitter?.employeeCode || claim.submitter?.email})</span>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {claim.ticket ? `Ticket #${claim.ticket.ticketNumber || claim.ticket.id}: ${claim.ticket.title}` : claim.purpose}
                    </div>
                    <div className="text-xs text-gray-400">
                      Customer: <span className="text-gray-300">{claim.customer || '—'}</span> | Site: <span className="text-gray-300">{claim.location || '—'}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Items: {claim.items?.map((it: any) => `${it.category} (₹${it.amount})`).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-bold text-white font-mono">₹{(claim.totalAmount || 0).toLocaleString()}</div>
                      <div className="text-[11px] text-gray-400">{claim.receipts ? 'Has Receipts Attached' : 'No Receipts'}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={processingId === claim.id}
                        onClick={() => handleClaimAction(claim.id, false)}
                        className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
                      >
                        <X className="w-4 h-4 inline mr-1" /> Reject
                      </button>
                      <button
                        disabled={processingId === claim.id}
                        onClick={() => handleClaimAction(claim.id, true)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors"
                      >
                        <Check className="w-4 h-4 inline mr-1" /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Cash Advances */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <Clock className="w-4 h-4" />
          <span>Pending Cash Advances ({advances.length})</span>
        </div>

        <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading queue...</div>
          ) : advances.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No cash advances pending approval.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {advances.map((adv) => (
                <div key={adv.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-800/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-300">{adv.advanceNumber}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">{adv.requester?.name}</span>
                    </div>
                    <div className="text-sm font-semibold text-white">{adv.purpose}</div>
                    <div className="text-xs text-gray-400">Customer: {adv.customer} | Site: {adv.location}</div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-bold text-white font-mono">₹{(adv.amount || 0).toLocaleString()}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={processingId === adv.id}
                        onClick={() => handleAdvanceAction(adv.id, false)}
                        className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold"
                      >
                        <X className="w-4 h-4 inline mr-1" /> Reject
                      </button>
                      <button
                        disabled={processingId === adv.id}
                        onClick={() => handleAdvanceAction(adv.id, true)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        <Check className="w-4 h-4 inline mr-1" /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
