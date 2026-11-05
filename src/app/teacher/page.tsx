import { getTeacherProfile } from "@/lib/teacher-auth";
import { TeacherShell } from "@/components/teacher/TeacherShell";
import connectToDatabase from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Timetable } from "@/models/Timetable";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { Announcement } from "@/models/Announcement";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Clock,
  FileText,
  CalendarCheck,
  Megaphone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function TeacherDashboardPage() {
  const { user, teacher, assignedClasses, assignedClassIds } = await getTeacherProfile();
  await connectToDatabase();

  const todayName = DAYS[new Date().getDay()];

  // 1. Total students across assigned classes
  const totalStudents = await Student.countDocuments({
    classId: { $in: assignedClassIds },
    status: "active",
  });

  // 2. Today's Timetable
  const timetables = await Timetable.find({
    academicYear: "2026-27",
    dayOfWeek: todayName as any,
    "periods.teacherId": teacher._id,
  })
    .populate("classId", "className section roomNumber")
    .lean();

  const todayPeriods: any[] = [];
  timetables.forEach((tt: any) => {
    (tt.periods || []).forEach((p: any) => {
      if (p.teacherId && p.teacherId.toString() === teacher._id.toString()) {
        todayPeriods.push({
          ...p,
          className: tt.classId?.className,
          section: tt.classId?.section,
          room: p.roomNumber || tt.classId?.roomNumber || "Main Room",
        });
      }
    });
  });
  todayPeriods.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // 3. Pending assignments to grade
  const teacherAssignments = await Assignment.find({
    $or: [{ teacherId: teacher._id }, { classId: { $in: assignedClassIds } }],
  }).select("_id title classId dueDate maxMarks");

  const asgIds = teacherAssignments.map((a) => a._id);
  const pendingSubmissionsCount = await Submission.countDocuments({
    assignmentId: { $in: asgIds },
    status: { $in: ["submitted", "late"] },
  });

  // 4. Recent Announcements
  const recentAnnouncements = await Announcement.find({
    status: "published",
    targetAudience: { $in: ["all", "teachers"] },
    publishAt: { $lte: new Date() },
  })
    .sort({ publishAt: -1 })
    .limit(3)
    .lean();

  return (
    <TeacherShell
      teacherEmail={user.email}
      teacherName={`${teacher.firstName} ${teacher.lastName}`}
    >
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {teacher.firstName}! 👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {teacher.department} Department • Employee ID: <span className="font-mono text-slate-300">{teacher.employeeId}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/teacher/attendance">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs gap-1.5 shadow-md">
                <CalendarCheck className="w-4 h-4" /> Mark Attendance
              </Button>
            </Link>
            <Link href="/teacher/assignments">
              <Button variant="outline" className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" /> Grade Homework
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Assigned Classes</span>
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl font-black text-white">{assignedClasses.length}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Cohort sections</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Students</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-black text-emerald-400">{totalStudents}</span>
            <span className="text-[10px] text-emerald-500/80 block mt-0.5">Enrolled pupil roster</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Today&apos;s Lectures</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-2xl font-black text-sky-400">{todayPeriods.length}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{todayName} schedule</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Submissions Pending</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl font-black text-amber-400">{pendingSubmissionsCount}</span>
            <span className="text-[10px] text-amber-500/80 block mt-0.5">Awaiting evaluation</span>
          </div>
        </div>

        {/* Schedule & Announcements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's Lectures */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" /> Today&apos;s Schedule ({todayName})
              </h3>
              <Link href="/teacher/timetable" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                Full Week <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {todayPeriods.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 italic">
                No lectures scheduled for today ({todayName}). Enjoy your lesson prep time!
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayPeriods.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-slate-950 border border-slate-800/80 p-3 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/20">
                        #{p.periodNumber}
                      </span>
                      <div>
                        <span className="font-bold text-white block text-sm">{p.subjectName}</span>
                        <span className="text-[11px] text-slate-400">
                          {p.className} - {p.section} • Room: {p.room}
                        </span>
                      </div>
                    </div>

                    <span className="font-mono text-xs font-semibold text-sky-300 bg-sky-950/40 border border-sky-800/40 px-2.5 py-1 rounded-lg">
                      {p.startTime} - {p.endTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Announcements & Bulletins */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-400" /> Staff Bulletins
              </h3>
              <Link href="/announcements" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                Noticeboard <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentAnnouncements.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 italic">
                No active announcements for staff.
              </div>
            ) : (
              <div className="space-y-3">
                {recentAnnouncements.map((a: any) => (
                  <div key={a._id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 block uppercase tracking-wider">
                      {new Date(a.publishAt).toLocaleDateString()}
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{a.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherShell>
  );
}

