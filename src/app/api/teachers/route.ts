import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { getAuthenticatedUser } from "@/lib/auth";
import { teacherSchema } from "@/lib/validations/teacher";

// GET /api/teachers — list teachers with pagination, search, and department/status filters
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
    const department = searchParams.get("department")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (department) {
      filter.department = department;
    }
    if (status && (status === "active" || status === "inactive")) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    const totalTeachers = await Teacher.countDocuments(filter);
    const totalPages = Math.ceil(totalTeachers / limit);
    const skip = (page - 1) * limit;

    const teachers = await Teacher.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      teachers,
      pagination: {
        total: totalTeachers,
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

// POST /api/teachers — register new teacher
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
    const validation = teacherSchema.safeParse(body);

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

    // Check duplicate employee ID
    const existingEmpId = await Teacher.findOne({
      employeeId: data.employeeId.trim(),
    });
    if (existingEmpId) {
      return NextResponse.json(
        {
          success: false,
          error: `Employee ID "${data.employeeId}" is already assigned to a faculty member.`,
        },
        { status: 409 }
      );
    }

    // Check duplicate email
    const existingEmail = await Teacher.findOne({
      email: data.email.trim().toLowerCase(),
    });
    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: `Email address "${data.email}" is already registered.`,
        },
        { status: 409 }
      );
    }

    const teacherToCreate = {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
    };

    const newTeacher = await Teacher.create(teacherToCreate);

    return NextResponse.json(
      {
        success: true,
        message: "Faculty member registered successfully",
        teacher: newTeacher,
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

