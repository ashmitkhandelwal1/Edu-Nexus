import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Attendance } from "@/models/Attendance";
import { Class } from "@/models/Class";
import { getAuthenticatedUser } from "@/lib/auth";

// Attendance Percentage Formula:
// Full-day present and late count as 1.0 (100%).
// Half-day counts as 0.5 (50%).
// Absent counts as 0.0 (0%).
// Overall Attendance % = ((Present + Late) * 1.0 + (HalfDay * 0.5)) / Total Records * 100

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
    const classId = searchParams.get("classId")?.trim() || "";
    const startDate = searchParams.get("startDate")?.trim() || "";
    const endDate = searchParams.get("endDate")?.trim() || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      filter.classId = new mongoose.Types.ObjectId(classId);
    }

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.date = { $gte: startDate };
    } else if (endDate) {
      filter.date = { $lte: endDate };
    }

    // 1. Overall Status Totals
    const statusCounts = await Attendance.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;

    statusCounts.forEach((item) => {
      if (item._id === "present") present = item.count;
      else if (item._id === "absent") absent = item.count;
      else if (item._id === "late") late = item.count;
      else if (item._id === "half-day") halfDay = item.count;
    });

    const totalRecords = present + absent + late + halfDay;
    const effectivePresentUnits = present + late + halfDay * 0.5;
    const overallPercentage =
      totalRecords > 0
        ? Math.round((effectivePresentUnits / totalRecords) * 1000) / 10
        : 100;

    // 2. Class-wise Breakdown
    const classStats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$classId",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "classes",
          localField: "_id",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      { $unwind: { path: "$classInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          classId: "$_id",
          className: "$classInfo.className",
          section: "$classInfo.section",
          academicYear: "$classInfo.academicYear",
          total: 1,
          present: 1,
          late: 1,
          halfDay: 1,
          absent: 1,
          percentage: {
            $cond: [
              { $gt: ["$total", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $add: [
                              "$present",
                              "$late",
                              { $multiply: ["$halfDay", 0.5] },
                            ],
                          },
                          "$total",
                        ],
                      },
                      100,
                    ],
                  },
                  1,
                ],
              },
              100,
            ],
          },
        },
      },
      { $sort: { className: 1, section: 1 } },
    ]);

    // 3. Student-wise Attendance Ranking (Top / Needs Attention)
    const studentStats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$studentId",
          totalDays: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      { $unwind: { path: "$studentInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          studentId: "$_id",
          name: {
            $concat: ["$studentInfo.firstName", " ", "$studentInfo.lastName"],
          },
          admissionNumber: "$studentInfo.admissionNumber",
          className: "$studentInfo.className",
          section: "$studentInfo.section",
          rollNumber: "$studentInfo.rollNumber",
          totalDays: 1,
          present: 1,
          late: 1,
          halfDay: 1,
          absent: 1,
          percentage: {
            $cond: [
              { $gt: ["$totalDays", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $add: [
                              "$present",
                              "$late",
                              { $multiply: ["$halfDay", 0.5] },
                            ],
                          },
                          "$totalDays",
                        ],
                      },
                      100,
                    ],
                  },
                  1,
                ],
              },
              100,
            ],
          },
        },
      },
      { $sort: { percentage: 1 } },
      { $limit: 20 },
    ]);

    // 4. Monthly Trend Analysis
    const monthlyStats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $substr: ["$date", 0, 7] }, // YYYY-MM
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        },
      },
      {
        $project: {
          month: "$_id",
          total: 1,
          present: 1,
          late: 1,
          halfDay: 1,
          absent: 1,
          percentage: {
            $cond: [
              { $gt: ["$total", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $add: [
                              "$present",
                              "$late",
                              { $multiply: ["$halfDay", 0.5] },
                            ],
                          },
                          "$total",
                        ],
                      },
                      100,
                    ],
                  },
                  1,
                ],
              },
              100,
            ],
          },
        },
      },
      { $sort: { month: -1 } },
      { $limit: 12 },
    ]);

    return NextResponse.json({
      success: true,
      summary: {
        totalRecords,
        overallPercentage,
        totals: {
          present,
          absent,
          late,
          halfDay,
        },
      },
      classStats,
      studentStats,
      monthlyStats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

