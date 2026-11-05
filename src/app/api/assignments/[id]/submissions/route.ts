import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { Student } from "@/models/Student";
import "@/models/Class";
import "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";
import { createSubmissionSchema } from "@/lib/validations/assignment";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/assignments/[id]/submissions — List submissions for an assignment
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || (authUser.role !== "admin" && authUser.role !== "teacher")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid assignment identifier" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const assignment = await Assignment.findById(id).lean();
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status")?.trim() || "";

    const filter: any = { assignmentId: new mongoose.Types.ObjectId(id) };
    if (status && ["submitted", "late", "graded"].includes(status)) {
      filter.status = status;
    }

    const submissions = await Submission.find(filter)
      .populate("studentId", "admissionNumber firstName lastName rollNumber email className section")
      .populate("gradedBy", "name email")
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        maxMarks: assignment.maxMarks,
        subjectName: assignment.subjectName,
      },
      submissions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/assignments/[id]/submissions — Submit homework for a student
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
        { success: false, error: "Invalid assignment identifier" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = createSubmissionSchema.safeParse(body);

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

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.status === "closed") {
      return NextResponse.json(
        { success: false, error: "This assignment is closed for submissions" },
        { status: 400 }
      );
    }

    const { studentId, textAnswer, attachments } = validation.data;

    // Verify student exists and belongs to the assignment's class
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Check class enrollment
    const targetClass = await mongoose.model("Class").findById(assignment.classId);
    const isEnrolled =
      (student.classId && student.classId.toString() === assignment.classId.toString()) ||
      (targetClass &&
        student.className.toLowerCase() === targetClass.className.toLowerCase() &&
        student.section.toLowerCase() === targetClass.section.toLowerCase());

    if (!isEnrolled) {
      return NextResponse.json(
        {
          success: false,
          error: `Student ${student.firstName} ${student.lastName} is not enrolled in this class (${targetClass?.className || "Class"} - ${targetClass?.section || "Section"})`,
        },
        { status: 400 }
      );
    }

    // Check duplicate submission
    const existingSubmission = await Submission.findOne({
      assignmentId: assignment._id,
      studentId: student._id,
    });

    if (existingSubmission) {
      return NextResponse.json(
        {
          success: false,
          error: "A submission has already been recorded for this student. Duplicate submissions are not allowed.",
        },
        { status: 409 }
      );
    }

    const now = new Date();
    const isLate = now.getTime() > new Date(assignment.dueDate).getTime();

    const submission = await Submission.create({
      assignmentId: assignment._id,
      studentId: student._id,
      submittedAt: now,
      textAnswer,
      attachments,
      status: isLate ? "late" : "submitted",
    });

    const populated = await Submission.findById(submission._id)
      .populate("studentId", "admissionNumber firstName lastName rollNumber email")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: isLate ? "Assignment submitted (marked Late)" : "Assignment submitted successfully",
        submission: populated,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Duplicate submission: Student already submitted this assignment." },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

