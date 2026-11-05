import connectToDatabase from "@/lib/mongodb";
import { Class } from "@/models/Class";
import { Teacher } from "@/models/Teacher";
import "@/models/Assignment";
import "@/models/Submission";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { AssignmentDirectoryClient } from "@/components/admin/AssignmentDirectoryClient";

export default async function AdminAssignmentsPage() {
  const user = await getAuthenticatedUser();
  await connectToDatabase();

  const [classes, teachers] = await Promise.all([
    Class.find({}, "className section academicYear subjects")
      .sort({ className: 1, section: 1 })
      .lean(),
    Teacher.find({ status: "active" }, "firstName lastName employeeId")
      .sort({ firstName: 1 })
      .lean(),
  ]);

  const serializedClasses = JSON.parse(JSON.stringify(classes));
  const serializedTeachers = JSON.parse(JSON.stringify(teachers));

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <AssignmentDirectoryClient
        initialClasses={serializedClasses}
        initialTeachers={serializedTeachers}
      />
    </AdminShell>
  );
}

