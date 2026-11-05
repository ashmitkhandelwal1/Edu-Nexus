import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { Class } from "@/models/Class";
import { Teacher } from "@/models/Teacher";
import { Marks } from "@/models/Marks";
import { getAuthenticatedUser } from "@/lib/auth";
import { examUpdateSchema } from "@/lib/validations/exam";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/exams/[id] — Retrieve single exam details
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
        { success: false, error: "Invalid examination identifier" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const exam = await Exam.findById(id)
      .populate("classId", "className section academicYear roomNumber")
      .populate("subjects.teacherId", "firstName lastName employeeId")
      .lean();

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Examination not found" },
        { status: 404 }
      );
    }

    // Check count of recorded marks for this exam
    const marksCount = await Marks.countDocuments({ examId: exam._id });

    return NextResponse.json({
      success: true,
      exam: {
        ...exam,
        marksCount,
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

// PATCH /api/exams/[id] — Update examination details
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
        { success: false, error: "Invalid examination identifier" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = examUpdateSchema.safeParse(body);

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

    const data = validation.data;
    const currentExam = await Exam.findById(id);

    if (!currentExam) {
      return NextResponse.json(
        { success: false, error: "Examination not found" },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};

    if (data.examName !== undefined) updates.examName = data.examName.trim();
    if (data.examType !== undefined) updates.examType = data.examType;
    if (data.academicYear !== undefined) updates.academicYear = data.academicYear.trim();
    if (data.startDate !== undefined) updates.startDate = data.startDate;
    if (data.endDate !== undefined) updates.endDate = data.endDate;
    if (data.status !== undefined) updates.status = data.status;

    if (data.classId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(data.classId)) {
        return NextResponse.json(
          { success: false, error: "Invalid class identifier" },
          { status: 400 }
        );
      }
      const classExists = await Class.findById(data.classId);
      if (!classExists) {
        return NextResponse.json(
          { success: false, error: "Class not found" },
          { status: 404 }
        );
      }
      updates.classId = new mongoose.Types.ObjectId(data.classId);
    }

    if (data.subjects !== undefined) {
      for (const sub of data.subjects) {
        if (sub.passMarks > sub.maxMarks) {
          return NextResponse.json(
            {
              success: false,
              error: `Pass marks (${sub.passMarks}) cannot exceed max marks (${sub.maxMarks}) for subject "${sub.subjectName}".`,
            },
            { status: 400 }
          );
        }
      }
      updates.subjects = data.subjects.map((s) => ({
        subjectName: s.subjectName.trim(),
        maxMarks: s.maxMarks,
        passMarks: s.passMarks,
        teacherId: s.teacherId && mongoose.Types.ObjectId.isValid(s.teacherId)
          ? new mongoose.Types.ObjectId(s.teacherId)
          : undefined,
      }));
    }

    const updatedExam = await Exam.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
      runValidators: true,
    })
      .populate("classId", "className section academicYear")
      .populate("subjects.teacherId", "firstName lastName employeeId")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Examination updated successfully",
      exam: updatedExam,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/exams/[id] — Delete examination with safety restriction against recorded marks
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
        { success: false, error: "Invalid examination identifier" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const exam = await Exam.findById(id);

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Examination not found" },
        { status: 404 }
      );
    }

    // Safety restriction: Check whether examination already has recorded marks
    const recordedMarksCount = await Marks.countDocuments({ examId: exam._id });

    if (recordedMarksCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete examination "${exam.examName}". It currently contains ${recordedMarksCount} recorded student mark(s). Archive or set status to completed instead.`,
        },
        { status: 400 }
      );
    }

    await Exam.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Examination deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

