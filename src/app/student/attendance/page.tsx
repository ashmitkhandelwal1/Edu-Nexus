import React from "react";
import { CalendarCheck } from "lucide-react";
import { getStudentProfile } from "@/lib/student-auth";
import { StudentShell } from "@/components/student/StudentShell";
import { Attendance } from "@/models/Attendance";
import { StudentAttendanceClient } from "@/components/student/StudentAttendanceClient";

export default async function StudentAttendancePage() {
  const { user, student } = await getStudentProfile();

  const records = await Attendance.find({
    studentId: student._id,
  })
    .sort({ date: -1 })
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
        <div className="pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <CalendarCheck className="w-4 h-4" /> Academic Attendance Record
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            My Attendance Records
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track daily class presence, excused absences, tardiness, and session-wise attendance history.
          </p>
        </div>

        <StudentAttendanceClient records={JSON.parse(JSON.stringify(records))} />
      </div>
    </StudentShell>
  );
}

