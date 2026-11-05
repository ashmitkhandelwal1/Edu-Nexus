import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { getAuthenticatedUser } from "@/lib/auth";
import { studentSchema } from "@/lib/validations/student";

// GET /api/students — List students with pagination, search, and filters
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const className = searchParams.get("className")?.trim() || "";
    const section = searchParams.get("section")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    // Build filter query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (className) {
      filter.className = className;
    }
    if (section) {
      filter.section = section;
    }
    if (status && (status === "active" || status === "inactive")) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { admissionNumber: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
      ];
    }

    const totalStudents = await Student.countDocuments(filter);
    const totalPages = Math.ceil(totalStudents / limit);
    const skip = (page - 1) * limit;

    const students = await Student.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      students,
      pagination: {
        total: totalStudents,
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

// POST /api/students — Create new student
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
    const validation = studentSchema.safeParse(body);

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

    // Check for duplicate admission number
    const existing = await Student.findOne({
      admissionNumber: data.admissionNumber.trim(),
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Admission number "${data.admissionNumber}" is already registered.`,
        },
        { status: 409 }
      );
    }

    // Convert date strings to Date objects if provided
    const studentToCreate = {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      admissionDate: data.admissionDate ? new Date(data.admissionDate) : new Date(),
    };

    const newStudent = await Student.create(studentToCreate);

    return NextResponse.json(
      {
        success: true,
        message: "Student record registered successfully",
        student: newStudent,
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

