import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ClassesDirectoryClient } from "@/components/admin/ClassesDirectoryClient";

export default async function ClassesPage() {
  const user = await getAuthenticatedUser();

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <ClassesDirectoryClient />
    </AdminShell>
  );
}

