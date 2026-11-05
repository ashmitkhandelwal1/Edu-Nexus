import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import "@/models/Class";
import "@/models/Teacher";
import "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";
import { updateAssignmentSchema } from "@/lib/validations/assignment";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/assignments/[id] — Retrieve single assignment details
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
        { success: false, error: "Invalid assignment identifier" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const assignment = await Assignment.findById(id)
      .populate("classId", "className section academicYear roomNumber subjects")
      .populate("teacherId", "firstName lastName employeeId department")
      .populate("assignedBy", "name email")
      .lean();

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Attach submission statistics
    const totalSubmissions = await Submission.countDocuments({ assignmentId: assignment._id });
    const gradedSubmissions = await Submission.countDocuments({
      assignmentId: assignment._id,
      status: "graded",
    });

    return NextResponse.json({
      success: true,
      assignment: {
        ...assignment,
        submissionCount: totalSubmissions,
        gradedCount: gradedSubmissions,
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

// PATCH /api/assignments/[id] — Update assignment details
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
        { success: false, error: "Invalid assignment identifier" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = updateAssignmentSchema.safeParse(body);

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

    const existing = await Assignment.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 }
      );
    }

    const data = validation.data;

    if (data.classId) {
      const classExists = await mongoose.model("Class").findById(data.classId);
      if (!classExists) {
        return NextResponse.json(
          { success: false, error: "Target class not found" },
          { status: 404 }
        );
      }
    }

    if (data.teacherId) {
      const teacherExists = await mongoose.model("Teacher").findById(data.teacherId);
      if (!teacherExists) {
        return NextResponse.json(
          { success: false, error: "Assigned teacher not found" },
          { status: 404 }
        );
      }
    }

    const updatePayload: any = { ...data };
    if (data.classId) updatePayload.classId = new mongoose.Types.ObjectId(data.classId);
    if (data.teacherId) updatePayload.teacherId = new mongoose.Types.ObjectId(data.teacherId);
    if (data.dueDate) updatePayload.dueDate = new Date(data.dueDate);
    if (data.assignedDate) updatePayload.assignedDate = new Date(data.assignedDate);

    const updated = await Assignment.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { returnDocument: "after", runValidators: true }
    )
      .populate("classId", "className section academicYear")
      .populate("teacherId", "firstName lastName employeeId")
      .populate("assignedBy", "name email");

    return NextResponse.json({
      success: true,
      message: "Assignment updated successfully",
      assignment: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/[id] — Delete assignment with safe deletion strategy
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
        { success: false, error: "Invalid assignment identifier" },
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

    // Safe deletion: prevent deleting assignments that have student submissions
    const submissionsCount = await Submission.countDocuments({ assignmentId: assignment._id });
    if (submissionsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete assignment because it already has ${submissionsCount} student submission(s). Close or archive the assignment instead.`,
        },
        { status: 400 }
      );
    }

    await Assignment.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

