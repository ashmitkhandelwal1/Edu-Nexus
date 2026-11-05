import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { FeeRecord } from "@/models/FeeRecord";
import { FeePayment } from "@/models/FeePayment";
import "@/models/FeeStructure";
import "@/models/Student";
import "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";
import { createFeePaymentSchema } from "@/lib/validations/fee";

// POST /api/fees/payments — Record a fee payment and update fee record
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = createFeePaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const { feeRecordId, amount, paymentMethod, transactionReference, paymentDate } = validation.data;

    // Consistency check on FeeRecord
    const feeRecord = await FeeRecord.findById(feeRecordId);
    if (!feeRecord) {
      return NextResponse.json(
        { success: false, error: "Target fee record not found" },
        { status: 404 }
      );
    }

    if (feeRecord.pendingAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "This fee record is already fully paid." },
        { status: 400 }
      );
    }

    if (amount > feeRecord.pendingAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment amount (${amount}) exceeds pending balance (${feeRecord.pendingAmount}). Overpayments are not accepted.`,
        },
        { status: 400 }
      );
    }

    // Atomic / consistent update: Create payment and update fee record
    const payment = await FeePayment.create({
      feeRecordId: feeRecord._id,
      studentId: feeRecord.studentId,
      amount,
      paymentMethod,
      transactionReference: transactionReference?.trim() || undefined,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      receivedBy: new mongoose.Types.ObjectId(authUser.userId),
    });

    const newPaidAmount = feeRecord.paidAmount + amount;
    const newPendingAmount = feeRecord.totalAmount - newPaidAmount;
    const newStatus =
      newPendingAmount === 0
        ? "paid"
        : newPaidAmount > 0
        ? "partially_paid"
        : feeRecord.status;

    feeRecord.paidAmount = newPaidAmount;
    feeRecord.pendingAmount = newPendingAmount;
    feeRecord.status = newStatus;
    await feeRecord.save();

    const populatedPayment = await FeePayment.findById(payment._id)
      .populate("studentId", "admissionNumber firstName lastName rollNumber")
      .populate("receivedBy", "name email");

    return NextResponse.json(
      {
        success: true,
        message: "Payment recorded successfully",
        payment: populatedPayment,
        updatedRecord: feeRecord,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

