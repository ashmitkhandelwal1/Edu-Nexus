import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Class } from "@/models/Class";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";
import { getAuthenticatedUser } from "@/lib/auth";
import { classUpdateSchema } from "@/lib/validations/class";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/classes/[id] — get single class details
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
        { success: false, error: "Invalid class ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const classRecord = await Class.findById(id)
      .populate("classTeacher", "firstName lastName employeeId email department")
      .populate("subjects.teacher", "firstName lastName employeeId email department")
      .lean();

    if (!classRecord) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    // Query enrolled students (supporting both classId and legacy className + section)
    const enrolledStudents = await Student.find({
      $or: [
        { classId: classRecord._id },
        {
          classId: { $exists: false },
          className: classRecord.className,
          section: classRecord.section,
        },
      ],
      status: "active",
    })
      .select("admissionNumber firstName lastName rollNumber email phone status")
      .sort({ rollNumber: 1, firstName: 1 })
      .lean();

    const studentCount = enrolledStudents.length;

    return NextResponse.json({
      success: true,
      class: {
        ...classRecord,
        studentCount,
        availableSeats: Math.max(0, classRecord.capacity - studentCount),
        students: enrolledStudents,
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

// PATCH /api/classes/[id] — update class details
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
        { success: false, error: "Invalid class ID" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = classUpdateSchema.safeParse(body);

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
    const currentClass = await Class.findById(id);

    if (!currentClass) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    // If capacity is reduced, ensure it is not less than currently enrolled students
    if (data.capacity !== undefined) {
      const currentStudentCount = await Student.countDocuments({
        $or: [
          { classId: currentClass._id },
          {
            classId: { $exists: false },
            className: currentClass.className,
            section: currentClass.section,
          },
        ],
        status: "active",
      });

      if (data.capacity < currentStudentCount) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot reduce capacity to ${data.capacity}. Class currently has ${currentStudentCount} enrolled students.`,
          },
          { status: 400 }
        );
      }
    }

    // Check duplicate compound combination if name, section, or academic year is being updated
    const targetName = data.className !== undefined ? data.className.trim() : currentClass.className;
    const targetSection = data.section !== undefined ? data.section.trim() : currentClass.section;
    const targetYear = data.academicYear !== undefined ? data.academicYear.trim() : currentClass.academicYear;

    if (
      targetName !== currentClass.className ||
      targetSection !== currentClass.section ||
      targetYear !== currentClass.academicYear
    ) {
      const existing = await Class.findOne({
        className: targetName,
        section: targetSection,
        academicYear: targetYear,
        _id: { $ne: id },
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: `A class with name "${targetName} - ${targetSection}" for academic year ${targetYear} already exists.`,
          },
          { status: 409 }
        );
      }
    }

    // Validate classTeacher if provided
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
          { success: false, error: "Assigned class teacher not found in records" },
          { status: 404 }
        );
      }
    }

    // Prepare update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};
    if (data.className !== undefined) updates.className = data.className.trim();
    if (data.section !== undefined) updates.section = data.section.trim();
    if (data.academicYear !== undefined) updates.academicYear = data.academicYear.trim();
    if (data.classTeacher !== undefined) {
      updates.classTeacher = data.classTeacher ? new mongoose.Types.ObjectId(data.classTeacher) : null;
    }
    if (data.roomNumber !== undefined) updates.roomNumber = data.roomNumber.trim();
    if (data.capacity !== undefined) updates.capacity = data.capacity;
    if (data.subjects !== undefined) {
      updates.subjects = data.subjects.map((s) => ({
        subjectName: s.subjectName.trim(),
        teacher: s.teacher ? new mongoose.Types.ObjectId(s.teacher) : undefined,
      }));
    }

    const updatedClass = await Class.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
      runValidators: true,
    })
      .populate("classTeacher", "firstName lastName employeeId email department")
      .populate("subjects.teacher", "firstName lastName employeeId email department")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Class updated successfully",
      class: updatedClass,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id] — delete class with student check
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
        { success: false, error: "Invalid class ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const classRecord = await Class.findById(id);

    if (!classRecord) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    // Check if class contains enrolled students
    const enrolledCount = await Student.countDocuments({
      $or: [
        { classId: classRecord._id },
        {
          classId: { $exists: false },
          className: classRecord.className,
          section: classRecord.section,
        },
      ],
      status: "active",
    });

    if (enrolledCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete class. It currently contains ${enrolledCount} enrolled student(s). Reassign or remove students first.`,
        },
        { status: 400 }
      );
    }

    await Class.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

