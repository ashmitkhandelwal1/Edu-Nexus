import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import "@/models/Class";
import "@/models/Teacher";
import "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";
import { createAssignmentSchema } from "@/lib/validations/assignment";

// GET /api/assignments — List assignments with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || (authUser.role !== "admin" && authUser.role !== "teacher")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const classId = searchParams.get("classId")?.trim() || "";
    const academicYear = searchParams.get("academicYear")?.trim() || "";
    const subjectName = searchParams.get("subjectName")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { subjectName: { $regex: search, $options: "i" } },
      ];
    }
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      filter.classId = new mongoose.Types.ObjectId(classId);
    }
    if (academicYear) {
      filter.academicYear = academicYear;
    }
    if (subjectName) {
      filter.subjectName = { $regex: `^${subjectName}$`, $options: "i" };
    }
    if (status && ["draft", "published", "closed"].includes(status)) {
      filter.status = status;
    }

    const totalRecords = await Assignment.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const skip = (page - 1) * limit;

    const assignments = await Assignment.find(filter)
      .populate("classId", "className section academicYear roomNumber")
      .populate("teacherId", "firstName lastName employeeId department")
      .populate("assignedBy", "name email")
      .sort({ dueDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Attach submission counts for each assignment
    const assignmentIds = assignments.map((a) => a._id);
    const submissionCounts = await Submission.aggregate([
      { $match: { assignmentId: { $in: assignmentIds } } },
      {
        $group: {
          _id: "$assignmentId",
          total: { $sum: 1 },
          graded: { $sum: { $cond: [{ $eq: ["$status", "graded"] }, 1, 0] } },
        },
      },
    ]);

    const countMap = new Map();
    submissionCounts.forEach((c) => {
      countMap.set(c._id.toString(), { total: c.total, graded: c.graded });
    });

    const enrichedAssignments = assignments.map((a) => {
      const stats = countMap.get(a._id.toString()) || { total: 0, graded: 0 };
      return {
        ...a,
        submissionCount: stats.total,
        gradedCount: stats.graded,
      };
    });

    return NextResponse.json({
      success: true,
      assignments: enrichedAssignments,
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

// POST /api/assignments — Create a new homework / assignment
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || (authUser.role !== "admin" && authUser.role !== "teacher")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = createAssignmentSchema.safeParse(body);

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

    // Verify Class reference
    const classExists = await mongoose.model("Class").findById(data.classId);
    if (!classExists) {
      return NextResponse.json(
        { success: false, error: "Target class not found" },
        { status: 404 }
      );
    }

    // Verify Teacher reference if provided
    if (data.teacherId) {
      const teacherExists = await mongoose.model("Teacher").findById(data.teacherId);
      if (!teacherExists) {
        return NextResponse.json(
          { success: false, error: "Assigned teacher not found" },
          { status: 404 }
        );
      }
    }

    const newAssignment = await Assignment.create({
      ...data,
      classId: new mongoose.Types.ObjectId(data.classId),
      teacherId: data.teacherId ? new mongoose.Types.ObjectId(data.teacherId) : undefined,
      assignedBy: new mongoose.Types.ObjectId(authUser.userId),
      assignedDate: data.assignedDate ? new Date(data.assignedDate) : new Date(),
      dueDate: new Date(data.dueDate),
    });

    const populated = await Assignment.findById(newAssignment._id)
      .populate("classId", "className section academicYear")
      .populate("teacherId", "firstName lastName employeeId")
      .populate("assignedBy", "name email");

    return NextResponse.json(
      {
        success: true,
        message: "Assignment created successfully",
        assignment: populated,
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

