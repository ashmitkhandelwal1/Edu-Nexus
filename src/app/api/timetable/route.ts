import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Timetable, DayOfWeek } from "@/models/Timetable";
import { Class } from "@/models/Class";
import { Teacher } from "@/models/Teacher";
import { getAuthenticatedUser } from "@/lib/auth";
import { createTimetableSchema } from "@/lib/validations/timetable";
import { checkTimetableConflicts } from "@/lib/timetable-conflict";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const academicYear = searchParams.get("academicYear");
    const dayOfWeek = searchParams.get("dayOfWeek");
    const teacherId = searchParams.get("teacherId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const query: any = {};

    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      query.classId = new mongoose.Types.ObjectId(classId);
    }
    if (academicYear) {
      query.academicYear = academicYear;
    }
    if (dayOfWeek) {
      query.dayOfWeek = dayOfWeek;
    }
    if (teacherId && mongoose.Types.ObjectId.isValid(teacherId)) {
      query["periods.teacherId"] = new mongoose.Types.ObjectId(teacherId);
    }

    const total = await Timetable.countDocuments(query);
    const timetables = await Timetable.find(query)
      .populate("classId", "className section academicYear roomNumber")
      .populate("periods.teacherId", "firstName lastName employeeId")
      .sort({ dayOfWeek: 1, "periods.periodNumber": 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: timetables,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("GET /api/timetable error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch timetables" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createTimetableSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        { success: false, message: firstError, errors: parsed.error.issues },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { classId, academicYear, dayOfWeek, periods } = parsed.data;

    // Check conflicts (internal overlap, class subject check, cross-class teacher conflict, cross-class classroom conflict)
    const conflict = await checkTimetableConflicts({
      classId,
      academicYear,
      dayOfWeek: dayOfWeek as DayOfWeek,
      periods: periods.map((p) => ({
        ...p,
        teacherId: p.teacherId || null,
        roomNumber: p.roomNumber || null,
      })),
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

    // Upsert or create timetable for this classId + academicYear + dayOfWeek
    const existing = await Timetable.findOne({
      classId: new mongoose.Types.ObjectId(classId),
      academicYear,
      dayOfWeek,
    });

    let timetable;
    if (existing) {
      existing.periods = periods as any;
      await existing.save();
      timetable = existing;
    } else {
      timetable = await Timetable.create({
        classId: new mongoose.Types.ObjectId(classId),
        academicYear,
        dayOfWeek,
        periods: periods as any,
      });
    }

    const populated = await Timetable.findById(timetable._id)
      .populate("classId", "className section academicYear roomNumber")
      .populate("periods.teacherId", "firstName lastName employeeId");

    return NextResponse.json(
      {
        success: true,
        message: "Timetable saved successfully",
        data: populated,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/timetable error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create timetable" },
      { status: 500 }
    );
  }
}

