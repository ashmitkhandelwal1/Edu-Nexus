import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { FeeStructure } from "@/models/FeeStructure";
import "@/models/Class";
import { getAuthenticatedUser } from "@/lib/auth";
import { feeStructureSchema } from "@/lib/validations/fee";

// GET /api/fees/structures — List fee structures with optional class and academicYear filters
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
    const academicYear = searchParams.get("academicYear")?.trim() || "";

    const filter: any = {};
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      filter.classId = new mongoose.Types.ObjectId(classId);
    }
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    const structures = await FeeStructure.find(filter)
      .populate("classId", "className section academicYear")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      structures,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/fees/structures — Create a new class fee structure
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
    const validation = feeStructureSchema.safeParse(body);

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

    // Verify class exists
    const classDoc = await mongoose.model("Class").findById(data.classId);
    if (!classDoc) {
      return NextResponse.json(
        { success: false, error: "Target class not found" },
        { status: 404 }
      );
    }

    const structure = await FeeStructure.create({
      ...data,
      classId: new mongoose.Types.ObjectId(data.classId),
      dueDate: new Date(data.dueDate),
    });

    const populated = await FeeStructure.findById(structure._id)
      .populate("classId", "className section academicYear");

    return NextResponse.json(
      {
        success: true,
        message: "Fee structure created successfully",
        structure: populated,
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

