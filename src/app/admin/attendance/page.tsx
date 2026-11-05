import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { DailyAttendanceClient } from "@/components/admin/DailyAttendanceClient";

export default async function AttendancePage() {
  const user = await getAuthenticatedUser();

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <DailyAttendanceClient />
    </AdminShell>
  );
}

