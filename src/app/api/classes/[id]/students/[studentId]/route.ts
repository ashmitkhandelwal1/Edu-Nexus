import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Class } from "@/models/Class";
import { Student } from "@/models/Student";
import { getAuthenticatedUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string; studentId: string }>;
}

// DELETE /api/classes/[id]/students/[studentId] — unassign student from class
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id, studentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid class or student ID" },
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
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Verify student is in this class
    const isInClass =
      student.classId?.toString() === classRecord._id.toString() ||
      (student.className === classRecord.className && student.section === classRecord.section);

    if (!isInClass) {
      return NextResponse.json(
        {
          success: false,
          error: "Student is not enrolled in this specific class.",
        },
        { status: 400 }
      );
    }

    // Clear class link
    student.classId = undefined;
    student.className = "Unassigned";
    student.section = "—";
    await student.save();

    return NextResponse.json({
      success: true,
      message: `Student ${student.firstName} ${student.lastName} removed from class ${classRecord.className} - ${classRecord.section}.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

