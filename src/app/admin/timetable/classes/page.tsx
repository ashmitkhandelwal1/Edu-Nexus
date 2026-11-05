import connectToDatabase from "@/lib/mongodb";
import { Class } from "@/models/Class";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ClassTimetableViewClient } from "@/components/admin/ClassTimetableViewClient";

export default async function AdminClassTimetablePage() {
  const user = await getAuthenticatedUser();
  await connectToDatabase();

  const classes = await Class.find({}, "className section academicYear roomNumber")
    .sort({ className: 1, section: 1 })
    .lean();

  const serializedClasses = JSON.parse(JSON.stringify(classes));

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <ClassTimetableViewClient classes={serializedClasses} />
    </AdminShell>
  );
}

