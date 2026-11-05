"use client";

import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentItem {
  _id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionReference?: string;
}

interface FeeRecordItem {
  _id: string;
  feeName: string;
  description?: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: "pending" | "partially_paid" | "paid" | "overdue";
  payments: PaymentItem[];
}

interface StudentFeesClientProps {
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  records: FeeRecordItem[];
}

export function StudentFeesClient({
  studentName,
  admissionNumber,
  className,
  section,
  records,
}: StudentFeesClientProps) {
  const [selectedRecordForReceipt, setSelectedRecordForReceipt] = useState<FeeRecordItem | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Overall totals
  const totalFees = records.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
  const totalPaid = records.reduce((acc, r) => acc + (r.paidAmount || 0), 0);
  const totalPending = records.reduce((acc, r) => acc + (r.pendingAmount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid
          </span>
        );
      case "partially_paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Partially Paid
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Assessed Fees
          </div>
          <div className="mt-2 text-3xl font-black text-white">
            ₹{totalFees.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all academic terms</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
            Total Amount Paid
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-400">
            ₹{totalPaid.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Verified school payments</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-rose-400 uppercase tracking-wider">
            Outstanding Due
          </div>
          <div className="mt-2 text-3xl font-black text-rose-400">
            ₹{totalPending.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalPending > 0 ? "Pending clearance" : "All cleared 🎉"}
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {selectedRecordForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:p-0 print:bg-white print:static">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 text-slate-100 print:text-black print:bg-white print:border-none print:shadow-none print:max-w-none">
            {/* Receipt Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-gray-300">
              <div>
                <h3 className="text-xl font-black text-white print:text-black">
                  EDUNEXUS ACADEMIC RECEIPT
                </h3>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                  Official School Fee Summary & Payment Acknowledgement
                </p>
              </div>
              <div className="text-right text-xs font-mono text-slate-400 print:text-gray-600">
                Receipt #{selectedRecordForReceipt._id.slice(-6).toUpperCase()}
              </div>
            </div>

            {/* Student & Fee Structure Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 print:text-gray-500 block">Student Name:</span>
                <strong className="text-white print:text-black font-semibold text-sm">
                  {studentName}
                </strong>
                <div className="text-slate-400 print:text-gray-600">
                  Class: {className} - {section} • Adm: {admissionNumber}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 print:text-gray-500 block">Fee Title:</span>
                <strong className="text-white print:text-black font-semibold text-sm">
                  {selectedRecordForReceipt.feeName}
                </strong>
                <div className="text-slate-400 print:text-gray-600">
                  Due: {selectedRecordForReceipt.dueDate}
                </div>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="border border-slate-800 print:border-gray-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 print:bg-gray-100 border-b border-slate-800 print:border-gray-300">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                  <tr>
                    <td className="p-3">Total Structure Fee</td>
                    <td className="p-3 text-right font-mono">
                      ₹{selectedRecordForReceipt.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 text-emerald-400 print:text-green-700">Total Amount Paid</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400 print:text-green-700">
                      ₹{selectedRecordForReceipt.paidAmount.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-950/30 print:bg-gray-50 font-bold">
                    <td className="p-3">Remaining Balance</td>
                    <td className="p-3 text-right font-mono text-rose-400 print:text-red-700">
                      ₹{selectedRecordForReceipt.pendingAmount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Transactions Log */}
            {selectedRecordForReceipt.payments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-gray-600">
                  Transaction History
                </h4>
                <div className="space-y-1.5 text-xs">
                  {selectedRecordForReceipt.payments.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white print:text-black">
                          Paid ₹{p.amount.toLocaleString()} via{" "}
                          <span className="uppercase">{p.paymentMethod.replace("_", " ")}</span>
                        </div>
                        {p.transactionReference && (
                          <div className="text-[11px] text-slate-400 print:text-gray-500 font-mono">
                            Ref: {p.transactionReference}
                          </div>
                        )}
                      </div>
                      <div className="text-slate-400 print:text-gray-600 text-right">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons (Hidden on Print) */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 print:hidden">
              <Button
                variant="outline"
                onClick={() => setSelectedRecordForReceipt(null)}
                className="text-xs border-slate-700 text-slate-300"
              >
                Close
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Records Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden">
        <div className="p-6 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Fee Invoices & Ledgers</h2>
          </div>
          <span className="text-xs text-slate-400">
            {records.length} {records.length === 1 ? "Record" : "Records"}
          </span>
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40 text-sky-400" />
            <p className="text-lg font-bold text-slate-300">No Fee Records Found</p>
            <p className="text-sm text-slate-500 mt-1">
              There are no active fee assessments assigned to your account.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {records.map((rec) => {
              const isExpanded = expandedRecordId === rec._id;

              return (
                <div key={rec._id} className="p-6 space-y-4 hover:bg-slate-800/20 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-white">{rec.feeName}</h3>
                        {getStatusBadge(rec.status)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Due Date: <span className="font-medium text-slate-300">{rec.dueDate}</span>
                        {rec.description && ` • ${rec.description}`}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Total / Paid</div>
                        <div className="text-sm font-black text-white font-mono">
                          ₹{rec.paidAmount.toLocaleString()}{" "}
                          <span className="text-xs text-slate-400">
                            / ₹{rec.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Balance</div>
                        <div
                          className={`text-sm font-black font-mono ${
                            rec.pendingAmount > 0 ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          ₹{rec.pendingAmount.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRecordForReceipt(rec)}
                          className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200 flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-400" />
                          <span>Receipt</span>
                        </Button>

                        {rec.payments.length > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setExpandedRecordId(isExpanded ? null : rec._id)
                            }
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Drawer */}
                  {isExpanded && rec.payments.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 mt-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Recorded Payments ({rec.payments.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {rec.payments.map((p, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex justify-between items-center"
                          >
                            <div>
                              <div className="font-bold text-emerald-400">
                                Paid ₹{p.amount.toLocaleString()}
                              </div>
                              <div className="text-slate-400 capitalize">
                                Via {p.paymentMethod.replace("_", " ")}
                              </div>
                              {p.transactionReference && (
                                <div className="text-[11px] text-slate-500 font-mono">
                                  Ref: {p.transactionReference}
                                </div>
                              )}
                            </div>
                            <div className="text-right text-slate-500">
                              {new Date(p.paymentDate).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

