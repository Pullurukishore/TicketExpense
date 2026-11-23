'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, Download, Search, FileSpreadsheet, Layers, Users, MapPin,
  Shield, AlertCircle, CheckCircle2, ArrowUpDown, ChevronRight,
  Sparkles, Filter, ExternalLink, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  PivotMachineItem,
  ContractPivotData,
  computeContractPivots,
  exportContractPivotToExcel
} from '@/lib/contract-pivot';

interface ContractPivotTableProps {
  machines: PivotMachineItem[];
  onDrillDown?: (filters: {
    engineer?: string;
    zone?: string;
    contractType?: string;
    customerClass?: string;
    unitType?: string;
  }) => void;
  filterSummaryText?: string;
}

type PivotTab = 'engineer_zone' | 'zone' | 'class' | 'unit_type';

export default function ContractPivotTable({
  machines,
  onDrillDown,
  filterSummaryText,
}: ContractPivotTableProps) {
  const [activeTab, setActiveTab] = useState<PivotTab>('engineer_zone');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  // Compute all pivot aggregations
  const pivotData: ContractPivotData = useMemo(() => {
    return computeContractPivots(machines);
  }, [machines]);

  // Currency Formatter
  const fmtCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined || val === 0) return '—';
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const fmtCurrencyFull = (val: number | null | undefined) => {
    if (val === null || val === undefined || val === 0) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const fmtCount = (val: number | null | undefined) => {
    if (val === null || val === undefined || val === 0) return '—';
    return Number(val).toLocaleString('en-IN');
  };

  // Filtered rows based on internal search query
  const filteredEngineerRows = useMemo(() => {
    if (!searchQuery.trim()) return pivotData.engineerZoneRows;
    const q = searchQuery.toLowerCase();
    return pivotData.engineerZoneRows.filter(
      r => r.engineer.toLowerCase().includes(q) || r.zone.toLowerCase().includes(q)
    );
  }, [pivotData.engineerZoneRows, searchQuery]);

  const filteredZoneRows = useMemo(() => {
    if (!searchQuery.trim()) return pivotData.zoneRows;
    const q = searchQuery.toLowerCase();
    return pivotData.zoneRows.filter(r => r.zone.toLowerCase().includes(q));
  }, [pivotData.zoneRows, searchQuery]);

  const filteredClassRows = useMemo(() => {
    if (!searchQuery.trim()) return pivotData.classRows;
    const q = searchQuery.toLowerCase();
    return pivotData.classRows.filter(r => r.customerClass.toLowerCase().includes(q));
  }, [pivotData.classRows, searchQuery]);

  const filteredUnitTypeRows = useMemo(() => {
    if (!searchQuery.trim()) return pivotData.unitTypeRows;
    const q = searchQuery.toLowerCase();
    return pivotData.unitTypeRows.filter(r => r.unitType.toLowerCase().includes(q));
  }, [pivotData.unitTypeRows, searchQuery]);

  // Handle Excel Export
  const handleExport = async () => {
    try {
      setExporting(true);
      await exportContractPivotToExcel(
        pivotData,
        filterSummaryText ? `Filtered: ${filterSummaryText}` : 'All Contract Records'
      );
      toast.success('Pivot table exported to Excel successfully!');
    } catch (err) {
      console.error('Failed to export pivot table to Excel:', err);
      toast.error('Failed to export Pivot table. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ======================================================== */}
      {/* 1. TOP METRIC SUMMARY CARDS                               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total Machines */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Machines</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {pivotData.totalMachines.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">units</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-500 truncate">
            {fmtCurrencyFull(pivotData.totals.totalValue)}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-400 group-hover:h-1 transition-all" />
        </div>

        {/* UMC Under Contract */}
        <div className="bg-white border border-sky-200/80 rounded-xl p-3.5 shadow-xs relative overflow-hidden group hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Under Contract (UMC)</span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-950 tabular-nums">
              {pivotData.totals.umcCount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md">
              {pivotData.umcRate.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-sky-800 truncate">
            {fmtCurrencyFull(pivotData.totals.umcValue)}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 group-hover:h-1 transition-all" />
        </div>

        {/* Non-Contract (NO) */}
        <div className="bg-white border border-amber-200/80 rounded-xl p-3.5 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Non-Contract (NO)</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-950 tabular-nums">
              {pivotData.totals.noCount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
              {pivotData.totalMachines > 0
                ? ((pivotData.totals.noCount / pivotData.totalMachines) * 100).toFixed(1)
                : '0'}%
            </span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-amber-800 truncate">
            {fmtCurrencyFull(pivotData.totals.noValue)}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 group-hover:h-1 transition-all" />
        </div>

        {/* Under Warranty (UW) */}
        <div className="bg-white border border-emerald-200/80 rounded-xl p-3.5 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Under Warranty (UW)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Shield className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950 tabular-nums">
              {pivotData.totals.uwCount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              {pivotData.totalMachines > 0
                ? ((pivotData.totals.uwCount / pivotData.totalMachines) * 100).toFixed(1)
                : '0'}%
            </span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-emerald-800 truncate">
            {fmtCurrencyFull(pivotData.totals.uwValue)}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 group-hover:h-1 transition-all" />
        </div>

        {/* Total Contract Portfolio Value */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-3.5 shadow-xs relative overflow-hidden col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Portfolio Value</span>
            <span className="p-1.5 rounded-lg bg-white/10 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-white tabular-nums tracking-tight">
              {fmtCurrencyFull(pivotData.totals.totalValue)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-300 font-medium">
            Active UMC: {((pivotData.totals.umcValue / (pivotData.totals.totalValue || 1)) * 100).toFixed(1)}%
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SUB-TABS & TOOLBAR                                    */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Sub-tab selection */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('engineer_zone')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'engineer_zone'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span>Engineer & Zone Matrix</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] text-slate-600">
                {pivotData.engineerZoneRows.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('zone')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'zone'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zone Summary</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] text-slate-600">
                {pivotData.zoneRows.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('class')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'class'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Customer Class</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] text-slate-600">
                {pivotData.classRows.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('unit_type')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'unit_type'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-purple-600" />
              <span>Unit Type</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] text-slate-600">
                {pivotData.unitTypeRows.length}
              </span>
            </button>
          </div>

          {/* Search within pivot & Excel export */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter rows..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-sky-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting}
              size="sm"
              className="h-8 px-3 text-xs font-bold bg-[#1F3864] hover:bg-[#162746] text-white flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{exporting ? 'Exporting...' : 'Export Pivot (.xlsx)'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. PIVOT TABLES                                          */}
      {/* ======================================================== */}

      {/* TAB 1: ENGINEER & ZONE MATRIX (EXCEL TABLE 1 EQUIVALENT) */}
      {activeTab === 'engineer_zone' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                {/* Super-Header Row */}
                <tr className="bg-slate-900 text-white font-bold text-[11px] border-b border-slate-800">
                  <th colSpan={2} className="px-3 py-2 border-r border-slate-800 tracking-wide">
                    ENGINEER & ZONE
                  </th>
                  <th colSpan={4} className="px-3 py-2 text-center border-r border-slate-800 bg-slate-800/80 tracking-wide text-sky-200">
                    COUNT OF SERIAL NUMBER (MACHINES)
                  </th>
                  <th colSpan={4} className="px-3 py-2 text-center tracking-wide text-emerald-200 bg-slate-800/50">
                    SUM OF MC VALUE (₹)
                  </th>
                  <th rowSpan={2} className="px-3 py-2 text-center w-20">
                    ACTION
                  </th>
                </tr>
                {/* Sub-Header Row */}
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="px-3 py-2 text-left w-36">Kdx Engineer</th>
                  <th className="px-3 py-2 text-left w-24 border-r border-slate-200">Zone</th>

                  {/* Machine Counts */}
                  <th className="px-3 py-2 text-right text-slate-600 w-16">NO</th>
                  <th className="px-3 py-2 text-right text-sky-700 w-20">UMC</th>
                  <th className="px-3 py-2 text-right text-emerald-700 w-16">UW</th>
                  <th className="px-3 py-2 text-right font-black text-slate-900 bg-slate-200/50 border-r border-slate-200 w-24">
                    Total Count
                  </th>

                  {/* Values */}
                  <th className="px-3 py-2 text-right text-slate-600 w-28">NO (₹)</th>
                  <th className="px-3 py-2 text-right text-sky-800 w-32">UMC (₹)</th>
                  <th className="px-3 py-2 text-right text-emerald-800 w-24">UW (₹)</th>
                  <th className="px-3 py-2 text-right font-black text-slate-900 bg-slate-200/50 w-36">
                    Total Value (₹)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEngineerRows.map((r, idx) => (
                  <tr
                    key={`${r.engineer}-${r.zone}-${idx}`}
                    className="hover:bg-sky-50/40 transition-colors group"
                  >
                    <td className="px-3 py-2 font-bold text-slate-900 whitespace-nowrap">
                      {r.engineer}
                    </td>
                    <td className="px-3 py-2 text-slate-600 border-r border-slate-100 whitespace-nowrap font-medium">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.zone}
                      </span>
                    </td>

                    {/* Machine Counts */}
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500 font-medium">
                      {fmtCount(r.noCount)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-sky-700">
                      {fmtCount(r.umcCount)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700 font-medium">
                      {fmtCount(r.uwCount)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-black text-slate-900 bg-slate-50/80 border-r border-slate-100">
                      {fmtCount(r.totalCount)}
                    </td>

                    {/* Values */}
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500 font-mono text-[11px]">
                      {fmtCurrency(r.noValue)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-sky-900 font-mono text-[11px]">
                      {fmtCurrency(r.umcValue)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-800 font-mono text-[11px]">
                      {fmtCurrency(r.uwValue)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-black text-slate-900 bg-slate-50/80 font-mono text-[11px]">
                      {fmtCurrency(r.totalValue)}
                    </td>

                    {/* Drill-down action */}
                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      {onDrillDown && (
                        <button
                          onClick={() => onDrillDown({ engineer: r.engineer, zone: r.zone })}
                          title={`View details for ${r.engineer} (${r.zone})`}
                          className="px-2 py-1 text-[10.5px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md border border-sky-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredEngineerRows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      No matching engineer or zone records found.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Grand Total Row */}
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-[11.5px]">
                  <td colSpan={2} className="px-3 py-2.5 font-black uppercase tracking-wider border-r border-slate-800">
                    Grand Total
                  </td>

                  {/* Total Counts */}
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">
                    {fmtCount(pivotData.totals.noCount)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-sky-300 font-black">
                    {fmtCount(pivotData.totals.umcCount)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-emerald-300">
                    {fmtCount(pivotData.totals.uwCount)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-black text-white bg-slate-800 border-r border-slate-800">
                    {fmtCount(pivotData.totals.totalCount)}
                  </td>

                  {/* Total Values */}
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-300 font-mono">
                    {fmtCurrencyFull(pivotData.totals.noValue)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-sky-300 font-mono font-black">
                    {fmtCurrencyFull(pivotData.totals.umcValue)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-emerald-300 font-mono">
                    {fmtCurrencyFull(pivotData.totals.uwValue)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-black text-white bg-slate-800 font-mono">
                    {fmtCurrencyFull(pivotData.totals.totalValue)}
                  </td>
                  <td className="px-3 py-2.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ZONE SUMMARY (EXCEL TABLE 2 EQUIVALENT) */}
      {activeTab === 'zone' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px]">
                  <th className="px-4 py-3 text-left">ZONE</th>
                  <th className="px-4 py-3 text-right">NO (EXPIRED)</th>
                  <th className="px-4 py-3 text-right text-sky-300">UMC (UNDER CONTRACT)</th>
                  <th className="px-4 py-3 text-right text-emerald-300">UW (WARRANTY)</th>
                  <th className="px-4 py-3 text-right bg-slate-800 text-white font-black">TOTAL MACHINES</th>
                  <th className="px-4 py-3 text-right">TOTAL VALUE (₹)</th>
                  <th className="px-4 py-3 text-right">CONTRACT PENETRATION %</th>
                  <th className="px-4 py-3 text-center w-24">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredZoneRows.map((z, idx) => (
                  <tr key={`${z.zone}-${idx}`} className="hover:bg-sky-50/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      <span className="text-sm font-black">{z.zone}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 font-medium">
                      {fmtCount(z.noCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-sky-700">
                      {fmtCount(z.umcCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">
                      {fmtCount(z.uwCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900 bg-slate-50 text-sm">
                      {fmtCount(z.totalCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900 font-mono text-[11.5px]">
                      {fmtCurrencyFull(z.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, z.umcPercentage)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 text-xs w-11 text-right">
                          {z.umcPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {onDrillDown && (
                        <button
                          onClick={() => onDrillDown({ zone: z.zone })}
                          className="px-2 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md border border-sky-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Filter</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-xs">
                  <td className="px-4 py-3 font-black uppercase tracking-wider">Grand Total</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                    {fmtCount(pivotData.totals.noCount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sky-300 font-black">
                    {fmtCount(pivotData.totals.umcCount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-300">
                    {fmtCount(pivotData.totals.uwCount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-black text-white bg-slate-800 text-sm">
                    {fmtCount(pivotData.totals.totalCount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono font-black text-white">
                    {fmtCurrencyFull(pivotData.totals.totalValue)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-black text-sky-300">
                    {pivotData.umcRate.toFixed(1)}% Overall
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER CLASS SUMMARY */}
      {activeTab === 'class' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px]">
                  <th className="px-4 py-3 text-left">CUSTOMER CLASS</th>
                  <th className="px-4 py-3 text-right">NO (EXPIRED)</th>
                  <th className="px-4 py-3 text-right text-sky-300">UMC (UNDER CONTRACT)</th>
                  <th className="px-4 py-3 text-right text-emerald-300">UW (WARRANTY)</th>
                  <th className="px-4 py-3 text-right bg-slate-800 text-white font-black">TOTAL MACHINES</th>
                  <th className="px-4 py-3 text-right">TOTAL VALUE (₹)</th>
                  <th className="px-4 py-3 text-right">UMC % SHARE</th>
                  <th className="px-4 py-3 text-center w-24">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClassRows.map((c, idx) => (
                  <tr key={`${c.customerClass}-${idx}`} className="hover:bg-sky-50/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-black bg-slate-100 border border-slate-200 text-slate-800">
                        Class {c.customerClass}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 font-medium">
                      {fmtCount(c.noCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-sky-700">
                      {fmtCount(c.umcCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">
                      {fmtCount(c.uwCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900 bg-slate-50 text-sm">
                      {fmtCount(c.totalCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900 font-mono text-[11.5px]">
                      {fmtCurrencyFull(c.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">
                      {c.umcPercentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      {onDrillDown && (
                        <button
                          onClick={() => onDrillDown({ customerClass: c.customerClass })}
                          className="px-2 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md border border-sky-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Filter</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-xs">
                  <td className="px-4 py-3 font-black uppercase tracking-wider">Grand Total</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                    {fmtCount(pivotData.totals.noCount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sky-300 font-black">
                    {fmtCount(pivotData.totals.umcCount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-300">
                    {fmtCount(pivotData.totals.uwCount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-black text-white bg-slate-800 text-sm">
                    {fmtCount(pivotData.totals.totalCount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono font-black text-white">
                    {fmtCurrencyFull(pivotData.totals.totalValue)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-black text-sky-300">
                    {pivotData.umcRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: UNIT TYPE SUMMARY */}
      {activeTab === 'unit_type' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px]">
                  <th className="px-4 py-3 text-left">UNIT TYPE / MODEL</th>
                  <th className="px-4 py-3 text-right">NO (EXPIRED)</th>
                  <th className="px-4 py-3 text-right text-sky-300">UMC (UNDER CONTRACT)</th>
                  <th className="px-4 py-3 text-right text-emerald-300">UW (WARRANTY)</th>
                  <th className="px-4 py-3 text-right bg-slate-800 text-white font-black">TOTAL MACHINES</th>
                  <th className="px-4 py-3 text-right">TOTAL VALUE (₹)</th>
                  <th className="px-4 py-3 text-right">UMC % SHARE</th>
                  <th className="px-4 py-3 text-center w-24">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUnitTypeRows.map((u, idx) => (
                  <tr key={`${u.unitType}-${idx}`} className="hover:bg-sky-50/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {u.unitType}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 font-medium">
                      {fmtCount(u.noCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-sky-700">
                      {fmtCount(u.umcCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">
                      {fmtCount(u.uwCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900 bg-slate-50 text-sm">
                      {fmtCount(u.totalCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900 font-mono text-[11.5px]">
                      {fmtCurrencyFull(u.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">
                      {u.umcPercentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      {onDrillDown && (
                        <button
                          onClick={() => onDrillDown({ unitType: u.unitType })}
                          className="px-2 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md border border-sky-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Filter</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-xs">
                  <td className="px-4 py-3 font-black uppercase tracking-wider">Grand Total</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                    {fmtCount(pivotData.totals.noCount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sky-300 font-black">
                    {fmtCount(pivotData.totals.umcCount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-300">
                    {fmtCount(pivotData.totals.uwCount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-black text-white bg-slate-800 text-sm">
                    {fmtCount(pivotData.totals.totalCount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono font-black text-white">
                    {fmtCurrencyFull(pivotData.totals.totalValue)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-black text-sky-300">
                    {pivotData.umcRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
