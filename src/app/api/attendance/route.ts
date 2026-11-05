import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Attendance } from "@/models/Attendance";
import { Class } from "@/models/Class";
import { Student } from "@/models/Student";
import "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";
import { bulkAttendanceSchema } from "@/lib/validations/attendance";

// GET /api/attendance — List attendance with date, class, section, student, and status filters
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
    const date = searchParams.get("date")?.trim() || "";
    const classId = searchParams.get("classId")?.trim() || "";
    const studentId = searchParams.get("studentId")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50", 10)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (date) {
      filter.date = date;
    }
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      filter.classId = new mongoose.Types.ObjectId(classId);
    }
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      filter.studentId = new mongoose.Types.ObjectId(studentId);
    }
    if (status && ["present", "absent", "late", "half-day"].includes(status)) {
      filter.status = status;
    }

    const totalRecords = await Attendance.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limit);
    const skip = (page - 1) * limit;

    const attendanceRecords = await Attendance.find(filter)
      .populate("studentId", "admissionNumber firstName lastName rollNumber className section")
      .populate("classId", "className section academicYear roomNumber")
      .populate("markedBy", "name email")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      attendance: attendanceRecords,
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages,
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

// POST /api/attendance — Record or edit bulk attendance for a class on a specific date
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
    const validation = bulkAttendanceSchema.safeParse(body);

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

    const { classId, date, records } = validation.data;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return NextResponse.json(
        { success: false, error: "Invalid class identifier" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const targetClass = await Class.findById(classId);
    if (!targetClass) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    // Verify all student IDs exist and belong to this class cohort
    const studentIds = records.map((r) => r.studentId);
    const validStudents = await Student.find({
      _id: { $in: studentIds },
      $or: [
        { classId: targetClass._id },
        {
          classId: { $exists: false },
          className: targetClass.className,
          section: targetClass.section,
        },
      ],
      status: "active",
    });

    const validStudentIdSet = new Set(validStudents.map((s) => s._id.toString()));

    for (const id of studentIds) {
      if (!validStudentIdSet.has(id)) {
        return NextResponse.json(
          {
            success: false,
            error: `Student ID "${id}" does not belong to ${targetClass.className} - ${targetClass.section} or is inactive.`,
          },
          { status: 400 }
        );
      }
    }

    // Upsert each attendance record to prevent duplicates and allow updates
    const bulkOps = records.map((item) => ({
      updateOne: {
        filter: {
          studentId: new mongoose.Types.ObjectId(item.studentId),
          date,
        },
        update: {
          $set: {
            classId: targetClass._id,
            status: item.status,
            remarks: item.remarks || "",
            markedBy: new mongoose.Types.ObjectId(authUser.userId),
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      message: `Attendance for ${records.length} student(s) on ${date} saved successfully.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

