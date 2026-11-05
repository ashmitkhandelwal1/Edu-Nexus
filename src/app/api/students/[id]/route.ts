import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { getAuthenticatedUser } from "@/lib/auth";
import { studentUpdateSchema } from "@/lib/validations/student";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/students/[id] — Fetch single student details
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
        { success: false, error: "Invalid student identifier" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const student = await Student.findById(id).lean();

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PATCH /api/students/[id] — Update student details
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
        { success: false, error: "Invalid student identifier" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = studentUpdateSchema.safeParse(body);

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

    // Check admission number conflict if changed
    if (data.admissionNumber) {
      const existing = await Student.findOne({
        admissionNumber: data.admissionNumber.trim(),
        _id: { $ne: id },
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: `Admission number "${data.admissionNumber}" is already in use by another student.`,
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
    if (data.admissionDate) {
      updates.admissionDate = new Date(data.admissionDate);
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
      runValidators: true,
    }).lean();

    if (!updatedStudent) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student record updated successfully",
      student: updatedStudent,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id] — Remove student record
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
        { success: false, error: "Invalid student identifier" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deletedStudent = await Student.findByIdAndDelete(id).lean();

    if (!deletedStudent) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

