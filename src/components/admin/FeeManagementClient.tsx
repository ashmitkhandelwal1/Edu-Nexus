"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Printer,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { FeeStructureModal } from "./FeeStructureModal";

interface FeeManagementClientProps {
  initialClasses: any[];
}

export function FeeManagementClient({ initialClasses }: FeeManagementClientProps) {
  const [activeTab, setActiveTab] = useState<"records" | "structures">("records");

  // Records state
  const [records, setRecords] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Modals
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Receipt Modal
  const [receiptRecord, setReceiptRecord] = useState<any | null>(null);
  const [receiptPayments, setReceiptPayments] = useState<any[]>([]);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const fetchRecordsAndReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (classId) params.append("classId", classId);
      if (status) params.append("status", status);
      params.append("page", String(page));

      const [recordsRes, reportRes, structuresRes] = await Promise.all([
        fetch(`/api/fees/records?${params.toString()}`),
        fetch("/api/fees/reports"),
        fetch("/api/fees/structures"),
      ]);

      const [recData, repData, strData] = await Promise.all([
        recordsRes.json(),
        reportRes.json(),
        structuresRes.json(),
      ]);

      if (!recordsRes.ok) throw new Error(recData.error || "Failed to load fee records");
      setRecords(recData.records || []);
      setPagination(recData.pagination || { totalPages: 1, total: 0 });

      if (reportRes.ok) setReport(repData.summary || null);
      if (structuresRes.ok) setStructures(strData.structures || []);
    } catch (err: any) {
      setError(err.message || "Failed to load fee data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordsAndReports();
  }, [classId, status, page]);

  const openPayment = (record: any) => {
    setSelectedRecord(record);
    setPaymentModalOpen(true);
  };

  const openReceipt = async (record: any) => {
    setReceiptRecord(record);
    setReceiptLoading(true);
    try {
      const res = await fetch(`/api/fees/records/${record._id}`);
      const data = await res.json();
      if (res.ok) {
        setReceiptPayments(data.payments || []);
      }
    } catch {
      // Ignore
    } finally {
      setReceiptLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Client search filtering
  const filteredRecords = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const student = r.studentId || {};
    const name = `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase();
    const adm = (student.admissionNumber || "").toLowerCase();
    const feeName = (r.feeStructureId?.feeName || "").toLowerCase();
    return name.includes(q) || adm.includes(q) || feeName.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            Fee Management & Accounts
          </h1>
          <p className="text-sm text-slate-400">
            Define class tuition structures, record student payments, and track outstanding collections
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setStructureModalOpen(true)}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Add Fee Structure
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Fees Expected</span>
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-xl font-black text-white">
              ${report.totalExpected.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Across {report.totalRecords} student accounts
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Collected</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-black text-emerald-400">
              ${report.totalCollected.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-500/80 block mt-0.5">
              {report.collectionRate} collection efficiency
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Outstanding</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xl font-black text-amber-400">
              ${report.totalOutstanding.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Pending student receivables
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Overdue Invoices</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-xl font-black text-rose-400">
              {report.overdueCount}
            </span>
            <span className="text-[10px] text-rose-500/80 block mt-0.5">
              Requires administrative follow-up
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("records")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition -mb-px flex items-center gap-1.5 ${
            activeTab === "records"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" /> Student Fee Invoices & Records
        </button>
        <button
          onClick={() => setActiveTab("structures")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition -mb-px flex items-center gap-1.5 ${
            activeTab === "structures"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Fee Structures & Schedules ({structures.length})
        </button>
      </div>

      {activeTab === "records" ? (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1 flex-wrap">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search student, adm #, fee name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none"
              >
                <option value="">All Classes</option>
                {initialClasses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.className} - {c.section}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Fully Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecordsAndReports}
              disabled={loading}
              className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs gap-1.5 self-end md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Records Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Fee Item</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Pending</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {loading && records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                        Loading fee records...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 italic">
                        No fee invoices found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => {
                      const student = rec.studentId || {};
                      const fs = rec.feeStructureId || {};

                      return (
                        <tr key={rec._id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-white block">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {student.admissionNumber}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-slate-300 font-medium">
                              {student.className} - {student.section}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-white block">{fs.feeName || "Tuition Fee"}</span>
                            <span className="text-[10px] text-slate-500">
                              Due: {fs.dueDate ? new Date(fs.dueDate).toLocaleDateString() : "—"}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-bold text-white">
                            ${rec.totalAmount.toLocaleString()}
                          </td>

                          <td className="py-3 px-4 font-bold text-emerald-400">
                            ${rec.paidAmount.toLocaleString()}
                          </td>

                          <td className="py-3 px-4 font-bold text-rose-400">
                            ${rec.pendingAmount.toLocaleString()}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                rec.status === "paid"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : rec.status === "partially_paid"
                                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                                  : rec.status === "overdue"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {rec.status.replace("_", " ")}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {rec.pendingAmount > 0 && (
                                <Button
                                  size="sm"
                                  onClick={() => openPayment(rec)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-7 px-2.5 font-semibold"
                                >
                                  Collect
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openReceipt(rec)}
                                className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-[11px] h-7 px-2"
                                title="View History & Receipt"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Structures Tab */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {structures.map((s) => (
              <div
                key={s._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-bold text-[10px]">
                      {s.classId?.className} - {s.classId?.section}
                    </span>
                    <span className="text-[10px] text-slate-500">{s.academicYear}</span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">{s.feeName}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{s.description || "No description provided."}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Fee Amount</span>
                    <span className="text-base font-black text-white">${s.amount.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Due Date</span>
                    <span className="font-semibold text-slate-300">
                      {new Date(s.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={fetchRecordsAndReports}
        feeRecord={selectedRecord}
      />

      {/* Define Fee Structure Modal */}
      <FeeStructureModal
        isOpen={structureModalOpen}
        onClose={() => setStructureModalOpen(false)}
        onSuccess={fetchRecordsAndReports}
        classes={initialClasses}
      />

      {/* Payment Receipt / History Modal */}
      {receiptRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-400" /> Fee Receipt & Statement
                </h3>
                <p className="text-xs text-slate-400">
                  {receiptRecord.studentId?.firstName} {receiptRecord.studentId?.lastName} (Adm:{" "}
                  {receiptRecord.studentId?.admissionNumber})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="border-slate-800 text-xs text-slate-300 hover:text-white gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </Button>
                <button
                  onClick={() => setReceiptRecord(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt Summary Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Fee Item:</span>
                <span className="font-bold text-white">{receiptRecord.feeStructureId?.feeName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Class & Section:</span>
                <span className="text-white font-medium">
                  {receiptRecord.studentId?.className} - {receiptRecord.studentId?.section}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Total Billed:</span>
                <span className="font-bold text-white">${receiptRecord.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Paid:</span>
                <span className="font-bold text-emerald-400">
                  ${receiptRecord.paidAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Outstanding Balance:</span>
                <span className="font-bold text-rose-400">
                  ${receiptRecord.pendingAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Receipts List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Transaction Receipts</h4>
              {receiptLoading ? (
                <div className="text-center py-6 text-xs text-slate-500">Loading payment receipts...</div>
              ) : receiptPayments.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">
                  No payments have been recorded yet for this invoice.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {receiptPayments.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs"
                    >
                      <div>
                        <span className="font-bold text-emerald-400 block">+${p.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(p.paymentDate).toLocaleDateString()} • {p.paymentMethod.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[10px] text-slate-400 block">
                          Ref: {p.transactionReference || "CASH-PAID"}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          By: {p.receivedBy?.name || "Admin"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
