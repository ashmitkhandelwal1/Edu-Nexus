import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Submission } from "@/models/Submission";
import { Assignment } from "@/models/Assignment";
import "@/models/Student";
import "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";
import { gradeSubmissionSchema } from "@/lib/validations/assignment";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/submissions/[id] — Grade submission with marks and feedback
export async function PATCH(req: NextRequest, { params }: Params) {
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
        { success: false, error: "Invalid submission identifier" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = gradeSubmissionSchema.safeParse(body);

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

    const submission = await Submission.findById(id);
    if (!submission) {
      return NextResponse.json(
        { success: false, error: "Submission not found" },
        { status: 404 }
      );
    }

    // Retrieve assignment to validate marks against maxMarks
    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Associated assignment not found" },
        { status: 404 }
      );
    }

    const { marksObtained, feedback } = validation.data;

    if (marksObtained > assignment.maxMarks) {
      return NextResponse.json(
        {
          success: false,
          error: `Marks obtained (${marksObtained}) cannot exceed maximum marks (${assignment.maxMarks})`,
        },
        { status: 400 }
      );
    }

    submission.marksObtained = marksObtained;
    submission.feedback = feedback || "";
    submission.status = "graded";
    submission.gradedBy = new mongoose.Types.ObjectId(authUser.userId);
    submission.gradedAt = new Date();

    await submission.save();

    const populated = await Submission.findById(submission._id)
      .populate("studentId", "admissionNumber firstName lastName rollNumber email")
      .populate("gradedBy", "name email")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Submission graded successfully",
      submission: populated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

