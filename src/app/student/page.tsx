import React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  FileText,
  Award,
  CreditCard,
  Clock,
  Megaphone,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { getStudentProfile } from "@/lib/student-auth";
import { StudentShell } from "@/components/student/StudentShell";
import { Attendance } from "@/models/Attendance";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { Exam } from "@/models/Exam";
import { Marks } from "@/models/Marks";
import { FeeRecord } from "@/models/FeeRecord";
import { Timetable, DayOfWeek } from "@/models/Timetable";
import { Announcement } from "@/models/Announcement";
import "@/models/Class";

export default async function StudentDashboardPage() {
  const { user, student, classDoc } = await getStudentProfile();

  // 1. Attendance Metrics
  const attendanceRecords = await Attendance.find({
    studentId: student._id,
  }).lean();

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter((r) => r.status === "present").length;
  const lateDays = attendanceRecords.filter((r) => r.status === "late").length;
  const halfDays = attendanceRecords.filter((r) => r.status === "half-day").length;
  const absentDays = attendanceRecords.filter((r) => r.status === "absent").length;

  // Attendance % (present + late + 0.5 * half-day)
  const effectivePresent = presentDays + lateDays + halfDays * 0.5;
  const attendancePercentage =
    totalDays > 0 ? Math.round((effectivePresent / totalDays) * 100) : 100;

  // 2. Assignments & Submissions
  // Query assignments for student's class
  const classId = classDoc?._id || student.classId;
  let classAssignments: any[] = [];
  if (classId) {
    classAssignments = await Assignment.find({
      classId,
      status: { $in: ["published", "closed"] },
    })
      .sort({ dueDate: 1 })
      .lean();
  }

  const studentSubmissions = await Submission.find({
    studentId: student._id,
  }).lean();

  const submittedAssignmentIds = new Set(
    studentSubmissions.map((s) => s.assignmentId.toString())
  );

  const upcomingAssignments = classAssignments
    .filter((a) => !submittedAssignmentIds.has(a._id.toString()) && a.status === "published")
    .slice(0, 5);

  const pendingSubmissionsCount = upcomingAssignments.length;

  // 3. Exam Results (Only published exams!)
  const publishedExams = await Exam.find({
    classId,
    status: "published",
  })
    .sort({ createdAt: -1 })
    .lean();

  const publishedExamIds = publishedExams.map((e) => e._id);
  const studentMarks = await Marks.find({
    studentId: student._id,
    examId: { $in: publishedExamIds },
  })
    .populate("examId", "examName examType academicYear")
    .sort({ updatedAt: -1 })
    .lean();

  // Group marks by exam
  const examMap = new Map<string, { exam: any; marks: any[] }>();
  publishedExams.forEach((e) => {
    examMap.set(e._id.toString(), { exam: e, marks: [] });
  });
  studentMarks.forEach((m: any) => {
    const eId = m.examId?._id?.toString() || m.examId?.toString();
    if (examMap.has(eId)) {
      examMap.get(eId)!.marks.push(m);
    }
  });

  const recentExamsList = Array.from(examMap.values())
    .filter((g) => g.marks.length > 0)
    .slice(0, 3);

  // 4. Fee Overview
  const feeRecords = await FeeRecord.find({
    studentId: student._id,
  }).lean();

  const totalFeeAmount = feeRecords.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
  const totalPaidAmount = feeRecords.reduce((acc, r) => acc + (r.paidAmount || 0), 0);
  const outstandingBalance = feeRecords.reduce((acc, r) => acc + (r.pendingAmount || 0), 0);

  // 5. Today's Timetable
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const todayName = days[new Date().getDay()];

  let todayPeriods: any[] = [];
  if (classId && todayName !== "Sunday") {
    const timetable = await Timetable.findOne({
      classId,
      dayOfWeek: todayName as any,
    })
      .populate("periods.teacherId", "firstName lastName")
      .lean();

    if (timetable && timetable.periods) {
      todayPeriods = timetable.periods.sort((a, b) => a.periodNumber - b.periodNumber);
    }
  }

  // 6. Recent Announcements
  const now = new Date();
  const announcements = await Announcement.find({
    status: "published",
    publishAt: { $lte: now },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
    targetAudience: { $in: ["all", "students"] },
  })
    .sort({ publishAt: -1 })
    .limit(4)
    .lean();

  return (
    <StudentShell
      studentEmail={user.email}
      studentName={`${student.firstName} ${student.lastName}`}
      admissionNumber={student.admissionNumber}
      className={student.className}
      section={student.section}
    >
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Welcome back, {student.firstName}! 👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Class <span className="text-sky-400 font-semibold">{student.className} - {student.section}</span> • Roll No:{" "}
              <span className="text-slate-200 font-mono font-medium">{student.rollNumber || "N/A"}</span> • Admission No:{" "}
              <span className="text-slate-200 font-mono font-medium">{student.admissionNumber}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/student/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              View Full Profile
            </Link>
          </div>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Attendance Stat */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Attendance
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{attendancePercentage}%</span>
              <span className="text-xs text-slate-400">overall</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>{presentDays} Present</span>
              <span className="text-rose-400">{absentDays} Absent</span>
            </div>
          </div>

          {/* Pending Submissions */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Pending Homework
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{pendingSubmissionsCount}</span>
              <span className="text-xs text-slate-400">to submit</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {pendingSubmissionsCount === 0 ? "All caught up! 🎉" : "Action required"}
            </div>
          </div>

          {/* Fee Balance */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Fee Balance
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">₹{outstandingBalance.toLocaleString()}</span>
              <span className="text-xs text-slate-400">due</span>
            </div>
            <div className="mt-2 text-xs text-emerald-400">
              ₹{totalPaidAmount.toLocaleString()} paid of ₹{totalFeeAmount.toLocaleString()}
            </div>
          </div>

          {/* Exams Evaluated */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Published Results
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{recentExamsList.length}</span>
              <span className="text-xs text-slate-400">exams published</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              <Link href="/student/results" className="text-purple-400 hover:underline">
                View Report Cards →
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Split: Timetable & Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-sky-400" />
                <h2 className="text-lg font-bold text-white">Today&apos;s Schedule ({todayName})</h2>
              </div>
              <Link
                href="/student/timetable"
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                Full Week <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {todayPeriods.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No periods scheduled for today ({todayName}).</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayPeriods.map((period, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center border border-sky-500/20">
                        P{period.periodNumber}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white capitalize">
                          {period.type === "class" ? period.subjectName : period.type}
                        </div>
                        <div className="text-xs text-slate-400">
                          {period.teacherId
                            ? `Teacher: ${period.teacherId.firstName} ${period.teacherId.lastName}`
                            : period.type !== "class"
                            ? "Break Period"
                            : "No teacher assigned"}
                          {period.roomNumber ? ` • Room: ${period.roomNumber}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                      {period.startTime} - {period.endTime}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Assignments */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Upcoming Homework & Tasks</h2>
              </div>
              <Link
                href="/student/assignments"
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingAssignments.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/70" />
                <p className="text-sm">Great job! You have no pending submissions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((a) => (
                  <div
                    key={a._id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-sm font-semibold text-white truncate">{a.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        <span className="text-sky-400 font-medium">{a.subjectName}</span> • Max Marks:{" "}
                        {a.maxMarks}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-medium text-amber-400">
                        Due: {new Date(a.dueDate).toLocaleDateString()}
                      </div>
                      <Link
                        href="/student/assignments"
                        className="text-[11px] text-sky-400 hover:underline mt-0.5 inline-block"
                      >
                        Submit Answer →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Megaphone className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Latest Announcements & Bulletins</h2>
            </div>
            <Link
              href="/announcements"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Noticeboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Megaphone className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No announcements at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.map((item: any) => (
                <div
                  key={item._id.toString()}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                      {item.targetAudience.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(item.publishAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
}
