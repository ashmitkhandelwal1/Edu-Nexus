import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { FeeStructure } from "@/models/FeeStructure";
import { FeeRecord } from "@/models/FeeRecord";
import "@/models/Class";
import { getAuthenticatedUser } from "@/lib/auth";
import { updateFeeStructureSchema } from "@/lib/validations/fee";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/fees/structures/[id]
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
        { success: false, error: "Invalid fee structure ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const structure = await FeeStructure.findById(id)
      .populate("classId", "className section academicYear roomNumber")
      .lean();

    if (!structure) {
      return NextResponse.json(
        { success: false, error: "Fee structure not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      structure,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PATCH /api/fees/structures/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
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
        { success: false, error: "Invalid fee structure ID" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = updateFeeStructureSchema.safeParse(body);

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

    const existing = await FeeStructure.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Fee structure not found" },
        { status: 404 }
      );
    }

    const data = validation.data;
    const updatePayload: any = { ...data };
    if (data.classId) updatePayload.classId = new mongoose.Types.ObjectId(data.classId);
    if (data.dueDate) updatePayload.dueDate = new Date(data.dueDate);

    const updated = await FeeStructure.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { returnDocument: "after", runValidators: true }
    ).populate("classId", "className section academicYear");

    return NextResponse.json({
      success: true,
      message: "Fee structure updated successfully",
      structure: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/fees/structures/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
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
        { success: false, error: "Invalid fee structure ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if any student fee records exist with payments
    const records = await FeeRecord.find({ feeStructureId: id });
    const hasPayments = records.some((r) => r.paidAmount > 0);

    if (hasPayments) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete fee structure because payments have already been collected against it.",
        },
        { status: 400 }
      );
    }

    // Delete associated pending fee records as cleanup
    await FeeRecord.deleteMany({ feeStructureId: id });
    await FeeStructure.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Fee structure and associated pending fee records deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

