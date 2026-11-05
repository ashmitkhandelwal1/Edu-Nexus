import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Timetable, DayOfWeek } from "@/models/Timetable";
import { getAuthenticatedUser } from "@/lib/auth";
import { updateTimetableSchema } from "@/lib/validations/timetable";
import { checkTimetableConflicts } from "@/lib/timetable-conflict";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid timetable ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const timetable = await Timetable.findById(id)
      .populate("classId", "className section academicYear roomNumber subjects")
      .populate("periods.teacherId", "firstName lastName employeeId")
      .lean();

    if (!timetable) {
      return NextResponse.json(
        { success: false, message: "Timetable not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: timetable,
    });
  } catch (error: any) {
    console.error("GET /api/timetable/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid timetable ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateTimetableSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        { success: false, message: firstError, errors: parsed.error.issues },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await Timetable.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Timetable not found" },
        { status: 404 }
      );
    }

    const { periods } = parsed.data;

    // Check conflicts excluding this timetable
    const conflict = await checkTimetableConflicts({
      classId: existing.classId.toString(),
      academicYear: existing.academicYear,
      dayOfWeek: existing.dayOfWeek as DayOfWeek,
      periods: periods.map((p) => ({
        ...p,
        teacherId: p.teacherId || null,
        roomNumber: p.roomNumber || null,
      })),
      excludeTimetableId: existing._id.toString(),
    });

    if (conflict.hasConflict) {
      return NextResponse.json(
        {
          success: false,
          message: conflict.message,
          conflict: conflict.conflictingDetails,
        },
        { status: 409 }
      );
    }

    existing.periods = periods as any;
    await existing.save();

    const populated = await Timetable.findById(existing._id)
      .populate("classId", "className section academicYear roomNumber")
      .populate("periods.teacherId", "firstName lastName employeeId");

    return NextResponse.json({
      success: true,
      message: "Timetable updated successfully",
      data: populated,
    });
  } catch (error: any) {
    console.error("PATCH /api/timetable/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update timetable" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid timetable ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deleted = await Timetable.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Timetable not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Timetable deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/timetable/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete timetable" },
      { status: 500 }
    );
  }
}
