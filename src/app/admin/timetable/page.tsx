import connectToDatabase from "@/lib/mongodb";
import { Class } from "@/models/Class";
import { Teacher } from "@/models/Teacher";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { TimetableDirectoryClient } from "@/components/admin/TimetableDirectoryClient";

export default async function AdminTimetablePage() {
  const user = await getAuthenticatedUser();
  await connectToDatabase();

  const [classes, teachers] = await Promise.all([
    Class.find({}, "className section academicYear roomNumber subjects")
      .sort({ className: 1, section: 1 })
      .lean(),
    Teacher.find({ status: "active" }, "firstName lastName employeeId department subjects")
      .sort({ firstName: 1 })
      .lean(),
  ]);

  const serializedClasses = JSON.parse(JSON.stringify(classes));
  const serializedTeachers = JSON.parse(JSON.stringify(teachers));

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <TimetableDirectoryClient
        initialClasses={serializedClasses}
        initialTeachers={serializedTeachers}
      />
    </AdminShell>
  );
}
