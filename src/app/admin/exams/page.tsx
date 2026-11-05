import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ExamsDirectoryClient } from "@/components/admin/ExamsDirectoryClient";

export default async function ExamsPage() {
  const user = await getAuthenticatedUser();

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <ExamsDirectoryClient />
    </AdminShell>
  );
}

