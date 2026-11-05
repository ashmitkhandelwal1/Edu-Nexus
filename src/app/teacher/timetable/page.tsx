import { getTeacherProfile } from "@/lib/teacher-auth";
import { TeacherShell } from "@/components/teacher/TeacherShell";
import connectToDatabase from "@/lib/mongodb";
import { Timetable } from "@/models/Timetable";
import { Clock, Calendar, Building, Users } from "lucide-react";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export default async function TeacherTimetablePage() {
  const { user, teacher } = await getTeacherProfile();
  await connectToDatabase();

  const timetables = await Timetable.find({
    academicYear: "2026-27",
    "periods.teacherId": teacher._id,
  })
    .populate("classId", "className section roomNumber")
    .lean();

  const scheduleByDay: Record<string, any[]> = {};
  for (const day of DAYS_OF_WEEK) {
    scheduleByDay[day] = [];
  }

  timetables.forEach((tt: any) => {
    const day = tt.dayOfWeek;
    (tt.periods || []).forEach((p: any) => {
      if (p.teacherId && p.teacherId.toString() === teacher._id.toString()) {
        if (scheduleByDay[day]) {
          scheduleByDay[day].push({
            ...p,
            className: tt.classId?.className || "Class",
            section: tt.classId?.section || "Section",
            room: p.roomNumber || tt.classId?.roomNumber || "Main Room",
          });
        }
      }
    });
  });

  for (const day of DAYS_OF_WEEK) {
    scheduleByDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const totalAssignedPeriods = Object.values(scheduleByDay).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  return (
    <TeacherShell
      teacherEmail={user.email}
      teacherName={`${teacher.firstName} ${teacher.lastName}`}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-6 h-6 text-sky-400" />
              My Weekly Timetable Schedule
            </h1>
            <p className="text-sm text-slate-400">
              Read-only view of your assigned periods, classrooms, and lecture times
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs flex items-center gap-2">
            <span className="text-slate-400">Total Assigned Lectures:</span>
            <span className="font-bold text-white text-sm">{totalAssignedPeriods} / week</span>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const periods = scheduleByDay[day] || [];
            return (
              <div
                key={day}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sky-400" />
                      {day}
                    </h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                      {periods.length} {periods.length === 1 ? "Period" : "Periods"}
                    </span>
                  </div>

                  <div className="space-y-2 mt-3">
                    {periods.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 italic">
                        No lectures scheduled for {day}
                      </div>
                    ) : (
                      periods.map((p, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sky-400 text-xs">
                              {p.className} - {p.section}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {p.startTime} - {p.endTime}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-white">
                            {p.subjectName}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                            <span className="flex items-center gap-1 text-[10px]">
                              <Building className="w-3 h-3 text-slate-500" />
                              Room: {p.room}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Slot #{p.periodNumber}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TeacherShell>
  );
}

