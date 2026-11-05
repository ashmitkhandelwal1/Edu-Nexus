import React from "react";
import { CreditCard } from "lucide-react";
import { getStudentProfile } from "@/lib/student-auth";
import { StudentShell } from "@/components/student/StudentShell";
import { FeeRecord } from "@/models/FeeRecord";
import { FeePayment } from "@/models/FeePayment";
import { StudentFeesClient } from "@/components/student/StudentFeesClient";
import "@/models/FeeStructure";

export default async function StudentFeesPage() {
  const { user, student } = await getStudentProfile();

  // Find fee records strictly for this student
  const feeRecords = await FeeRecord.find({
    studentId: student._id,
  })
    .populate("feeStructureId", "feeName description dueDate amount")
    .sort({ createdAt: -1 })
    .lean();

  // Find payments for this student
  const payments = await FeePayment.find({
    studentId: student._id,
  })
    .sort({ paymentDate: -1 })
    .lean();

  // Group payments by feeRecordId
  const paymentsByRecord = new Map<string, any[]>();
  payments.forEach((p) => {
    const rId = p.feeRecordId.toString();
    if (!paymentsByRecord.has(rId)) {
      paymentsByRecord.set(rId, []);
    }
    paymentsByRecord.get(rId)!.push({
      _id: p._id.toString(),
      amount: p.amount,
      paymentDate: new Date(p.paymentDate).toISOString(),
      paymentMethod: p.paymentMethod,
      transactionReference: p.transactionReference,
    });
  });

  const formattedRecords = feeRecords.map((r: any) => {
    const structure = r.feeStructureId;
    return {
      _id: r._id.toString(),
      feeName: structure?.feeName || "Tuition / Term Fee",
      description: structure?.description || "",
      dueDate: structure?.dueDate || "N/A",
      totalAmount: r.totalAmount,
      paidAmount: r.paidAmount,
      pendingAmount: r.pendingAmount,
      status: r.status,
      payments: paymentsByRecord.get(r._id.toString()) || [],
    };
  });

  return (
    <StudentShell
      studentEmail={user.email}
      studentName={`${student.firstName} ${student.lastName}`}
      admissionNumber={student.admissionNumber}
      className={student.className}
      section={student.section}
    >
      <div className="space-y-8">
        <div className="pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" /> Official Fee Ledger
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            My Fee Details & Receipts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review assessed fee structures, verified transaction history, and generate printable payment receipts (Read-Only).
          </p>
        </div>

        <StudentFeesClient
          studentName={`${student.firstName} ${student.lastName}`}
          admissionNumber={student.admissionNumber}
          className={student.className}
          section={student.section}
          records={formattedRecords}
        />
      </div>
    </StudentShell>
  );
}

