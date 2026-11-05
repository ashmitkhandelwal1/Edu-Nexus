import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { TeachersDirectoryClient } from "@/components/admin/TeachersDirectoryClient";

export default async function TeachersPage() {
  const user = await getAuthenticatedUser();

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <TeachersDirectoryClient />
    </AdminShell>
  );
}

