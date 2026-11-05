import React from "react";
import { Clock, Calendar, MapPin, User, BookOpen } from "lucide-react";
import { getStudentProfile } from "@/lib/student-auth";
import { StudentShell } from "@/components/student/StudentShell";
import { Timetable, DayOfWeek } from "@/models/Timetable";
import "@/models/Teacher";

export default async function StudentTimetablePage() {
  const { user, student, classDoc } = await getStudentProfile();

  const classId = classDoc?._id || student.classId;

  const daysOfWeek: DayOfWeek[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  let timetables: any[] = [];
  if (classId) {
    timetables = await Timetable.find({
      classId,
    })
      .populate("periods.teacherId", "firstName lastName email")
      .lean();
  }

  // Map timetables by dayOfWeek
  const timetableByDay = new Map<string, any>();
  timetables.forEach((t) => {
    timetableByDay.set(t.dayOfWeek, t);
  });

  return (
    <StudentShell
      studentEmail={user.email}
      studentName={`${student.firstName} ${student.lastName}`}
      admissionNumber={student.admissionNumber}
      className={student.className}
      section={student.section}
    >
      <div className="space-y-8">
        <div className="pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" /> Weekly Class Schedule
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            My Timetable
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Official class routine for <span className="text-sky-400 font-semibold">{student.className} - {student.section}</span> (Monday to Saturday).
          </p>
        </div>

        {timetables.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-40 text-sky-400" />
            <p className="text-lg font-bold text-slate-300">No Timetable Configured</p>
            <p className="text-sm text-slate-500 mt-1">
              Your class timetable has not been published by the administration yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {daysOfWeek.map((day) => {
              const daySchedule = timetableByDay.get(day);
              const periods = daySchedule?.periods
                ? [...daySchedule.periods].sort((a, b) => a.periodNumber - b.periodNumber)
                : [];

              return (
                <div
                  key={day}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden"
                >
                  <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-sky-400" />
                      <h2 className="font-bold text-white text-base">{day}</h2>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
                      {periods.length} {periods.length === 1 ? "Period" : "Periods"}
                    </span>
                  </div>

                  {periods.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No periods scheduled for {day}
                    </div>
                  ) : (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {periods.map((p, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                            p.type === "break" || p.type === "lunch"
                              ? "bg-slate-950/40 border-slate-800/50 text-slate-400"
                              : "bg-slate-950/80 border-slate-800/90 text-slate-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              Period {p.periodNumber}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {p.startTime} - {p.endTime}
                            </span>
                          </div>

                          <div>
                            <div className="font-bold text-white text-sm capitalize">
                              {p.type === "class" ? p.subjectName : p.type}
                            </div>
                            {p.teacherId && (
                              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span>
                                  {p.teacherId.firstName} {p.teacherId.lastName}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="capitalize">{p.type}</span>
                            {p.roomNumber && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Room: {p.roomNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentShell>
  );
}

