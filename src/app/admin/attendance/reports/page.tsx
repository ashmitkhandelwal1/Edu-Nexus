import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { AttendanceReportsClient } from "@/components/admin/AttendanceReportsClient";

export default async function AttendanceReportsPage() {
  const user = await getAuthenticatedUser();

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <AttendanceReportsClient />
    </AdminShell>
  );
}

