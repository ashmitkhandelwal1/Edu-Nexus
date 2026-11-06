import React from "react";
import connectToDatabase from "@/lib/mongodb";
import { PlatformSettings } from "@/models/PlatformSettings";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { PlatformSettingsClient } from "@/components/admin/PlatformSettingsClient";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  await connectToDatabase();

  let settings = await PlatformSettings.findOne().lean();
  if (!settings) {
    settings = await PlatformSettings.create({
      institutionName: "Nexus Global Academy",
      institutionEmail: "admin@edunexus.edu",
      institutionPhone: "+91 98765 43210",
      institutionAddress: "Knowledge Campus, Sector 4, Silicon Valley",
      academicYear: "2026-27",
      currency: "INR (₹)",
      timezone: "Asia/Kolkata (IST)",
      attendanceThreshold: 75,
      allowStudentSubmissions: true,
      announcementAutoPublish: true,
    });
  }

  return (
    <AdminShell adminEmail={user.email}>
      <PlatformSettingsClient initialSettings={JSON.parse(JSON.stringify(settings))} />
    </AdminShell>
  );
}

