import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/mongodb";
import "@/models/Announcement";
import { getAuthenticatedUser } from "@/lib/auth";
import { AnnouncementFeedClient } from "@/components/announcements/AnnouncementFeedClient";

export default async function AnnouncementsFeedPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  await connectToDatabase();

  return (
    <AnnouncementFeedClient userRole={user.role} userEmail={user.email} />
  );
}

