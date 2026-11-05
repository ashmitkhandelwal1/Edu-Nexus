import { getTeacherProfile } from "@/lib/teacher-auth";
import { TeacherShell } from "@/components/teacher/TeacherShell";
import { TeacherAttendanceClient } from "@/components/teacher/TeacherAttendanceClient";

export default async function TeacherAttendancePage() {
  const { user, teacher, assignedClasses } = await getTeacherProfile();

  const serializedClasses = assignedClasses.map((c: any) => ({
    _id: c._id.toString(),
    className: c.className,
    section: c.section,
    academicYear: c.academicYear,
  }));

  return (
    <TeacherShell
      teacherEmail={user.email}
      teacherName={`${teacher.firstName} ${teacher.lastName}`}
    >
      <TeacherAttendanceClient assignedClasses={serializedClasses} />
    </TeacherShell>
  );
}

