import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { FeeRecord } from "@/models/FeeRecord";
import { FeePayment } from "@/models/FeePayment";
import { FeeStructure } from "@/models/FeeStructure";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/fees/reports — Aggregate fee collection metrics
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const [recordAgg, recentPayments, overdueCount] = await Promise.all([
      FeeRecord.aggregate([
        {
          $group: {
            _id: null,
            totalExpected: { $sum: "$totalAmount" },
            totalCollected: { $sum: "$paidAmount" },
            totalOutstanding: { $sum: "$pendingAmount" },
            count: { $sum: 1 },
            paidCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
            partialCount: { $sum: { $cond: [{ $eq: ["$status", "partially_paid"] }, 1, 0] } },
          },
        },
      ]),
      FeePayment.find()
        .populate("studentId", "admissionNumber firstName lastName rollNumber className section")
        .populate("receivedBy", "name email")
        .sort({ paymentDate: -1 })
        .limit(10)
        .lean(),
      FeeRecord.countDocuments({ status: "overdue" }),
    ]);

    const stats = recordAgg[0] || {
      totalExpected: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      count: 0,
      paidCount: 0,
      partialCount: 0,
    };

    return NextResponse.json({
      success: true,
      summary: {
        totalExpected: stats.totalExpected,
        totalCollected: stats.totalCollected,
        totalOutstanding: stats.totalOutstanding,
        overdueCount,
        collectionRate:
          stats.totalExpected > 0
            ? `${Math.round((stats.totalCollected / stats.totalExpected) * 1000) / 10}%`
            : "0%",
        totalRecords: stats.count,
        paidCount: stats.paidCount,
        partialCount: stats.partialCount,
      },
      recentPayments,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

