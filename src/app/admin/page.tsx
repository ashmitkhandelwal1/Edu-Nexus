import connectToDatabase from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";
import { Class } from "@/models/Class";
import { Attendance } from "@/models/Attendance";
import { Exam } from "@/models/Exam";
import { Timetable } from "@/models/Timetable";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { FeeRecord } from "@/models/FeeRecord";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export default async function AdminPage() {
  const user = await getAuthenticatedUser();
  await connectToDatabase();

  // Fetch real counts from MongoDB
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalExams,
    totalTimetables,
    totalAssignments,
    publishedAssignments,
    totalSubmissions,
    pendingSubmissions,
    feeAgg,
    attendanceAgg,
  ] = await Promise.all([
    Student.countDocuments({ status: "active" }),
    Teacher.countDocuments({ status: "active" }),
    Class.countDocuments({}),
    Exam.countDocuments({}),
    Timetable.countDocuments({}),
    Assignment.countDocuments({}),
    Assignment.countDocuments({ status: "published" }),
    Submission.countDocuments({}),
    Submission.countDocuments({ status: { $in: ["submitted", "late"] } }),
    FeeRecord.aggregate([
      {
        $group: {
          _id: null,
          totalExpected: { $sum: "$totalAmount" },
          totalCollected: { $sum: "$paidAmount" },
          totalOutstanding: { $sum: "$pendingAmount" },
          overdue: { $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] } },
        },
      },
    ]),
    Attendance.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
            },
            late: {
              $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
            },
            halfDay: {
              $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

  let attendanceRate = "100%";
  if (attendanceAgg.length > 0 && attendanceAgg[0].total > 0) {
    const total = attendanceAgg[0].total;
    const effectivePresent =
      attendanceAgg[0].present +
      attendanceAgg[0].late +
      attendanceAgg[0].halfDay * 0.5;
    const rate = Math.round((effectivePresent / total) * 1000) / 10;
    attendanceRate = `${rate}%`;
  }

  const feeStats = feeAgg[0] || {
    totalExpected: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    overdue: 0,
  };

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <AdminDashboardClient
        realStats={{
          totalStudents,
          totalTeachers,
          totalClasses,
          totalExams,
          totalTimetables,
          totalAssignments,
          publishedAssignments,
          totalSubmissions,
          pendingSubmissions,
          totalFeesExpected: feeStats.totalExpected,
          totalFeesCollected: feeStats.totalCollected,
          totalFeesOutstanding: feeStats.totalOutstanding,
          overdueFeeCount: feeStats.overdue,
          attendanceRate,
        }}
      />
    </AdminShell>
  );
}
