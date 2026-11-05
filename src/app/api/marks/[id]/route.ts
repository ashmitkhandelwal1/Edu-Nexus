import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Marks } from "@/models/Marks";
import { Exam } from "@/models/Exam";
import { getAuthenticatedUser } from "@/lib/auth";
import { updateSingleMarksSchema } from "@/lib/validations/exam";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/marks/[id] — Update an individual marks entry
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
        { success: false, error: "Invalid marks record identifier" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = updateSingleMarksSchema.safeParse(body);

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

    const marksRecord = await Marks.findById(id);
    if (!marksRecord) {
      return NextResponse.json(
        { success: false, error: "Marks record not found" },
        { status: 404 }
      );
    }

    const exam = await Exam.findById(marksRecord.examId);
    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Associated examination not found" },
        { status: 404 }
      );
    }

    const subjectConfig = exam.subjects.find(
      (s) => s.subjectName.toLowerCase() === marksRecord.subjectName.toLowerCase()
    );

    const { marksObtained, remarks } = validation.data;

    if (subjectConfig && marksObtained > subjectConfig.maxMarks) {
      return NextResponse.json(
        {
          success: false,
          error: `Marks (${marksObtained}) cannot exceed max marks (${subjectConfig.maxMarks}) for ${marksRecord.subjectName}.`,
        },
        { status: 400 }
      );
    }

    marksRecord.marksObtained = marksObtained;
    if (remarks !== undefined) marksRecord.remarks = remarks;
    marksRecord.enteredBy = new mongoose.Types.ObjectId(authUser.userId);
    await marksRecord.save();

    return NextResponse.json({
      success: true,
      message: "Marks record updated successfully",
      marks: marksRecord,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

