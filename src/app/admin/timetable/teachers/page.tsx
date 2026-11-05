import connectToDatabase from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { TeacherTimetableViewClient } from "@/components/admin/TeacherTimetableViewClient";

export default async function AdminTeacherTimetablePage() {
  const user = await getAuthenticatedUser();
  await connectToDatabase();

  const teachers = await Teacher.find(
    { status: "active" },
    "firstName lastName employeeId department subjects"
  )
    .sort({ firstName: 1 })
    .lean();

  const serializedTeachers = JSON.parse(JSON.stringify(teachers));

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <TeacherTimetableViewClient teachers={serializedTeachers} />
    </AdminShell>
  );
}

