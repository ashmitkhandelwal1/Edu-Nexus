import { getTeacherProfile } from "@/lib/teacher-auth";
import { TeacherShell } from "@/components/teacher/TeacherShell";
import connectToDatabase from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { BookOpen, Users, GraduationCap, Building } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TeacherClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const { user, teacher, assignedClasses, assignedClassIds } = await getTeacherProfile();
  await connectToDatabase();

  const { selected } = await searchParams;
  const activeClassId = selected || assignedClassIds[0] || null;

  // Student counts for each assigned class
  const studentCounts = await Student.aggregate([
    { $match: { classId: { $in: assignedClasses.map((c: any) => c._id) }, status: "active" } },
    { $group: { _id: "$classId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map();
  studentCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

  // If a class is selected, load its student roster (read-only)
  let roster: any[] = [];
  let selectedClassObj: any = null;

  if (activeClassId && assignedClassIds.includes(activeClassId)) {
    selectedClassObj = assignedClasses.find((c: any) => c._id.toString() === activeClassId);
    roster = await Student.find({
      classId: activeClassId,
      status: "active",
    })
      .select("admissionNumber firstName lastName rollNumber email phone gender")
      .sort({ rollNumber: 1, firstName: 1 })
      .lean();
  }

  return (
    <TeacherShell
      teacherEmail={user.email}
      teacherName={`${teacher.firstName} ${teacher.lastName}`}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-400" />
            My Assigned Classes & Student Rosters
          </h1>
          <p className="text-sm text-slate-400">
            View cohort student rosters, roll numbers, and assigned subjects
          </p>
        </div>

        {/* Classes Horizontal Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {assignedClasses.map((cls: any) => {
            const count = countMap.get(cls._id.toString()) || 0;
            const isSelected = activeClassId === cls._id.toString();

            return (
              <Link
                key={cls._id}
                href={`/teacher/classes?selected=${cls._id}`}
                className={`p-4 rounded-2xl border transition ${
                  isSelected
                    ? "bg-blue-600/10 border-blue-500/50 shadow-md"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-white">
                    {cls.className} - {cls.section}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    {cls.academicYear}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    {count} Students
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Room: {cls.roomNumber || "Main"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Student Roster Table */}
        {selectedClassObj ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-4 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                  Roster: {selectedClassObj.className} - {selectedClassObj.section}
                </h3>
                <p className="text-xs text-slate-400">
                  {roster.length} registered students enrolled for academic year {selectedClassObj.academicYear}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Roll #</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Admission #</th>
                    <th className="py-2.5 px-3">Gender</th>
                    <th className="py-2.5 px-3">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {roster.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                        No active students found in this section.
                      </td>
                    </tr>
                  ) : (
                    roster.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-white">
                          #{s.rollNumber || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {s.firstName} {s.lastName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {s.admissionNumber}
                        </td>
                        <td className="py-2.5 px-3 capitalize text-slate-400">
                          {s.gender || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {s.email || s.phone || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs italic">
            You currently have no classes assigned. Contact your school administrator to map your teaching sections.
          </div>
        )}
      </div>
    </TeacherShell>
  );
}

