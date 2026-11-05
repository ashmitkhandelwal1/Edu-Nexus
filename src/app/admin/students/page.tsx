import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { StudentsDirectoryClient } from "@/components/admin/StudentsDirectoryClient";

export default async function StudentsPage() {
  const user = await getAuthenticatedUser();

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <StudentsDirectoryClient />
    </AdminShell>
  );
}

