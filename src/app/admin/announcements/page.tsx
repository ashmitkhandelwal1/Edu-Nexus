import connectToDatabase from "@/lib/mongodb";
import "@/models/Announcement";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { AnnouncementManagementClient } from "@/components/admin/AnnouncementManagementClient";

export default async function AdminAnnouncementsPage() {
  const user = await getAuthenticatedUser();
  await connectToDatabase();

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <AnnouncementManagementClient />
    </AdminShell>
  );
}

