import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Marks } from "@/models/Marks";
import { Exam } from "@/models/Exam";
import { Student } from "@/models/Student";
import "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";
import { bulkMarksSchema } from "@/lib/validations/exam";

// GET /api/marks — Query marks by examId, studentId, or subjectName
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
    const examId = searchParams.get("examId")?.trim() || "";
    const studentId = searchParams.get("studentId")?.trim() || "";
    const subjectName = searchParams.get("subjectName")?.trim() || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (examId && mongoose.Types.ObjectId.isValid(examId)) {
      filter.examId = new mongoose.Types.ObjectId(examId);
    }
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      filter.studentId = new mongoose.Types.ObjectId(studentId);
    }
    if (subjectName) {
      filter.subjectName = subjectName;
    }

    const marksRecords = await Marks.find(filter)
      .populate("studentId", "admissionNumber firstName lastName rollNumber")
      .populate("enteredBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      marks: marksRecords,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/marks — Bulk save/update marks for students in an exam subject
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
    const validation = bulkMarksSchema.safeParse(body);

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

    const { examId, subjectName, records } = validation.data;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return NextResponse.json(
        { success: false, error: "Invalid examination identifier" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Examination not found" },
        { status: 404 }
      );
    }

    // 1. Verify subject belongs to the examination
    const subjectConfig = exam.subjects.find(
      (s) => s.subjectName.toLowerCase() === subjectName.toLowerCase()
    );

    if (!subjectConfig) {
      return NextResponse.json(
        {
          success: false,
          error: `Subject "${subjectName}" is not part of examination "${exam.examName}".`,
        },
        { status: 400 }
      );
    }

    // 2. Verify all marks are within bounds (0 to maxMarks)
    for (const rec of records) {
      if (rec.marksObtained < 0 || rec.marksObtained > subjectConfig.maxMarks) {
        return NextResponse.json(
          {
            success: false,
            error: `Marks for student (${rec.marksObtained}) must be between 0 and maximum marks (${subjectConfig.maxMarks}).`,
          },
          { status: 400 }
        );
      }
    }

    // 3. Verify students belong to the examination's class
    const studentIds = records.map((r) => r.studentId);
    const enrolledStudents = await Student.find({
      _id: { $in: studentIds },
      $or: [
        { classId: exam.classId },
        {
          classId: { $exists: false },
        },
      ],
      status: "active",
    });

    const enrolledIdSet = new Set(enrolledStudents.map((s) => s._id.toString()));

    for (const sid of studentIds) {
      if (!enrolledIdSet.has(sid)) {
        return NextResponse.json(
          {
            success: false,
            error: `Student with ID "${sid}" is not enrolled in this examination's class cohort.`,
          },
          { status: 400 }
        );
      }
    }

    // 4. Bulk upsert marks matching { examId, studentId, subjectName }
    const bulkOps = records.map((item) => ({
      updateOne: {
        filter: {
          examId: exam._id,
          studentId: new mongoose.Types.ObjectId(item.studentId),
          subjectName: subjectConfig.subjectName,
        },
        update: {
          $set: {
            marksObtained: item.marksObtained,
            remarks: item.remarks || "",
            enteredBy: new mongoose.Types.ObjectId(authUser.userId),
          },
        },
        upsert: true,
      },
    }));

    await Marks.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      message: `Marks for ${records.length} student(s) in "${subjectConfig.subjectName}" saved successfully.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

