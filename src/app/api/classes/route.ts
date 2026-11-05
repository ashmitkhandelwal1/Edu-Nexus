import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Class } from "@/models/Class";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";
import { getAuthenticatedUser } from "@/lib/auth";
import { classSchema } from "@/lib/validations/class";

// GET /api/classes — list classes with filters, teacher population, and actual student count
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
    const academicYear = searchParams.get("academicYear")?.trim() || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (academicYear) {
      filter.academicYear = academicYear;
    }

    if (search) {
      filter.$or = [
        { className: { $regex: search, $options: "i" } },
        { section: { $regex: search, $options: "i" } },
        { roomNumber: { $regex: search, $options: "i" } },
      ];
    }

    const totalClasses = await Class.countDocuments(filter);
    const totalPages = Math.ceil(totalClasses / limit);
    const skip = (page - 1) * limit;

    const classes = await Class.find(filter)
      .populate("classTeacher", "firstName lastName employeeId email")
      .populate("subjects.teacher", "firstName lastName employeeId")
      .sort({ className: 1, section: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Attach real enrolled student count for each class
    const classesWithStudentCounts = await Promise.all(
      classes.map(async (c) => {
        const studentCount = await Student.countDocuments({
          $or: [
            { classId: c._id },
            {
              classId: { $exists: false },
              className: c.className,
              section: c.section,
            },
          ],
          status: "active",
        });

        return {
          ...c,
          studentCount,
          availableSeats: Math.max(0, c.capacity - studentCount),
        };
      })
    );

    return NextResponse.json({
      success: true,
      classes: classesWithStudentCounts,
      pagination: {
        total: totalClasses,
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

// POST /api/classes — create a new class & section
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
    const validation = classSchema.safeParse(body);

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

    // Validate classTeacher exists if provided
    if (data.classTeacher) {
      if (!mongoose.Types.ObjectId.isValid(data.classTeacher)) {
        return NextResponse.json(
          { success: false, error: "Invalid class teacher ID" },
          { status: 400 }
        );
      }
      const teacherExists = await Teacher.findById(data.classTeacher);
      if (!teacherExists) {
        return NextResponse.json(
          { success: false, error: "Assigned class teacher was not found in records" },
          { status: 404 }
        );
      }
    }

    // Check duplicate compound combination (className + section + academicYear)
    const existing = await Class.findOne({
      className: data.className.trim(),
      section: data.section.trim(),
      academicYear: data.academicYear.trim(),
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Class "${data.className} - ${data.section}" for academic year ${data.academicYear} already exists.`,
        },
        { status: 409 }
      );
    }

    const newClass = await Class.create({
      className: data.className.trim(),
      section: data.section.trim(),
      academicYear: data.academicYear.trim(),
      classTeacher: data.classTeacher || undefined,
      subjects: (data.subjects || []).map((s) => ({
        subjectName: s.subjectName.trim(),
        teacher: s.teacher ? new mongoose.Types.ObjectId(s.teacher) : undefined,
      })),
      roomNumber: data.roomNumber?.trim(),
      capacity: data.capacity,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Class created successfully",
        class: newClass,
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

