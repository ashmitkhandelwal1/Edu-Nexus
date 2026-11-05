import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { FeeRecord } from "@/models/FeeRecord";
import { FeePayment } from "@/models/FeePayment";
import "@/models/FeeStructure";
import "@/models/Student";
import "@/models/Class";
import "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/fees/records/[id] — Retrieve single fee record and payment history
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid fee record ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const record = await FeeRecord.findById(id)
      .populate("studentId", "admissionNumber firstName lastName rollNumber email className section guardianName guardianPhone")
      .populate({
        path: "feeStructureId",
        populate: { path: "classId", select: "className section roomNumber" },
      })
      .lean();

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Fee record not found" },
        { status: 404 }
      );
    }

    // Retrieve all payment receipts for this record
    const payments = await FeePayment.find({ feeRecordId: id })
      .populate("receivedBy", "name email")
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      record,
      payments,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

