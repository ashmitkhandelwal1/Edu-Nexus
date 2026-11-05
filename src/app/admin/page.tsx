import connectToDatabase from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";
import { Class } from "@/models/Class";
import { Attendance } from "@/models/Attendance";
import { Exam } from "@/models/Exam";
import { Timetable } from "@/models/Timetable";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export default async function AdminPage() {
  const user = await getAuthenticatedUser();
  await connectToDatabase();

  // Fetch real counts from MongoDB
  const [totalStudents, totalTeachers, totalClasses, totalExams, totalTimetables, attendanceAgg] =
    await Promise.all([
      Student.countDocuments({ status: "active" }),
      Teacher.countDocuments({ status: "active" }),
      Class.countDocuments({}),
      Exam.countDocuments({}),
      Timetable.countDocuments({}),
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

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <AdminDashboardClient
        realStats={{
          totalStudents,
          totalTeachers,
          totalClasses,
          totalExams,
          totalTimetables,
          attendanceRate,
        }}
      />
    </AdminShell>
  );
}
