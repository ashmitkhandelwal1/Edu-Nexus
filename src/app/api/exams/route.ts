import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { Class } from "@/models/Class";
import { Teacher } from "@/models/Teacher";
import { Marks } from "@/models/Marks";
import { getAuthenticatedUser } from "@/lib/auth";
import { examSchema } from "@/lib/validations/exam";

// GET /api/exams — List examinations with search, class, and status filters
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
    const search = searchParams.get("search")?.trim() || "";
    const classId = searchParams.get("classId")?.trim() || "";
    const academicYear = searchParams.get("academicYear")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (search) {
      filter.examName = { $regex: search, $options: "i" };
    }
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      filter.classId = new mongoose.Types.ObjectId(classId);
    }
    if (academicYear) {
      filter.academicYear = academicYear;
    }
    if (status && ["draft", "ongoing", "completed", "published"].includes(status)) {
      filter.status = status;
    }

    const totalRecords = await Exam.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limit);
    const skip = (page - 1) * limit;

    const exams = await Exam.find(filter)
      .populate("classId", "className section academicYear roomNumber")
      .populate("subjects.teacherId", "firstName lastName employeeId")
      .sort({ startDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      exams,
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

// POST /api/exams — Create a new examination schedule
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
    const validation = examSchema.safeParse(body);

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

    const data = validation.data;

    if (!mongoose.Types.ObjectId.isValid(data.classId)) {
      return NextResponse.json(
        { success: false, error: "Invalid class identifier" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const targetClass = await Class.findById(data.classId);
    if (!targetClass) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    // Validate pass marks <= max marks for every subject
    for (const sub of data.subjects) {
      if (sub.passMarks > sub.maxMarks) {
        return NextResponse.json(
          {
            success: false,
            error: `Pass marks (${sub.passMarks}) cannot exceed maximum marks (${sub.maxMarks}) for subject "${sub.subjectName}".`,
          },
          { status: 400 }
        );
      }
      if (sub.teacherId && mongoose.Types.ObjectId.isValid(sub.teacherId)) {
        const teacherExists = await Teacher.findById(sub.teacherId);
        if (!teacherExists) {
          return NextResponse.json(
            {
              success: false,
              error: `Assigned teacher for subject "${sub.subjectName}" not found.`,
            },
            { status: 404 }
          );
        }
      }
    }

    const newExam = await Exam.create({
      examName: data.examName.trim(),
      examType: data.examType,
      classId: targetClass._id,
      academicYear: data.academicYear.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      subjects: data.subjects.map((s) => ({
        subjectName: s.subjectName.trim(),
        maxMarks: s.maxMarks,
        passMarks: s.passMarks,
        teacherId: s.teacherId && mongoose.Types.ObjectId.isValid(s.teacherId)
          ? new mongoose.Types.ObjectId(s.teacherId)
          : undefined,
      })),
      status: data.status,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Examination created successfully",
        exam: newExam,
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

