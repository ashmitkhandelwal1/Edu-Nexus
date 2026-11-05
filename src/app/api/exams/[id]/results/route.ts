import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { Student } from "@/models/Student";
import { Marks } from "@/models/Marks";
import { getAuthenticatedUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Standard Educational Percentage Grading Scale:
 * 90% - 100% : A+ (Outstanding)
 * 80% - 89.9%: A  (Excellent)
 * 70% - 79.9%: B  (Very Good)
 * 60% - 69.9%: C  (Good)
 * 50% - 59.9%: D  (Satisfactory)
 * 33% - 49.9%: E  (Marginal Pass)
 * Below 33%  : F  (Fail)
 *
 * Strict Passing Rule:
 * A student fails if they score below passMarks in ANY subject.
 */
function getLetterGrade(percentage: number, isPassing: boolean): string {
  if (!isPassing || percentage < 33) return "F";
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "E";
}

// GET /api/exams/[id]/results — Tabulate comprehensive student rankings, class averages & marks
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
        { success: false, error: "Invalid examination identifier" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const exam = await Exam.findById(id)
      .populate("classId", "className section academicYear")
      .lean();

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Examination not found" },
        { status: 404 }
      );
    }

    // 1. Get class cohort students
    const students = await Student.find({
      $or: [
        { classId: exam.classId },
        {
          classId: { $exists: false },
        },
      ],
      status: "active",
    })
      .select("admissionNumber firstName lastName rollNumber")
      .sort({ rollNumber: 1, firstName: 1 })
      .lean();

    // 2. Fetch all recorded marks for this exam
    const allMarks = await Marks.find({ examId: exam._id }).lean();

    // Index marks by studentId -> subjectName -> marks record
    const marksByStudent = new Map<string, Map<string, number>>();
    for (const m of allMarks) {
      const sId = m.studentId.toString();
      if (!marksByStudent.has(sId)) {
        marksByStudent.set(sId, new Map());
      }
      marksByStudent.get(sId)!.set(m.subjectName.toLowerCase(), m.marksObtained);
    }

    const totalExamMaxMarks = exam.subjects.reduce(
      (sum, s) => sum + s.maxMarks,
      0
    );

    // 3. Tabulate each student's results
    const studentResults = students.map((st) => {
      const studentMarksMap = marksByStudent.get(st._id.toString()) || new Map();
      let totalObtained = 0;
      let hasFailedAnySubject = false;

      const subjectBreakdown = exam.subjects.map((sub) => {
        const marks = studentMarksMap.get(sub.subjectName.toLowerCase());
        const isRecorded = marks !== undefined;
        const obtained = isRecorded ? marks : 0;
        const isPassed = isRecorded ? obtained >= sub.passMarks : false;

        if (!isPassed) {
          hasFailedAnySubject = true;
        }

        totalObtained += obtained;

        return {
          subjectName: sub.subjectName,
          maxMarks: sub.maxMarks,
          passMarks: sub.passMarks,
          marksObtained: isRecorded ? obtained : null,
          isPassed,
        };
      });

      const percentage =
        totalExamMaxMarks > 0
          ? Math.round((totalObtained / totalExamMaxMarks) * 1000) / 10
          : 0;

      const isOverallPass = !hasFailedAnySubject && percentage >= 33;
      const grade = getLetterGrade(percentage, isOverallPass);

      return {
        student: {
          _id: st._id,
          admissionNumber: st.admissionNumber,
          name: `${st.firstName} ${st.lastName}`,
          rollNumber: st.rollNumber || "—",
        },
        subjects: subjectBreakdown,
        totalObtained,
        totalMaxMarks: totalExamMaxMarks,
        percentage,
        isOverallPass,
        grade,
        rank: 1, // Will be computed next
      };
    });

    // 4. Sort and assign ranks (higher totalObtained = better rank)
    studentResults.sort((a, b) => b.totalObtained - a.totalObtained);

    let currentRank = 1;
    for (let i = 0; i < studentResults.length; i++) {
      if (
        i > 0 &&
        studentResults[i].totalObtained < studentResults[i - 1].totalObtained
      ) {
        currentRank = i + 1;
      }
      studentResults[i].rank = currentRank;
    }

    // 5. Compute Class Overview Statistics
    const studentsWithMarks = studentResults.filter((r) =>
      r.subjects.some((s) => s.marksObtained !== null)
    );

    const totalEvaluated = studentsWithMarks.length;
    const passedCount = studentResults.filter((r) => r.isOverallPass).length;
    const failedCount = totalEvaluated - passedCount;
    const highestScore =
      studentResults.length > 0 ? studentResults[0].totalObtained : 0;
    const averageScore =
      totalEvaluated > 0
        ? Math.round(
            (studentsWithMarks.reduce((sum, r) => sum + r.totalObtained, 0) /
              totalEvaluated) *
              10
          ) / 10
        : 0;

    const classAveragePercentage =
      totalExamMaxMarks > 0 && totalEvaluated > 0
        ? Math.round((averageScore / totalExamMaxMarks) * 1000) / 10
        : 0;

    return NextResponse.json({
      success: true,
      exam,
      overview: {
        totalStudents: students.length,
        totalEvaluated,
        passedCount,
        failedCount,
        passPercentage:
          totalEvaluated > 0
            ? Math.round((passedCount / totalEvaluated) * 1000) / 10
            : 0,
        highestScore,
        averageScore,
        classAveragePercentage,
        totalExamMaxMarks,
      },
      results: studentResults,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

