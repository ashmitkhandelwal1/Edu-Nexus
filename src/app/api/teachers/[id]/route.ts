import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { getAuthenticatedUser } from "@/lib/auth";
import { teacherUpdateSchema } from "@/lib/validations/teacher";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/teachers/[id] — retrieve single teacher details
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
        { success: false, error: "Invalid faculty identifier" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const teacher = await Teacher.findById(id).lean();

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      teacher,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PATCH /api/teachers/[id] — update teacher record
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
        { success: false, error: "Invalid faculty identifier" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = teacherUpdateSchema.safeParse(body);

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

    // Check employeeId conflict if updated
    if (data.employeeId) {
      const existingEmp = await Teacher.findOne({
        employeeId: data.employeeId.trim(),
        _id: { $ne: id },
      });
      if (existingEmp) {
        return NextResponse.json(
          {
            success: false,
            error: `Employee ID "${data.employeeId}" is already assigned to another faculty member.`,
          },
          { status: 409 }
        );
      }
    }

    // Check email conflict if updated
    if (data.email) {
      const existingEmail = await Teacher.findOne({
        email: data.email.trim().toLowerCase(),
        _id: { $ne: id },
      });
      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            error: `Email "${data.email}" is already used by another faculty member.`,
          },
          { status: 409 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { ...data };
    if (data.dateOfBirth) {
      updates.dateOfBirth = new Date(data.dateOfBirth);
    }
    if (data.joiningDate) {
      updates.joiningDate = new Date(data.joiningDate);
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
      runValidators: true,
    }).lean();

    if (!updatedTeacher) {
      return NextResponse.json(
        { success: false, error: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Teacher record updated successfully",
      teacher: updatedTeacher,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/teachers/[id] — remove teacher record
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
        { success: false, error: "Invalid faculty identifier" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deletedTeacher = await Teacher.findByIdAndDelete(id).lean();

    if (!deletedTeacher) {
      return NextResponse.json(
        { success: false, error: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

