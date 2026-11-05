import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { FeeRecord } from "@/models/FeeRecord";
import { FeeStructure } from "@/models/FeeStructure";
import { Student } from "@/models/Student";
import "@/models/Class";
import { getAuthenticatedUser } from "@/lib/auth";
import { generateFeeRecordsSchema } from "@/lib/validations/fee";

// GET /api/fees/records — Query fee records by student, class, or status
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

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId")?.trim() || "";
    const feeStructureId = searchParams.get("feeStructureId")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const classId = searchParams.get("classId")?.trim() || "";
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25", 10)));

    const filter: any = {};
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      filter.studentId = new mongoose.Types.ObjectId(studentId);
    }
    if (feeStructureId && mongoose.Types.ObjectId.isValid(feeStructureId)) {
      filter.feeStructureId = new mongoose.Types.ObjectId(feeStructureId);
    }
    if (status && ["pending", "partially_paid", "paid", "overdue"].includes(status)) {
      filter.status = status;
    }

    // If filtering by class, find all students in that class first
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      const classStudents = await Student.find({ classId: new mongoose.Types.ObjectId(classId) }).select("_id");
      const sIds = classStudents.map((s) => s._id);
      filter.studentId = { $in: sIds };
    }

    const total = await FeeRecord.countDocuments(filter);
    const skip = (page - 1) * limit;

    const records = await FeeRecord.find(filter)
      .populate("studentId", "admissionNumber firstName lastName rollNumber className section")
      .populate({
        path: "feeStructureId",
        select: "feeName amount dueDate academicYear classId",
        populate: { path: "classId", select: "className section" },
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Dynamically update status to "overdue" if past due date and still pending/partially_paid
    const now = new Date();
    const updatedRecords = records.map((rec: any) => {
      const fs = rec.feeStructureId;
      if (fs && fs.dueDate && new Date(fs.dueDate) < now && rec.pendingAmount > 0) {
        return { ...rec, status: "overdue" };
      }
      return rec;
    });

    return NextResponse.json({
      success: true,
      records: updatedRecords,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/fees/records — Generate fee records from fee structure for enrolled students
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
    const validation = generateFeeRecordsSchema.safeParse(body);

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

    const { feeStructureId, studentId } = validation.data;

    const feeStructure = await FeeStructure.findById(feeStructureId);
    if (!feeStructure) {
      return NextResponse.json(
        { success: false, error: "Fee structure not found" },
        { status: 404 }
      );
    }

    let targetStudents: any[] = [];
    if (studentId) {
      const s = await Student.findById(studentId);
      if (!s) {
        return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
      }
      targetStudents = [s];
    } else {
      // Find all active students enrolled in this feeStructure's class
      targetStudents = await Student.find({
        classId: feeStructure.classId,
        status: "active",
      });
    }

    if (targetStudents.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active students found in this class." },
        { status: 400 }
      );
    }

    let createdCount = 0;
    const now = new Date();
    const isPastDue = new Date(feeStructure.dueDate) < now;

    for (const student of targetStudents) {
      const existing = await FeeRecord.findOne({
        feeStructureId: feeStructure._id,
        studentId: student._id,
      });

      if (!existing) {
        await FeeRecord.create({
          studentId: student._id,
          feeStructureId: feeStructure._id,
          totalAmount: feeStructure.amount,
          paidAmount: 0,
          pendingAmount: feeStructure.amount,
          status: isPastDue ? "overdue" : "pending",
        });
        createdCount++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Generated fee records for ${createdCount} student(s)`,
        createdCount,
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

