import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Class } from "@/models/Class";
import { Student } from "@/models/Student";
import { getAuthenticatedUser } from "@/lib/auth";
import { assignStudentSchema } from "@/lib/validations/class";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/classes/[id]/students — get students in class
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
        { success: false, error: "Invalid class ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const classRecord = await Class.findById(id).lean();
    if (!classRecord) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    const students = await Student.find({
      $or: [
        { classId: classRecord._id },
        {
          classId: { $exists: false },
          className: classRecord.className,
          section: classRecord.section,
        },
      ],
      status: "active",
    })
      .sort({ rollNumber: 1, firstName: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      students,
      total: students.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/classes/[id]/students — enroll/assign an existing student to this class
export async function POST(req: NextRequest, { params }: Params) {
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
        { success: false, error: "Invalid class ID" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = assignStudentSchema.safeParse(body);

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

    const { studentId } = validation.data;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const classRecord = await Class.findById(id);
    if (!classRecord) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found in records" },
        { status: 404 }
      );
    }

    // Check if student is already in this class
    if (student.classId?.toString() === classRecord._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          error: `Student ${student.firstName} ${student.lastName} is already assigned to this class.`,
        },
        { status: 409 }
      );
    }

    // Check capacity
    const currentEnrolled = await Student.countDocuments({
      $or: [
        { classId: classRecord._id },
        {
          classId: { $exists: false },
          className: classRecord.className,
          section: classRecord.section,
        },
      ],
      status: "active",
    });

    if (currentEnrolled >= classRecord.capacity) {
      return NextResponse.json(
        {
          success: false,
          error: `Class has reached maximum capacity (${classRecord.capacity} students).`,
        },
        { status: 400 }
      );
    }

    // Update student's allocation
    student.classId = classRecord._id as unknown as mongoose.Types.ObjectId;
    student.className = classRecord.className;
    student.section = classRecord.section;
    student.academicYear = classRecord.academicYear;
    await student.save();

    return NextResponse.json({
      success: true,
      message: `Student ${student.firstName} ${student.lastName} assigned to ${classRecord.className} - ${classRecord.section} successfully.`,
      student,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

