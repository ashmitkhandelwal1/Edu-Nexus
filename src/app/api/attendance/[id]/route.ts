import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Attendance } from "@/models/Attendance";
import { getAuthenticatedUser } from "@/lib/auth";
import { updateAttendanceRecordSchema } from "@/lib/validations/attendance";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/attendance/[id] — Update an individual attendance record
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
        { success: false, error: "Invalid attendance record ID" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = updateAttendanceRecordSchema.safeParse(body);

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

    const { status, remarks } = validation.data;

    const updated = await Attendance.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          remarks: remarks || "",
          markedBy: new mongoose.Types.ObjectId(authUser.userId),
        },
      },
      { returnDocument: "after" }
    )
      .populate("studentId", "firstName lastName admissionNumber rollNumber")
      .populate("classId", "className section")
      .lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Attendance record updated successfully",
      attendance: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

