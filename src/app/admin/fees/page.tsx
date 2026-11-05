import connectToDatabase from "@/lib/mongodb";
import { Class } from "@/models/Class";
import "@/models/FeeStructure";
import "@/models/FeeRecord";
import "@/models/FeePayment";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { FeeManagementClient } from "@/components/admin/FeeManagementClient";

export default async function AdminFeesPage() {
  const user = await getAuthenticatedUser();
  await connectToDatabase();

  const classes = await Class.find({}, "className section academicYear")
    .sort({ className: 1, section: 1 })
    .lean();

  const serializedClasses = JSON.parse(JSON.stringify(classes));

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <FeeManagementClient initialClasses={serializedClasses} />
    </AdminShell>
  );
}

