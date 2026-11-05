import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { AttendanceHistoryClient } from "@/components/admin/AttendanceHistoryClient";

export default async function AttendanceHistoryPage() {
  const user = await getAuthenticatedUser();

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <AttendanceHistoryClient />
    </AdminShell>
  );
}

