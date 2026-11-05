import { getTeacherProfile } from "@/lib/teacher-auth";
import { TeacherShell } from "@/components/teacher/TeacherShell";
import { AssignmentDirectoryClient } from "@/components/admin/AssignmentDirectoryClient";

export default async function TeacherAssignmentsPage() {
  const { user, teacher, assignedClasses } = await getTeacherProfile();

  const serializedClasses = assignedClasses.map((c: any) => ({
    _id: c._id.toString(),
    className: c.className,
    section: c.section,
    academicYear: c.academicYear,
    subjects: c.subjects || [],
  }));

  const serializedTeacher = [
    {
      _id: teacher._id.toString(),
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      employeeId: teacher.employeeId,
    },
  ];

  return (
    <TeacherShell
      teacherEmail={user.email}
      teacherName={`${teacher.firstName} ${teacher.lastName}`}
    >
      <div className="space-y-6">
        <AssignmentDirectoryClient
          initialClasses={serializedClasses}
          initialTeachers={serializedTeacher}
        />
      </div>
    </TeacherShell>
  );
}

